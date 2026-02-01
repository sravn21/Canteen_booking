import cv2
import numpy as np
import os

INPUT_IMAGE = "payment.jpg"
OUTPUT_IMAGE = "screen_for_ocr.jpg"

img = cv2.imread(INPUT_IMAGE)

if img is None:
    print("❌ payment.jpg not found")
    exit()

# ---------- GRAYSCALE ----------
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# ---------- INVERT (dark mode) ----------
gray = cv2.bitwise_not(gray)

# ---------- CONTRAST ENHANCEMENT ----------
clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
gray = clahe.apply(gray)

# ---------- LIGHT SMOOTHING (NOT bilateral) ----------
gray = cv2.GaussianBlur(gray, (3, 3), 0)

# ---------- SOFT ADAPTIVE THRESHOLD ----------
thresh = cv2.adaptiveThreshold(
    gray,
    255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY,
    31,
    12
)

# ---------- BLEND GRAY + THRESH (KEY STEP) ----------
final = cv2.addWeighted(gray, 0.7, thresh, 0.3, 0)

cv2.imwrite(OUTPUT_IMAGE, final)
print(f"✅ OCR-optimized dark-mode image saved as {OUTPUT_IMAGE}")

cv2.imshow("OCR Input (Dark Mode)", final)
cv2.waitKey(0)
cv2.destroyAllWindows()
