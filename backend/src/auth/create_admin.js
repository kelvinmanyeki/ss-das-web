const bcrypt = require("bcrypt");
const db = require("../utils/db");

const username = "admin";
const password = "admin123";

bcrypt.hash(password, 10, (err, hash) => {
  db.run(
    `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
    [username, hash, "admin"],
    (err) => {
      if (err) console.log("Admin already exists");
      else console.log("Admin created");
    }
  );
});
