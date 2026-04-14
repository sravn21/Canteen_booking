const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/smart-canteen");

  const studentId = "STU001";
  const password = "stu123";

  console.log("Step 1: Finding user...");
  const user = await User.findOne({ studentId });
  console.log("Step 2: user found:", user ? user.studentId : "null");

  if (!user) { console.log("No user found!"); process.exit(0); }

  console.log("Step 3: comparing password...");
  const isMatch = await bcrypt.compare(password, user.password);
  console.log("Step 4: isMatch =", isMatch);

  process.exit(0);
}

run().catch(e => {
  console.error("❌ CRASHED AT:", e.message);
  console.error(e.stack);
  process.exit(1);
});
