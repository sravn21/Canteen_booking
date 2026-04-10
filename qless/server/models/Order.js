const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  items: [
    {
      id: String,
      name: String,
      price: Number,
      qty: Number,
    }
  ],
  total: Number,
  status: {
    type: String,
    default: "preparing",
  },
  paid: {
    type: Boolean,
    default: false,
  },
  time: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);