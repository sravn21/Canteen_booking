require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");

const app = express();

app.use(express.json());

connectDB();

// Routes
app.use("/auth", authRoutes);
app.use("/menu", menuRoutes);

app.listen(5000, () => console.log("Server running"));