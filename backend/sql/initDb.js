// Creates the database (if missing) and runs schema.sql.
// Usage: npm run db:init
require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

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

  console.log(`Database "${dbName}" and users table are ready.`);
  await connection.end();
}

initDb().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
