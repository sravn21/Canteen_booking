const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const Order = require("../models/Order");

exports.processImage = async (req, res) => {
    try {
        const orderNumber = parseInt(req.body.orderNumber, 10);

        if (!orderNumber || isNaN(orderNumber)) {
            return res.status(400).json({ error: "orderNumber is required and must be a number" });
        }

        // ✅ Fetch order early so we know exactly what amount Python should scan for
        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Dynamic exact names to prevent concurrency overwrite bugs
        const imgName = `payment_order_${orderNumber}.jpg`;
        const jsonName = `payment_details_${orderNumber}.json`;

        const imagePath = path.join(__dirname, "../ocr/", imgName);
        const jsonPath = path.join(__dirname, "../ocr/", jsonName);

        // ✅ Check if file was uploaded via multer
        if (!req.file) {
            return res.status(400).json({
                error: "No image file uploaded. Please capture a payment screenshot and try again.",
                requiresCapture: true
            });
        }

        // File was uploaded successfully by multer
        console.log(`✅ File uploaded: ${req.file.filename} at ${req.file.path}`);

        // Rename the multer-uploaded file to our expected name
        try {
            if (fs.existsSync(req.file.path)) {
                fs.renameSync(req.file.path, imagePath);
                console.log(`✅ File renamed to: ${imagePath}`);
            } else {
                return res.status(500).json({ error: "Multer file not found at expected location" });
            }
        } catch (renameErr) {
            console.error("❌ File rename error:", renameErr);
            return res.status(500).json({ error: "Failed to process uploaded file" });
        }

        const scriptPath = path.join(__dirname, "../ocr/cl_ocr_label.py");
        const ocrDir = path.join(__dirname, "../ocr/");
        const pythonPath = "C:\\Python312\\python.exe"; // Full path to Python

        // ✅ Run Python OCR with the uploaded image and pass the Explicit Target Amount!
        // Set environment to ensure Python finds installed packages and handles encoding
        exec(`"${pythonPath}" "${scriptPath}" "${imgName}" "${jsonName}" "${order.total}"`,
            {
                cwd: ocrDir,
                env: {
                    ...process.env,
                    PYTHONUNBUFFERED: '1',
                    PYTHONIOENCODING: 'utf-8'
                }
            },
            async (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Python error:", error);
                console.error("Python stdout:", stdout);
                console.error("Python stderr:", stderr);
                return res.status(500).json({ error: "OCR processing failed" });
            }

            // Log Python output
            console.log("Python stdout:", stdout);


            try {
                if (!fs.existsSync(jsonPath)) {
                    return res.status(500).json({ error: "OCR output not generated" });
                }

                const raw = fs.readFileSync(jsonPath, "utf-8");
                const data = JSON.parse(raw);

                const extractedAmount = parseInt(data.amount);

                if (isNaN(extractedAmount)) {
                    return res.status(400).json({
                        error: "Invalid amount extracted from OCR",
                        extracted: data
                    });
                }

                // (Order already fetched at start of function)

                console.log("DB Expected:", order.total);
                // ✅ Compare Amount
                if (order.total !== extractedAmount) {
                    return res.status(400).json({
                        error: "Amount mismatch",
                        expected: order.total,
                        received: extractedAmount
                    });
                }// ✅ Compare Receiver UPI (The Canteen's Official ID)
                const CANTEEN_UPI = process.env.CANTEEN_UPI || "sachincena72@okhdfcbank"; // Replace with real canteen UPI
                if (data.receiver_upi && data.receiver_upi !== CANTEEN_UPI) {
                    return res.status(400).json({
                        error: "Payment sent to wrong UPI!",
                        expected: CANTEEN_UPI,
                        received: data.receiver_upi
                    });
                }

                // ✅ Mark as paid (only if not already)
                if (!order.paid) {
                    order.paid = true;
                    await order.save();
                }

                return res.json({
                    success: true,
                    message: "Payment verified",
                    extracted: data,
                    order
                });

            } catch (err) {
                console.error("❌ Processing error:", err);
                return res.status(500).json({ error: "Failed to process OCR data" });
            }
        });

    } catch (err) {
        console.error("❌ Controller error:", err);
        return res.status(500).json({ error: err.message });
    }
};