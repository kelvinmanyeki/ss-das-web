const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.get("/sensors", (req, res) => {
  const query = `
    SELECT s.sensor_id, s.device_id, s.sensor_type,
      sd.ciphertext, sd.timestamp
    FROM sensor_data sd
    JOIN sensors s ON sd.sensor_id = s.sensor_id
    ORDER BY sd.timestamp DESC
    LIMIT 100
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.json({ error: "DB error fetching sensors" });
    }
    res.json(rows);
  });
});

module.exports = router;
