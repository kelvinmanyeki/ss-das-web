const express = require("express");
const cors = require("cors");

const loginRoutes = require("./auth/login");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", loginRoutes);

// Health check (very useful for Render)
app.get("/", (req, res) => {
  res.json({ status: "SS-DAS backend running" });
});

// Use Render's assigned port OR fallback to 3000 locally
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SS-DAS backend running on port ${PORT}`);
});
