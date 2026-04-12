const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Models
const Order = require("./models/Order");
const Counter = require("./models/Counter");

// ✅ DEBUG (IMPORTANT)
console.log("🔥 Server file loaded");

// ✅ Ensure order numbers exist
async function ensureOrderNumbers() {
  const missing = await Order.find({ orderNumber: { $exists: false } });

  if (!missing.length) return;

  const maxOrder = await Order.findOne({ orderNumber: { $exists: true } })
    .sort({ orderNumber: -1 });

  let next = maxOrder ? maxOrder.orderNumber : 0;

  for (const order of missing) {
    next += 1;
    await Order.updateOne(
      { _id: order._id },
      { $set: { orderNumber: next } }
    );
  }

  await Counter.findOneAndUpdate(
    { name: "orderNumber" },
    { seq: next },
    { upsert: true }
  );

  console.log(`Backfilled ${missing.length} order(s)`);
}

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(async (m) => {
    console.log("✅ MongoDB Connected");
    console.log("🔥 DB NAME:", m.connection.db.databaseName); // Real DB name
    await ensureOrderNumbers();
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
  });

// ✅ Routes (order matters — auth must be before /api catch-all)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/orders", require("./routes/OrderRoutes"));
app.use("/api/process_payment", require("./routes/paymentRoutes"));

// ✅ TEST ROUTE
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend connected successfully ✅" });
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ✅ Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

// ✅ Start
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});