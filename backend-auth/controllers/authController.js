const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Register student
const register = async (req, res) => {
  try {
    const { studentId, name, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(400).json({ message: "Student ID already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      studentId,
      name,
      password: hashedPassword,
      role: "student",
    });

    res.status(201).json({
      message: "Student registered successfully",
      user: {
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // Find user
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };