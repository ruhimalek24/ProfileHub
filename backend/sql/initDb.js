// Creates the database (if missing) and runs schema.sql.
// Usage: npm run db:init
require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Columns added after the first version of the users table.
// CREATE TABLE IF NOT EXISTS does not change an existing table, so each
// column is added here only if it is missing. Safe to run more than once.
// (MySQL 8.0 has no "ADD COLUMN IF NOT EXISTS", so we check first.)
const NEW_COLUMNS = [
  {
    name: 'profile_picture',
    sql: 'ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL DEFAULT NULL AFTER email',
  },
  {
    name: 'failed_password_attempts',
    sql: 'ALTER TABLE users ADD COLUMN failed_password_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER password_hash',
  },
  {
    name: 'password_locked_until',
    sql: 'ALTER TABLE users ADD COLUMN password_locked_until DATETIME NULL DEFAULT NULL AFTER failed_password_attempts',
  },
];

// Adds any missing columns from NEW_COLUMNS. Never changes existing data.
async function addMissingColumns(connection, dbName) {
  const [rows] = await connection.query(
    'SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [dbName, 'users']
  );
  const existing = new Set(rows.map((row) => row.name));

  for (const column of NEW_COLUMNS) {
    if (existing.has(column.name)) {
      console.log(`Column ${column.name} already exists, skipped.`);
      continue;
    }
    await connection.query(column.sql);
    console.log(`Added column ${column.name}.`);
  }
}

async function initDb() {
  const dbName = process.env.DB_NAME || 'project1_db';

  // Connect without a database first, so we can create it.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  // escapeId safely quotes the name, e.g. `project1_db`
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(dbName)}`);
  await connection.query(`USE ${mysql.escapeId(dbName)}`);

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await connection.query(schema);
  await addMissingColumns(connection, dbName);

  console.log(`Database "${dbName}" and users table are ready.`);
  await connection.end();
}

initDb().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
