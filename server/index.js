const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const feeCategoryRoutes = require("./routes/feeCategories");
const dashboardRoutes = require("./routes/dashboard");
const parentRoutes = require("./routes/parent");
const paymentRoutes = require("./routes/payments");

const app = express();
const PORT = 5000;

app.use(cors());
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin/fee-categories", feeCategoryRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Server is running 🎉");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.send(`Database connected! Server time: ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).send("Database connection failed: " + err.message);
  }
});

const verifyToken = require("./middleware/verifyToken");
const requireRole = require("./middleware/requireRole");

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
