const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.post("/register", (req, res) => {
  const { device_id, public_key } = req.body;

  if (!device_id || !public_key) {
    return res.json({ error: "Missing device_id or public_key" });
  }

  db.run(
    `INSERT INTO devices (device_id, public_key) VALUES (?, ?)`,
    [device_id, public_key],
    (err) => {
      if (err) {
        return res.json({ error: "Device already registered or DB error" });
      }
      res.json({ success: true, message: "Device registered successfully" });
    }
  );
});

module.exports = router;
