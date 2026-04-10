const router = require("express").Router();
const Menu = require("../models/FoodItems");

const INITIAL_MENU = [
  { id: 1, name: "Masala Dosa", price: 60, category: "Breakfast", available: false, stock: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Masala_dosa.jpg/640px-Masala_dosa.jpg" },
  { id: 2, name: "Idli Vada", price: 50, category: "Breakfast", available: false, stock: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Idli_Sambar.jpg/640px-Idli_Sambar.jpg" },
  { id: 3, name: "Chicken Biryani", price: 150, category: "Lunch", available: false, stock: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Chicken_biryani.jpg/640px-Chicken_biryani.jpg" },
  { id: 4, name: "Veg Meals", price: 80, category: "Lunch", available: false, stock: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Veg-thali-at-Bharat-Restaurant%2C-Mysore.jpg/640px-Veg-thali-at-Bharat-Restaurant%2C-Mysore.jpg" },
  { id: 5, name: "Egg Puffs", price: 20, category: "Snacks", available: true, stock: 20, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Puff_pastry_01.jpg/640px-Puff_pastry_01.jpg" },
  { id: 6, name: "Tea / Coffee", price: 15, category: "Drinks", available: true, stock: 50, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/640px-A_small_cup_of_coffee.JPG" },
  { id: 7, name: "Lime Juice", price: 25, category: "Drinks", available: true, stock: 30, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Lemonade_from_concentrate.jpg/640px-Lemonade_from_concentrate.jpg" },
  { id: 8, name: "Fried Rice", price: 130, category: "Lunch", available: true, stock: 15, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Fried_rice_-_stonesoup.jpg/640px-Fried_rice_-_stonesoup.jpg" },
  { id: 9, name: "Samosa", price: 15, category: "Snacks", available: true, stock: 40, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Samosachutney.jpg/640px-Samosachutney.jpg" },
  { id: 10, name: "Cold Coffee", price: 40, category: "Drinks", available: true, stock: 25, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Single_coffee_latte_on_white_background.jpg/640px-Single_coffee_latte_on_white_background.jpg" },
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
  const items = await Menu.find().sort({ id: 1 });
  res.json(items);
});

// Add menu item
router.post("/", async (req,res)=>{
  const newItem = new Menu(req.body);
  const saved = await newItem.save();
  res.json(saved);
});

module.exports = router;