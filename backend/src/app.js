const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

require("./utils/initDb");
require("./utils/initAdmin");

const login = require("./auth/login");
const challengePUF = require("./auth/challenge");

const deviceRegister = require("./devices/register");

const sensorRegister = require("./sensors/register");

const dataIngest = require("./data/ingest");

const listSensors = require("./data/list_sensors");
const sensorHistory = require("./data/sensor_history");

const app = express();

app.use(cors());
app.use(express.json());

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use("/auth", login);
app.use("/auth", challengePUF);
app.use("/devices", deviceRegister);
app.use("/sensors", sensorRegister);
app.use("/data", dataIngest);
app.use("/data", listSensors);
app.use("/data", sensorHistory);

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
  });
}

module.exports = app;
