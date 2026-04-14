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

// ✅ Pre-warm EasyOCR at server startup (so first payment request is fast)
async function warmupOCR() {
  try {
    console.log("🔥 Warming up EasyOCR model (this takes 20-40 seconds, happens once)...");
    const { exec } = require("child_process");
    const pythonPath = "C:\\Python312\\python.exe";
    const scriptPath = path.join(__dirname, "./ocr/cl_ocr_label.py");

    await new Promise((resolve, reject) => {
      // Run Python to initialize the reader without processing any image
      const initScript = `
import sys
sys.path.insert(0, r'${path.join(__dirname, "./ocr")}')
from cl_ocr_label import get_ocr_reader
print("[WARMUP] Initializing EasyOCR reader...")
reader = get_ocr_reader()
print("[WARMUP] EasyOCR ready!")
`;

      exec(`"${pythonPath}" -c "${initScript.replace(/"/g, '\\"')}"`,
        { timeout: 120000 },
        (error, stdout, stderr) => {
          if (error) {
            console.warn("⚠️  EasyOCR warmup failed (OCR will initialize on first use):", error.message);
            resolve(); // Don't reject—let server continue
          } else {
            console.log("✅ EasyOCR warmed up successfully!");
            resolve();
          }
        }
      );
    });
  } catch (err) {
    console.warn("⚠️  EasyOCR warmup error (non-critical):", err.message);
  }
}

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(async (m) => {
    console.log("✅ MongoDB Connected");
    console.log("🔥 DB NAME:", m.connection.db.databaseName); // Real DB name
    await ensureOrderNumbers();

    // Warm up EasyOCR in background (non-blocking)
    warmupOCR().catch(err => console.warn("⚠️  OCR warmup issue:", err));
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