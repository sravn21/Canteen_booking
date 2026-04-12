const express = require("express");
const router = express.Router();

const { processImage } = require("../controllers/paymentController");

router.post("/process_payment", processImage);

module.exports = router;