const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");

router.post("/login", async (req, res) => {
    try {
        console.log("BODY:", req.body);

        let { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        studentId = studentId.toUpperCase();

        const user = await User.findOne({ studentId });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid password" });
        }

        res.json({
            user: {
                studentId: user.studentId,
                name: user.name,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;