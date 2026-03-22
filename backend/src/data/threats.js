const express = require("express");
const db = require("../utils/db");

const router = express.Router();

router.get("/threats", (req, res) => {
  db.all(
    `SELECT device_id, event_type, reason, timestamp FROM security_logs ORDER BY timestamp DESC LIMIT 50`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Failed to fetch security logs" });
      res.json(rows);
    }
  );
});

module.exports = router;
