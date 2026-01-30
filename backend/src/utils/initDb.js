const db = require("./db");

db.serialize(() => {
  // USERS TABLE (needed for login)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT,
      role TEXT
    )
  `);

  // DEVICES TABLE (what you asked for)
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE,
      public_key TEXT
    )
  `);

  console.log("✅ Database tables initialized");
});
