const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
    image: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep inStock in sync with quantity
menuSchema.pre("save", function () {
  if (this.quantity != null) {
    this.inStock = this.quantity > 0;
  }
});

menuSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};
  // When quantity is updated, also update inStock.
  if (update.quantity != null) {
    update.inStock = update.quantity > 0;
    this.setUpdate(update);
  }
});

module.exports = mongoose.model("Menu", menuSchema);