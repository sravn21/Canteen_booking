const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Load configuration from server/.env even when starting from the repo root.
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json());

const Order = require("./models/Order");
const Counter = require("./models/Counter");

async function ensureOrderNumbers() {
  // Ensure any existing orders have an orderNumber set, and keep the counter in sync.
  const missing = await Order.find({ orderNumber: { $exists: false } });
  if (!missing.length) return;

  const maxOrder = await Order.findOne({ orderNumber: { $exists: true } }).sort({ orderNumber: -1 });
  let next = maxOrder ? maxOrder.orderNumber : 0;

  for (const order of missing) {
    next += 1;
    // Update without running validation, since these legacy orders may be missing required fields
    await Order.updateOne({ _id: order._id }, { $set: { orderNumber: next } });
  }

  await Counter.findOneAndUpdate({ name: "orderNumber" }, { seq: next }, { upsert: true });
  console.log(`Backfilled ${missing.length} order(s) with orderNumber up to ${next}`);
}

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("MongoDB Connected");
    await ensureOrderNumbers();
  })
  .catch((err) => console.log(err));

app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/orders", require("./routes/OrderRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});