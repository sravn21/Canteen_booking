const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/authMiddleware");
const { getMenu, addItem, updateItem, deleteItem } = require("../controllers/menuController");

// Public route
router.get("/", getMenu);

// Admin only routes
router.post("/", protect, isAdmin, addItem);
router.put("/:id", protect, isAdmin, updateItem);
router.delete("/:id", protect, isAdmin, deleteItem);

module.exports = router;