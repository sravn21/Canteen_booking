const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");

console.log("✅ authRoutes.js loaded, User model:", !!User);

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
                email: user.email,
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

// ── VERIFY IDENTITY (Step 1 of password reset) ───────────────────────────────────────────
// Verifies that the given studentId AND email belong to the same account.
// This replaces the old dummy-login hack used in the frontend.
router.post("/verify-identity", async (req, res) => {
    try {
        let { studentId, email } = req.body;

        if (!studentId || !email) {
            return res.status(400).json({ error: "Student ID and email are required" });
        }

        studentId = studentId.trim().toUpperCase();
        email = email.trim().toLowerCase();

        const user = await User.findOne({ studentId, email });
        if (!user) {
            return res.status(404).json({ error: "No account found with that Student ID and email combination" });
        }

        if (user.role === "admin") {
            return res.status(403).json({ error: "Admin password cannot be reset here" });
        }

        console.log("🔑 Identity verified for reset:", studentId);
        res.json({ message: "Identity verified" });
    } catch (err) {
        console.error("❌ VERIFY-IDENTITY CRASH:", err.message);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
    try {
        let { studentId, email, newPassword } = req.body;

        if (!studentId || !email || !newPassword) {
            return res.status(400).json({ error: "Student ID, email, and new password are required" });
        }

        studentId = studentId.trim().toUpperCase();
        email = email.trim().toLowerCase();

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Verify BOTH studentId AND email before allowing password reset
        const user = await User.findOne({ studentId, email });
        if (!user) {
            return res.status(404).json({ error: "No account found with that Student ID and email combination" });
        }

        if (user.role === "admin") {
            return res.status(403).json({ error: "Admin password cannot be reset here" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ studentId, email }, { password: hashed });

        console.log("🔑 Password reset for:", studentId);
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("❌ FORGOT-PASSWORD CRASH:", err.message);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        name = name.trim();
        email = email.trim().toLowerCase();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Please enter a valid email address" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Check if email is already registered
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(409).json({ error: "This email is already registered" });
        }

        // Auto-generate a unique random Student ID: STU + 6 random digits
        let studentId;
        do {
            const digits = Math.floor(100000 + Math.random() * 900000); // always 6 digits
            studentId = `STU${digits}`;
        } while (await User.findOne({ studentId }));

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ studentId, name, email, password: hashed, role: "student" });

        console.log("✅ Registered:", studentId, email);
        res.status(201).json({
            message: "Account created successfully",
            user: { studentId: user.studentId, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error("❌ REGISTER CRASH:", err.message);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

module.exports = router;