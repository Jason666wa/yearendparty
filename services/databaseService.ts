import mysql from 'mysql2/promise';
import { TableData } from '../types.js';

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

  // 关闭连接池
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default DatabaseService;
