const bcrypt = require("bcrypt");
const db = require("./db");

db.get("SELECT COUNT(*) AS count FROM users", [], (err, row) => {
  if (err) {
    console.error(err);
    return;
  }

  if (row.count === 0) {
    bcrypt.hash("admin123", 10, (err, hash) => {
      if (err) return console.error(err);

      db.run(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
        ["admin", hash, "admin"],
        () => console.log("Admin user created")
      );
    });
  }
});
