const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/ss-das.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      role TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE,
      public_key TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT,
      device_id TEXT,
      ciphertext TEXT,
      nonce TEXT,
      timestamp INTEGER
    )
  `);
});

module.exports = db;
