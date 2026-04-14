const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { processImage } = require("../controllers/paymentController");

// ✅ Multer configuration for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../ocr/"));
    },
    filename: (req, file, cb) => {
      const orderNumber = req.body.orderNumber;
      cb(null, `payment_order_${orderNumber}.jpg`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpg, jpeg, png)"));
    }
  }
});

router.post("/", upload.single("image"), processImage);

module.exports = router;
