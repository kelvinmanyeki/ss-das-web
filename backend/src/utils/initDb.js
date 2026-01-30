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
    
  // SENSORS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS sensors (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     sensor_id TEXT UNIQUE,
     device_id TEXT,
     sensor_type TEXT,
     FOREIGN KEY(device_id) REFERENCES devices(device_id)
    )
 `);


  console.log("✅ Database tables initialized");
});
