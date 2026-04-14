const router = require("express").Router();
const Menu = require("../models/FoodItems");

const INITIAL_MENU = [
  { id: 1, name: "Masala Dosa", price: 60, category: "Breakfast", quantity: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Masala_dosa.jpg/640px-Masala_dosa.jpg" },
  { id: 2, name: "Idli Vada", price: 50, category: "Breakfast", quantity: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Idli_Sambar.jpg/640px-Idli_Sambar.jpg" },
  { id: 3, name: "Chicken Biryani", price: 150, category: "Lunch", quantity: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Chicken_biryani.jpg/640px-Chicken_biryani.jpg" },
  { id: 4, name: "Veg Meals", price: 80, category: "Lunch", quantity: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Veg-thali-at-Bharat-Restaurant%2C-Mysore.jpg/640px-Veg-thali-at-Bharat-Restaurant%2C-Mysore.jpg" },
  { id: 5, name: "Egg Puffs", price: 20, category: "Snacks", quantity: 20, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Puff_pastry_01.jpg/640px-Puff_pastry_01.jpg" },
  { id: 6, name: "Tea / Coffee", price: 15, category: "Drinks", quantity: 50, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/640px-A_small_cup_of_coffee.JPG" },
  { id: 7, name: "Lime Juice", price: 25, category: "Drinks", quantity: 30, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Lemonade_from_concentrate.jpg/640px-Lemonade_from_concentrate.jpg" },
  { id: 8, name: "Fried Rice", price: 130, category: "Lunch", quantity: 15, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Fried_rice_-_stonesoup.jpg/640px-Fried_rice_-_stonesoup.jpg" },
  { id: 9, name: "Samosa", price: 15, category: "Snacks", quantity: 40, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Samosachutney.jpg/640px-Samosachutney.jpg" },
  { id: 10, name: "Cold Coffee", price: 40, category: "Drinks", quantity: 25, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Single_coffee_latte_on_white_background.jpg/640px-Single_coffee_latte_on_white_background.jpg" },
];

async function seedMenu() {
  const count = await Menu.countDocuments();
  if (count === 0) {
    await Menu.insertMany(INITIAL_MENU);
  }
}

// GET menu
router.get("/", async (req,res)=>{
  await seedMenu();

  // Remove duplicate items (keep only one per numeric id)
  const items = await Menu.find().sort({ id: 1 });

  const seenIds = new Set();
  const duplicates = [];

  for (const item of items) {
    if (seenIds.has(item.id)) {
      duplicates.push(item._id);
    } else {
      seenIds.add(item.id);
    }
  }

  if (duplicates.length > 0) {
    console.log(`[MENU] Found and removing ${duplicates.length} duplicate menu items`);
    await Menu.deleteMany({ _id: { $in: duplicates } });
  }

  const finalItems = await Menu.find().sort({ id: 1 });
  res.json(finalItems);
});

// Add menu item
router.post("/", async (req,res)=>{
  try {
    console.log("[MENU] Creating new item:", req.body);
    const newItem = new Menu(req.body);
    const saved = await newItem.save();
    console.log("[MENU] Item created successfully:", saved._id);
    res.json(saved);
  } catch (err) {
    console.error("[MENU] Failed to create menu item:", err.message);
    res.status(500).json({ error: `Failed to create menu item: ${err.message}` });
  }
});

// Update a menu item by id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log(`[MENU] Updating item ${id} with:`, updateData);

    // Try matching by numeric `id` first, then Mongo `_id`.
    let updated = await Menu.findOneAndUpdate({ id: Number(id) }, updateData, { new: true });
    if (!updated) {
      console.log(`[MENU] Not found by numeric id, trying Mongo _id...`);
      updated = await Menu.findByIdAndUpdate(id, updateData, { new: true });
    }

    if (!updated) {
      console.log(`[MENU] Item not found: ${id}`);
      return res.status(404).json({ error: "Menu item not found" });
    }

    console.log(`[MENU] Update successful:`, updated._id, "quantity:", updated.quantity);
    res.json(updated);
  } catch (err) {
    console.error("[MENU] Failed to update menu item:", err.message);
    res.status(500).json({ error: `Failed to update menu item: ${err.message}` });
  }
});

module.exports = router;