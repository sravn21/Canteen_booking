const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");

console.log("✅ authRoutes.js loaded, User model:", !!User);

router.post("/register", async (req, res) => {
    try {
        console.log("📝 [1] Registration request received");
        console.log("📝 [2] req.body:", req.body);

        let { studentId, password, name, email } = req.body;
        console.log("📝 [3] studentId:", studentId, "password:", !!password, "name:", name, "email:", email);

        // Validation
        if (!studentId || !password || !email) {
            return res.status(400).json({ error: "Missing studentId, password, or email" });
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

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            console.log("📝 [5b] ❌ Email already registered");
            return res.status(409).json({ error: "Email already registered" });
        }

        console.log("📝 [5] ✅ Student ID is unique, creating account...");

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log("📝 [6] Password hashed");

        // Create new user
        const newUser = new User({
            studentId,
            email: email.toLowerCase(),
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

// Forgot Password - verify studentId and email
router.post("/forgot-password", async (req, res) => {
    try {
        console.log("🔓 [1] Forgot password request");
        
        let { studentId, email } = req.body;
        console.log("🔓 [2] studentId:", studentId, "email:", email);

        if (!studentId || !email) {
            return res.status(400).json({ error: "Missing studentId or email" });
        }

        studentId = studentId.toUpperCase();
        const user = await User.findOne({ studentId, email: email.toLowerCase() });
        console.log("🔓 [3] User found:", !!user);

        if (!user) {
            return res.status(404).json({ error: "Student ID or email not found" });
        }

        // Generate a simple reset token (using timestamp)
        const resetToken = Math.random().toString(36).substr(2) + Date.now().toString(36);
        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();
        console.log("🔓 [4] Reset token generated and stored");

        res.json({
            success: true,
            message: "Verification successful. You can now reset your password.",
            token: resetToken // Send token to frontend (simplified, no email)
        });

    } catch (err) {
        console.error("❌ FORGOT PASSWORD CRASH:", err.message);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

// Reset Password - validate token and update password
router.post("/reset-password", async (req, res) => {
    try {
        console.log("🔄 [1] Reset password request");
        
        let { studentId, email, newPassword, resetToken } = req.body;
        console.log("🔄 [2] studentId:", studentId, "email:", email, "token present:", !!resetToken);

        if (!studentId || !email || !newPassword || !resetToken) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ error: "Password must be at least 4 characters" });
        }

        studentId = studentId.toUpperCase();
        const user = await User.findOne({ studentId, email: email.toLowerCase() });
        console.log("🔄 [3] User found:", !!user);

        if (!user) {
            return res.status(404).json({ error: "Student ID or email not found" });
        }

        // Validate reset token and expiry
        if (!user.resetToken || user.resetToken !== resetToken) {
            console.log("🔄 [4] Invalid reset token");
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        if (new Date() > user.resetTokenExpiry) {
            console.log("🔄 [5] Reset token expired");
            return res.status(400).json({ error: "Reset token has expired" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log("🔄 [6] New password hashed");

        // Update password and clear reset token
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
        console.log("🔄 [7] Password updated and reset token cleared");

        res.json({
            success: true,
            message: "Password reset successful. You can now login with your new password."
        });

    } catch (err) {
        console.error("❌ RESET PASSWORD CRASH:", err.message);
        res.status(500).json({ error: "Server error", message: err.message });
    }
});

module.exports = router;