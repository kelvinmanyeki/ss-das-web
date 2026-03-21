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

  // DEVICES TABLE (augmented for PUF simulation)
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE,
      public_key TEXT,
      puf_secret TEXT
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
    
  // SENSOR DATA TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     sensor_id TEXT,
     device_id TEXT,
     ciphertext TEXT,
     nonce TEXT,
     timestamp INTEGER,
     hmac TEXT,
     signature TEXT
    )
 `);

  // PUF CHALLENGES TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS puf_challenges (
      device_id TEXT PRIMARY KEY,
      challenge TEXT
    )
  `);

  console.log("✅ Database tables initialized (Advanced Security)");
});
