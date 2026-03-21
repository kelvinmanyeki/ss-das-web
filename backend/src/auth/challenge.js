const express = require("express");
const crypto = require("crypto");
const db = require("../utils/db");

const router = express.Router();

// GET /auth/challenge?device_id=ESP32_SECURE_01
router.get("/challenge", (req, res) => {
  const { device_id } = req.query;

  if (!device_id) {
    return res.status(400).json({ error: "device_id is required" });
  }

  // Generate a random 32-byte challenge for the PUF
  const challenge = crypto.randomBytes(32).toString("hex");

  // Store or update the challenge for this specific device
  db.run(
    `INSERT INTO puf_challenges (device_id, challenge) 
     VALUES (?, ?) 
     ON CONFLICT(device_id) DO UPDATE SET challenge=excluded.challenge`,
    [device_id, challenge],
    (err) => {
      if (err) {
        console.error("DB error saving challenge:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ challenge });
    }
  );
});

module.exports = router;
