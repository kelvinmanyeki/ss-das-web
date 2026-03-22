const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.post("/register", (req, res) => {
  const { device_id, public_key, puf_secret } = req.body;

  if (!device_id || !public_key || !puf_secret) {
    return res.json({ error: "Missing device_id, public_key, or puf_secret" });
  }

  db.run(
    `INSERT INTO devices (device_id, public_key, puf_secret) VALUES (?, ?, ?)`,
    [device_id, public_key, puf_secret],
    (err) => {
      if (err) {
        return res.json({ error: "Device already registered or DB error" });
      }
      res.json({ success: true, message: "Device registered successfully" });
    }
  );
});

module.exports = router;
