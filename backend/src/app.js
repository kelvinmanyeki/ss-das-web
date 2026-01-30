const express = require("express");
const cors = require("cors");

const login = require("./auth/login");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Health check (VERY IMPORTANT for Render)
app.get("/", (req, res) => {
  res.json({ status: "SS-DAS backend running" });
});

app.use("/auth", login);

// ✅ Render provides PORT via env
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SS-DAS backend running on port ${PORT}`);
});
