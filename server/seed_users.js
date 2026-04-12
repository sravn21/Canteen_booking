const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

async function seed() {
  await mongoose.connect("mongodb://127.0.0.1:27017/smart-canteen");
  console.log("Connected to MongoDB");

  // Remove old broken users
  await User.deleteMany({});
  console.log("Cleared old users");

  const salt = await bcrypt.genSalt(10);

  const users = [
    {
      studentId: "STU001",
      name: "Student User",
      password: await bcrypt.hash("stu123", salt),
      role: "student",
    },
    {
      studentId: "ADMIN",
      name: "Admin",
      password: await bcrypt.hash("admin123", salt),
      role: "admin",
    },
  ];

  await User.insertMany(users);
  console.log("✅ Users created:");
  console.log("   Student → ID: STU001  | Pass: stu123");
  console.log("   Admin   → ID: ADMIN   | Pass: admin123");

  process.exit(0);
}

seed().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
