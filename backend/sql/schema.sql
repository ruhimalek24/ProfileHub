-- Users table. Run with: npm run db:init
CREATE TABLE IF NOT EXISTS users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  profile_picture VARCHAR(255) NULL DEFAULT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  failed_password_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  password_locked_until DATETIME NULL DEFAULT NULL,
  login_count    INT UNSIGNED NOT NULL DEFAULT 0,
  last_login     DATETIME NULL,
  previous_login DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
