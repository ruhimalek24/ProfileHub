const mysql = require('mysql2/promise');

// One shared pool of connections for the whole app.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'project1_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
