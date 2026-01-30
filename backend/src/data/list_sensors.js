const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.get("/sensors", (req, res) => {
  const query = `
    SELECT s.sensor_id, s.device_id, s.sensor_type,
      sd.ciphertext, sd.timestamp
    FROM sensors s
    LEFT JOIN (
      SELECT sensor_id, ciphertext, timestamp
      FROM sensor_data
      GROUP BY sensor_id
      HAVING MAX(timestamp)
    ) sd
    ON s.sensor_id = sd.sensor_id
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.json({ error: "DB error fetching sensors" });
    }
    res.json(rows);
  });
});

module.exports = router;
