const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.post("/ingest", (req, res) => {
  const { device_id, sensor_id, ciphertext, nonce, timestamp } = req.body;

  if (!device_id || !sensor_id || !ciphertext || !nonce || !timestamp) {
    return res.json({ error: "Missing fields in payload" });
  }

  db.run(
    `INSERT INTO sensor_data (sensor_id, device_id, ciphertext, nonce, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [sensor_id, device_id, ciphertext, nonce, timestamp],
    (err) => {
      if (err) {
        return res.json({ error: "DB error while storing sensor data" });
      }
      res.json({ success: true, message: "Sensor data ingested" });
    }
  );
});

module.exports = router;
