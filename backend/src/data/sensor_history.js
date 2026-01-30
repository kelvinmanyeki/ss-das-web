const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.get("/sensor/:id", (req, res) => {
  const sensorId = req.params.id;

  db.all(
    `SELECT * FROM sensor_data WHERE sensor_id = ? ORDER BY timestamp DESC`,
    [sensorId],
    (err, rows) => {
      if (err) {
        return res.json({ error: "DB error fetching sensor history" });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
