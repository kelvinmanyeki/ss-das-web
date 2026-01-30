const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "..", "db", "ss-das.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to SQLite DB");
});

module.exports = db;
