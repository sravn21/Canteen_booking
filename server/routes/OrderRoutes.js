const router = require("express").Router();
const Order = require("../models/Order");
const Counter = require("../models/Counter");

// Generate the next order number in a robust way.
// This handles corner cases where the counter document is missing or the value drifts.
async function getNextOrderNumber() {
  // Try the counter first
  const counter = await Counter.findOneAndUpdate(
    { name: "orderNumber" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  if (counter && typeof counter.seq === "number") {
    return counter.seq;
  }

  // Fallback: find the current max orderNumber
  const maxOrder = await Order.findOne({ orderNumber: { $exists: true } }).sort({ orderNumber: -1 });
  const next = maxOrder ? (maxOrder.orderNumber || 0) + 1 : 1;
  await Counter.findOneAndUpdate({ name: "orderNumber" }, { seq: next }, { upsert: true });
  return next;
}

// Place order
router.post("/", async (req,res)=>{
  const orderData = { ...(req.body || {}) };

  // Basic validation / defaults (prevents Mongoose missing-field errors)
  orderData.studentId = (orderData.studentId || "").toString().trim() || "UNKNOWN";
  orderData.studentName = (orderData.studentName || "").toString().trim() || "Unknown";
  orderData.items = Array.isArray(orderData.items) ? orderData.items : [];
  orderData.total = Number(orderData.total) || 0;
  orderData.status = orderData.status || "preparing";
  orderData.paid = Boolean(orderData.paid);
  orderData.time = orderData.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Ensure we always attach a strong sequential orderNumber.
  // If there is a concurrent write collision (duplicate key), retry a few times.
  const maxTries = 3;
  for (let attempt = 1; attempt <= maxTries; attempt += 1) {
    try {
      orderData.orderNumber = await getNextOrderNumber();
      const order = new Order(orderData);
      const saved = await order.save();
      return res.json(saved);
    } catch (err) {
      // Duplicate key on orderNumber can happen if counter drifts; retry
      if (err.code === 11000 && attempt < maxTries) {
        continue;
      }
      console.error("Failed to save order", err);
      return res.status(500).json({ error: "Failed to place order" });
    }
  }
});

// Get orders (sorted by orderNumber ascending)
router.get("/", async (req,res)=>{
  let orders = await Order.find().sort({ orderNumber: 1 });

  // If any existing orders are missing orderNumber, backfill them.
  // This ensures all clients can render a stable order ID.
  const missing = orders.filter(o => o.orderNumber == null);
  if (missing.length) {
    const maxOrder = await Order.findOne({ orderNumber: { $exists: true } }).sort({ orderNumber: -1 });
    let next = maxOrder ? (maxOrder.orderNumber || 0) : 0;

    for (const order of missing) {
      next += 1;
      order.orderNumber = next;
      await order.save();
    }

    orders = await Order.find().sort({ orderNumber: 1 });
  }

  res.json(orders);
});

// Update order (status/payment)
router.put("/:id", async (req,res)=>{
  const { id } = req.params;

  // Try by Mongo _id first, then fallback to our custom `id` field.
  let order = await Order.findByIdAndUpdate(id, req.body, { new: true });
  if (!order) {
    order = await Order.findOneAndUpdate({ id }, req.body, { new: true });
  }

  res.json(order);
});

// Cancel order and restore stock
router.put("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the order
    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ id });
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "preparing") {
      return res.status(400).json({ error: "Only preparing orders can be cancelled." });
    }
    
    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Order is already cancelled." });
    }

    // Restore quantites for each item
    const Menu = require("../models/FoodItems");
    for (const item of order.items) {
      // item.id could be string "1", Menu.id is Number
      const qtyToRestore = Number(item.qty || item.quantity || 0);
      
      await Menu.findOneAndUpdate(
        { id: Number(item.id) },
        { 
          $inc: { quantity: qtyToRestore },
          $set: { inStock: true }
        }
      );
    }

    // Update the order status
    order.status = "cancelled";
    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Order Cancellation Error:", err);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

module.exports = router;