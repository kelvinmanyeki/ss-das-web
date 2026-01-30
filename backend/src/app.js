const express = require("express");
const cors = require("cors");

require("./utils/initDb");
require("./utils/initAdmin");

const login = require("./auth/login");

const deviceRegister = require("./devices/register");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", login);

app.get("/", (req, res) => {
  res.json({ status: "SS-DAS backend running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

app.use("/devices", deviceRegister);
