import mysql from 'mysql2/promise';
import { TableData, PhotoData, VotingStatus } from '../types.js';

interface TableRow {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface SeatRow {
  id: string;
  table_id: string;
  seat_number: number;
  attendee_name: string | null;
}

class DatabaseService {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'appuser',
      password: process.env.DB_PASSWORD || 'rootpassword',
      database: process.env.DB_NAME || 'yearendparty',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });
  }

  // 测试数据库连接
  async testConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // 初始化数据库（如果表为空，插入初始数据）
  async initializeData(initialData: TableData[]): Promise<void> {
    try {
      // 检查是否已有数据
      const [tables] = await this.pool.execute<mysql.RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM tables'
      );
      const count = (tables[0] as { count: number }).count;

      if (count === 0) {
        console.log('Initializing database with default data...');
        await this.saveTables(initialData);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // 获取所有桌子和座位
  async getTables(): Promise<TableData[]> {
    try {
      // 获取所有桌子
      const [tables] = await this.pool.execute<mysql.RowDataPacket[]>(
        'SELECT id, name, x, y FROM tables ORDER BY id'
      );

      // 获取所有座位
      const [seats] = await this.pool.execute<mysql.RowDataPacket[]>(
        'SELECT id, table_id, seat_number, attendee_name FROM seats ORDER BY table_id, seat_number'
      );

      // 将座位按 table_id 分组
      const seatsByTable: Record<string, Array<{ id: string; seatNumber: number; attendeeName: string | null }>> = {};
      (seats as SeatRow[]).forEach((seat) => {
        if (!seatsByTable[seat.table_id]) {
          seatsByTable[seat.table_id] = [];
        }
        seatsByTable[seat.table_id].push({
          id: seat.id,
          seatNumber: seat.seat_number,
          attendeeName: seat.attendee_name
        });
      });

      // 组合成 TableData 格式
      return (tables as TableRow[]).map((table) => ({
        id: table.id,
        name: table.name,
        x: table.x,
        y: table.y,
        seats: seatsByTable[table.id] || []
      }));
    } catch (error) {
      console.error('Failed to get tables:', error);
      throw error;
    }
  }

  // 保存所有桌子和座位
  async saveTables(tables: TableData[]): Promise<void> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      // 清空现有数据
      await connection.execute('DELETE FROM seats');
      await connection.execute('DELETE FROM tables');

      // 插入桌子
      for (const table of tables) {
        await connection.execute(
          'INSERT INTO tables (id, name, x, y) VALUES (?, ?, ?, ?)',
          [table.id, table.name, table.x, table.y]
        );

        // 插入座位
        for (const seat of table.seats) {
          await connection.execute(
            'INSERT INTO seats (id, table_id, seat_number, attendee_name) VALUES (?, ?, ?, ?)',
            [seat.id, table.id, seat.seatNumber, seat.attendeeName]
          );
        }
      }

      await connection.commit();
      console.log('Tables saved successfully');
    } catch (error) {
      await connection.rollback();
      console.error('Failed to save tables:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ========== 照片相关方法 ==========
  
  // 添加照片
  async addPhoto(photo: Omit<PhotoData, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.pool.execute(
        'INSERT INTO photos (id, filename, original_filename, file_path, uploader_ip, vote_count) VALUES (?, ?, ?, ?, ?, ?)',
        [photo.id, photo.filename, photo.originalFilename, photo.filePath, photo.uploaderIp, photo.voteCount || 0]
      );
    } catch (error) {
      console.error('Failed to add photo:', error);
      throw error;
    }
  }

  // 获取所有照片（带投票信息）
  async getPhotos(voterIp?: string): Promise<PhotoData[]> {
    try {
      const [photos] = await this.pool.execute<mysql.RowDataPacket[]>(
        'SELECT id, filename, original_filename, file_path, uploader_ip, vote_count, created_at, updated_at FROM photos ORDER BY created_at DESC'
      );

      const photoList: PhotoData[] = (photos as any[]).map(photo => ({
        id: photo.id,
        filename: photo.filename,
        originalFilename: photo.original_filename,
        filePath: photo.file_path,
        uploaderIp: photo.uploader_ip,
        voteCount: photo.vote_count,
        createdAt: photo.created_at,
        updatedAt: photo.updated_at,
        hasVoted: false, // 默认值，后面会根据实际情况更新
      }));

      // 如果提供了voterIp，检查每张照片是否已投票
      if (voterIp) {
        const photoIds = photoList.map(p => p.id);
        if (photoIds.length > 0) {
          const placeholders = photoIds.map(() => '?').join(',');
          const [votes] = await this.pool.execute<mysql.RowDataPacket[]>(
            `SELECT photo_id FROM votes WHERE photo_id IN (${placeholders}) AND voter_ip = ?`,
            [...photoIds, voterIp]
          );
          const votedPhotoIds = new Set((votes as any[]).map(v => v.photo_id));
          photoList.forEach(photo => {
            photo.hasVoted = votedPhotoIds.has(photo.id);
          });
        }
      }

      return photoList;
    } catch (error) {
      console.error('Failed to get photos:', error);
      throw error;
    }
  }

  // 投票
  async votePhoto(photoId: string, voterIp: string): Promise<boolean> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      // 检查是否已经投过票
      const [existing] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM votes WHERE photo_id = ? AND voter_ip = ?',
        [photoId, voterIp]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return false; // 已经投过票
      }

      // 插入投票记录
      const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await connection.execute(
        'INSERT INTO votes (id, photo_id, voter_ip) VALUES (?, ?, ?)',
        [voteId, photoId, voterIp]
      );

      // 更新照片的投票数
      await connection.execute(
        'UPDATE photos SET vote_count = vote_count + 1 WHERE id = ?',
        [photoId]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Failed to vote photo:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ========== 投票设置相关方法 ==========

  // 获取投票状态
  async getVotingStatus(): Promise<VotingStatus> {
    try {
      const [settings] = await this.pool.execute<mysql.RowDataPacket[]>(
        'SELECT setting_key, setting_value FROM voting_settings WHERE setting_key IN (?, ?)',
        ['voting_enabled', 'voting_stopped']
      );

      const status: VotingStatus = {
        votingEnabled: true,
        votingStopped: false,
      };

      (settings as any[]).forEach(setting => {
        if (setting.setting_key === 'voting_enabled') {
          status.votingEnabled = setting.setting_value === 'true';
        } else if (setting.setting_key === 'voting_stopped') {
          status.votingStopped = setting.setting_value === 'true';
        }
      });

      return status;
    } catch (error) {
      console.error('Failed to get voting status:', error);
      throw error;
    }
  }

  // 更新投票状态
  async updateVotingStatus(status: Partial<VotingStatus>): Promise<void> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      if (status.votingEnabled !== undefined) {
        await connection.execute(
          'INSERT INTO voting_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          ['voting_enabled', status.votingEnabled ? 'true' : 'false', status.votingEnabled ? 'true' : 'false']
        );
      }

      if (status.votingStopped !== undefined) {
        await connection.execute(
          'INSERT INTO voting_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          ['voting_stopped', status.votingStopped ? 'true' : 'false', status.votingStopped ? 'true' : 'false']
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Failed to update voting status:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // 关闭连接池
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default DatabaseService;
