const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../utils/db");

const router = express.Router();

// ⚠️ Move this to Render ENV later
const SECRET = process.env.JWT_SECRET || "super-secret-key";

// POST /auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      bcrypt.compare(password, user.password_hash, (err, match) => {
        if (err) {
          return res.status(500).json({ error: "Authentication error" });
        }

        if (!match) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            role: user.role,
          },
          SECRET,
          { expiresIn: "2h" }
        );

        res.json({ token });
      });
    }
  );
});

module.exports = router;
