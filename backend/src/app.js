const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

require("./utils/initDb");

const login = require("./auth/login");
const challengePUF = require("./auth/challenge");

const deviceRegister = require("./devices/register");

const sensorRegister = require("./sensors/register");

const dataIngest = require("./data/ingest");

const listSensors = require("./data/list_sensors");
const sensorHistory = require("./data/sensor_history");
const threatLogs = require("./data/threats");

const app = express();

app.use(cors());
app.use(express.json());
// Temporary removal of rate-limit for the user demonstration to prevent Proxy Lockouts
// app.use(limiter);
app.use("/auth", login);
app.use("/auth", challengePUF);
app.use("/devices", deviceRegister);
app.use("/sensors", sensorRegister);
app.use("/data", dataIngest);
app.use("/data", listSensors);
app.use("/data", sensorHistory);
app.use("/data", threatLogs);

// Serve the frontend dashboard directly from the Render URL
const path = require("path");
app.use(express.static(path.join(__dirname, "../../docs")));

app.get("/status", (req, res) => {
  res.json({ status: "SS-DAS backend running" });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    
    // Auto-Seed ephemeral databases after a short startup delay!
    setTimeout(() => {
      const db = require("./utils/db");
      db.get('SELECT COUNT(*) as count FROM sensor_data', (err, row) => {
        if (err) console.error("Seeder DB Check Error:", err);
        if (row && row.count === 0) {
          console.log("Empty SQLite database detected (Ephemeral Boot). Seeding mock data...");
          const { exec } = require('child_process');
          const path = require('path');
          const scriptPath = path.join(__dirname, "..", "..", "scripts", "deploy_mock_data.js");
          
          exec(`node "${scriptPath}"`, { env: { ...process.env, SEEDING: "true" } }, (err, stdout, stderr) => {
            if (err) console.error("Seeding failed:", stderr);
            else console.log("Seeding complete!\n", stdout);
          });
        }
      });
    }, 3000);

  });
}

module.exports = app;
