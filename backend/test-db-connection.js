import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

console.log('Testing connection with URL:', process.env.DATABASE_URL.replace(/password123/, '***'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

pool.query('SELECT version()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
  console.log('✅ Connected successfully!');
  console.log('PostgreSQL version:', res.rows[0].version);
  pool.end();
  process.exit(0);
});
