const express = require("express");
const router = express.Router();

const { processImage } = require("../controllers/paymentController");

router.post("/", processImage);

module.exports = router;