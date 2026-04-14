const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");

console.log("✅ authRoutes.js loaded, User model:", !!User);

router.post("/register", async (req, res) => {
    try {
        console.log("📝 [1] Registration request received");
        console.log("📝 [2] req.body:", req.body);

        let { studentId, password, name } = req.body;
        console.log("📝 [3] studentId:", studentId, "password:", !!password, "name:", name);

        // Validation
        if (!studentId || !password) {
            return res.status(400).json({ error: "Missing studentId or password" });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: "Password must be at least 4 characters" });
        }

        studentId = studentId.toUpperCase();
        console.log("📝 [4] Checking for duplicate studentId:", studentId);

        // Check if student already exists
        const existingUser = await User.findOne({ studentId });
        if (existingUser) {
            console.log("📝 [5] ❌ Student ID already registered");
            return res.status(409).json({ error: "Student ID already registered (duplicate)" });
        }

        console.log("📝 [5] ✅ Student ID is unique, creating account...");

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("📝 [6] Password hashed");

        // Create new user
        const newUser = new User({
            studentId,
            password: hashedPassword,
            name: name || studentId,
            role: "student"  // Changed from "user" to "student"
        });

        await newUser.save();
        console.log("📝 [7] User created successfully:", newUser._id);

        res.json({
            user: {
                studentId: newUser.studentId,
                name: newUser.name,
                role: newUser.role
            }
        });
        console.log("📝 [8] Registration success response sent!");

    } catch (err) {
        console.error("❌ REGISTRATION CRASH:", err.message);
        console.error("❌ STACK:", err.stack);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});


router.post("/login", async (req, res) => {
    try {
        console.log("🔐 [1] Login request received");
        console.log("🔐 [2] req.body:", req.body);

        let { studentId, password } = req.body;
        console.log("🔐 [3] studentId:", studentId, "password:", !!password);

        if (!studentId || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        studentId = studentId.toUpperCase();
        console.log("🔐 [4] Querying DB for:", studentId);

        const user = await User.findOne({ studentId });
        console.log("🔐 [5] user found:", user ? user.studentId : "null");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log("🔐 [6] Comparing password...");
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("🔐 [7] isMatch:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid password" });
        }

        console.log("🔐 [8] Sending success response...");
        res.json({
            user: {
                studentId: user.studentId,
                name: user.name,
                role: user.role
            }
        });
        console.log("🔐 [9] Done!");

    } catch (err) {
        console.error("❌ LOGIN CRASH:", err.message);
        console.error("❌ STACK:", err.stack);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

module.exports = router;