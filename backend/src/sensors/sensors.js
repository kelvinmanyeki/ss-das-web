const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.post("/register", (req, res) => {
  const { sensor_id, device_id, sensor_type } = req.body;

  if (!sensor_id || !device_id || !sensor_type) {
    return res.json({ error: "Missing sensor_id, device_id, or sensor_type" });
  }

  db.run(
    `INSERT INTO sensors (sensor_id, device_id, sensor_type) VALUES (?, ?, ?)`,
    [sensor_id, device_id, sensor_type],
    (err) => {
      if (err) {
        return res.json({ error: "Sensor already registered or DB error" });
      }
      res.json({ success: true, message: "Sensor registered successfully" });
    }
  );
});

module.exports = router;
