import cv2
import numpy as np

INPUT_IMAGE = "payment.jpg"
OUTPUT_IMAGE = "screen_for_ocr.jpg"

print("="*60)
print("GOOGLE PAY OCR PREPROCESSING - OPTIMIZED VERSION")
print("="*60)

img = cv2.imread(INPUT_IMAGE)
if img is None:
    print("❌ payment.jpg not found")
    exit()

print(f"\n1. Original size: {img.shape[1]}x{img.shape[0]}")

# CROP: Keep only payment details area (left 55%)
height, width = img.shape[:2]
crop_width = int(width * 0.55)
img = img[:, :crop_width]
print(f"2. Cropped to: {img.shape[1]}x{img.shape[0]}")

# GRAYSCALE
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
print("3. Converted to grayscale")

# LIGHT DENOISING - preserve edges
denoised = cv2.fastNlMeansDenoising(gray, None, h=8, templateWindowSize=7, searchWindowSize=21)
print("4. Applied light denoising")

# GENTLE CONTRAST BOOST
clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
enhanced = clahe.apply(denoised)
print("5. Enhanced contrast gently")

# INVERT: Dark background with white text -> White background with dark text
inverted = cv2.bitwise_not(enhanced)
print("6. Inverted colors (white bg, dark text)")

# SLIGHT BLUR to smooth out noise
slightly_blurred = cv2.GaussianBlur(inverted, (3, 3), 0)
print("7. Applied slight blur")

# BINARY THRESHOLD with Otsu's method (finds optimal threshold)
_, binary = cv2.threshold(slightly_blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
print("8. Applied Otsu threshold")

# MINIMAL CLEANUP - only remove tiny specks
kernel_small = np.ones((1, 1), np.uint8)
cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_small)

# Remove small dark spots
kernel_medium = np.ones((2, 2), np.uint8)
cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel_medium)
print("9. Cleaned up noise")

# UPSCALE 2.5x for better OCR
scale = 2.5
new_width = int(cleaned.shape[1] * scale)
new_height = int(cleaned.shape[0] * scale)
upscaled = cv2.resize(cleaned, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
print(f"10. Upscaled {scale}x to: {new_width}x{new_height}")

# ADD GENEROUS BORDER
final = cv2.copyMakeBorder(upscaled, 50, 50, 50, 50, cv2.BORDER_CONSTANT, value=255)
print(f"11. Added border. Final: {final.shape[1]}x{final.shape[0]}")

# SAVE
cv2.imwrite(OUTPUT_IMAGE, final)
print(f"\n✅ SUCCESS: Saved as {OUTPUT_IMAGE}")
print("="*60)

# Display
cv2.imshow("Final OCR Input", final)
print("\nPress any key to close preview...")
cv2.waitKey(0)
cv2.destroyAllWindows()