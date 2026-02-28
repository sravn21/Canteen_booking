const FoodItem = require("../models/FoodItems");

// Get all available menu items (public)
const getMenu = async (req, res) => {
  try {
    const items = await FoodItem.find({ available: true });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new food item (admin only)
const addItem = async (req, res) => {
  try {
    const { name, price, stock, available } = req.body;

    const item = await FoodItem.create({
      name,
      price,
      stock,
      available: available !== undefined ? available : true,
    });

    res.status(201).json({
      message: "Food item added successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update food item (admin only)
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, available } = req.body;

    const item = await FoodItem.findByIdAndUpdate(
      id,
      { name, price, stock, available },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Food item not found" });
    }

    res.json({
      message: "Food item updated successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete food item (admin only)
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await FoodItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: "Food item not found" });
    }

    res.json({ message: "Food item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMenu, addItem, updateItem, deleteItem };