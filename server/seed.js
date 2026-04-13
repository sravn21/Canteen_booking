const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/canteen_booking";

async function seed() {
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to MongoDB");

  // Clear existing users
  await User.deleteMany({});
  console.log("🗑️  Cleared existing users");

  const hashedStudentPass = await bcrypt.hash("pass123", 10);
  const hashedAdminPass = await bcrypt.hash("admin123", 10);

  await User.create([
    {
      studentId: "STU001",
      name: "Rahul Kumar",
      password: hashedStudentPass,
      role: "student",
    },
    {
      studentId: "ADMIN",
      name: "Admin",
      password: hashedAdminPass,
      role: "admin",
    },
  ]);

  console.log("🌱 Seeded users:");
  console.log("   Student → ID: STU001  | Password: pass123");
  console.log("   Admin   → ID: ADMIN   | Password: admin123");

  await mongoose.disconnect();
  console.log("✅ Done!");
}

seed().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
