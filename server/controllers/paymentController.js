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

        // ==== OPTION 2: Hardware Trigger Logic ====
        try {
            // Future: HTTP call to Raspberry Pi to snap photo
            // const axios = require("axios");
            // const piData = await axios.get("http://<Pi-IP>:5000/snap", { responseType: 'arraybuffer' });
            // fs.writeFileSync(imagePath, piData.data);
            // console.log("Pi camera successful!");

            // UNTIL Pi IS CONNECTED: Copy default test image so UI fully works today safely
            const testImage = path.join(__dirname, "../ocr/payment.jpg");
            if (fs.existsSync(testImage)) {
                fs.copyFileSync(testImage, imagePath);
                console.log(`Pi simulation updated ${imgName} from payment.jpg`);
            }
        } catch (e) {
            console.log("Hardware Pi trigger skipped or failed");
        }
        // ===========================================

        if (!fs.existsSync(imagePath)) {
            return res.status(500).json({ error: `${imgName} not found. Connect Pi or supply fallback.` });
        }

        const scriptPath = path.join(__dirname, "../ocr/cl_ocr_label.py");

        // ✅ Run Python OCR and pass the Explicit Target Amount!
        exec(`python "${scriptPath}" "${imgName}" "${jsonName}" "${order.total}"`, async (error, stdout, stderr) => {
            if (error) {
                console.error("❌ Python error:", error);
                return res.status(500).json({ error: "OCR failed" });
            }

            try {
                if (!fs.existsSync(jsonPath)) {
                    return res.status(500).json({ error: "OCR output JSON not found" });
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