const express = require("express");
const cors = require("cors");

require("./utils/initDb");
require("./utils/initAdmin");

const login = require("./auth/login");

const deviceRegister = require("./devices/register");

const sensorRegister = require("./sensors/register");

const dataIngest = require("./data/ingest");

const listSensors = require("./data/list_sensors");
const sensorHistory = require("./data/sensor_history");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", login);
app.use("/devices", deviceRegister);
app.use("/sensors", sensorRegister);
app.use("/data", dataIngest);
app.use("/data", listSensors);
app.use("/data", sensorHistory);

app.get("/", (req, res) => {
  res.json({ status: "SS-DAS backend running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
