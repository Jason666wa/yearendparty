-- 创建数据库
CREATE DATABASE IF NOT EXISTS yearendparty CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yearendparty;
-- 创建 tables 表
CREATE TABLE IF NOT EXISTS tables (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  x INT NOT NULL,
  y INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- 创建 seats 表
CREATE TABLE IF NOT EXISTS seats (
  id VARCHAR(50) PRIMARY KEY,
  table_id VARCHAR(50) NOT NULL,
  seat_number INT NOT NULL,
  attendee_name VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE,
  INDEX idx_table_id (table_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- 创建 photos 表
CREATE TABLE IF NOT EXISTS photos (
  id VARCHAR(50) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploader_ip VARCHAR(45) NOT NULL,
  vote_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vote_count (vote_count),
  INDEX idx_created_at (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- 创建 votes 表（记录每个IP对每张照片的投票）
CREATE TABLE IF NOT EXISTS votes (
  id VARCHAR(50) PRIMARY KEY,
  photo_id VARCHAR(50) NOT NULL,
  voter_ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_photo_ip (photo_id, voter_ip),
  INDEX idx_photo_id (photo_id),
  INDEX idx_voter_ip (voter_ip)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- 创建 voting_settings 表（投票设置）
CREATE TABLE IF NOT EXISTS voting_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- 初始化投票设置
INSERT INTO voting_settings (setting_key, setting_value)
VALUES ('voting_enabled', 'true'),
  ('voting_stopped', 'false') ON DUPLICATE KEY
UPDATE setting_value = setting_value;