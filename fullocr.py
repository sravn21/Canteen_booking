"""
Complete Google Pay Payment Receipt OCR System
Captures -> Preprocesses -> Extracts payment information
"""

import cv2
import numpy as np
import pytesseract
from PIL import Image
import re
import os

# Configuration
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def capture_payment_screen():
    """Capture payment screenshot from webcam"""
    print("\n" + "="*60)
    print("STEP 1: CAPTURE PAYMENT SCREEN")
    print("="*60)
    
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Cannot open camera")
        return False
    
    print("📷 Camera ready!")
    print("Position your phone with payment receipt in frame")
    print("Press 's' to capture image")
    print("Press 'q' to quit")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Cannot read frame")
            break
            
        cv2.imshow("Capture GPay Screen - Press 's' to capture", frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('s'):
            cv2.imwrite("payment.jpg", frame)
            print("✅ Image captured as payment.jpg!")
            break
        elif key == ord('q'):
            print("❌ Capture cancelled")
            cap.release()
            cv2.destroyAllWindows()
            return False
    
    cap.release()
    cv2.destroyAllWindows()
    return True


def preprocess_for_ocr():
    """Preprocess payment screenshot for optimal OCR"""
    print("\n" + "="*60)
    print("STEP 2: PREPROCESSING IMAGE")
    print("="*60)
    
    img = cv2.imread("payment.jpg")
    
    if img is None:
        print("❌ payment.jpg not found")
        return False
    
    print(f"Original size: {img.shape[1]}x{img.shape[0]}")
    
    # Crop to payment area (remove background/person)
    height, width = img.shape[:2]
    crop_width = int(width * 0.6)
    img = img[:, :crop_width]
    print(f"✓ Cropped to payment area: {img.shape[1]}x{img.shape[0]}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    print("✓ Converted to grayscale")
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, None, h=10, templateWindowSize=7, searchWindowSize=21)
    print("✓ Denoised image")
    
    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    print("✓ Enhanced contrast")
    
    # Invert (dark text on white background works better for OCR)
    inverted = cv2.bitwise_not(enhanced)
    print("✓ Inverted colors")
    
    # Sharpen
    kernel_sharpening = np.array([[-1, -1, -1],
                                   [-1,  9, -1],
                                   [-1, -1, -1]])
    sharpened = cv2.filter2D(inverted, -1, kernel_sharpening)
    print("✓ Sharpened text")
    
    # Adaptive threshold
    thresh = cv2.adaptiveThreshold(
        sharpened,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        15,
        5
    )
    print("✓ Applied adaptive threshold")
    
    # Morphological cleanup
    kernel = np.ones((2, 2), np.uint8)
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, np.ones((1, 1), np.uint8))
    print("✓ Cleaned up noise")
    
    # Upscale for better OCR
    scale_factor = 2.0
    new_width = int(cleaned.shape[1] * scale_factor)
    new_height = int(cleaned.shape[0] * scale_factor)
    upscaled = cv2.resize(cleaned, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
    print(f"✓ Upscaled 2x: {new_width}x{new_height}")
    
    # Add border
    final = cv2.copyMakeBorder(
        upscaled,
        30, 30, 30, 30,
        cv2.BORDER_CONSTANT,
        value=255
    )
    print("✓ Added border padding")
    
    cv2.imwrite("screen_for_ocr.jpg", final)
    print(f"✅ Saved preprocessed image as screen_for_ocr.jpg")
    print(f"Final size: {final.shape[1]}x{final.shape[0]}")
    
    return True


def extract_payment_info():
    """Perform OCR and extract payment information"""
    print("\n" + "="*60)
    print("STEP 3: EXTRACTING PAYMENT INFORMATION")
    print("="*60)
    
    if not os.path.exists("screen_for_ocr.jpg"):
        print("❌ screen_for_ocr.jpg not found")
        return
    
    # OCR configuration
    config = (
        r'--oem 3 --psm 6 '
        r'-c tessedit_char_whitelist='
        r'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@._₹:/- '
    )
    
    print("🔍 Running OCR...")
    text = pytesseract.image_to_string(
        Image.open("screen_for_ocr.jpg"),
        config=config
    )
    
    if not text.strip():
        print("⚠️ OCR returned EMPTY")
        print("\nTroubleshooting tips:")
        print("1. Ensure good lighting when capturing")
        print("2. Hold camera steady")
        print("3. Payment screen should be clearly visible")
        print("4. Avoid screen glare/reflections")
        return
    
    print("\n" + "="*60)
    print("RAW OCR OUTPUT")
    print("="*60)
    print(text)
    
    # Extract structured data
    print("\n" + "="*60)
    print("EXTRACTED PAYMENT DATA")
    print("="*60)
    
    payment_data = {}
    
    # Amount
    amount_match = re.search(r'₹\s*(\d+)', text)
    if amount_match:
        payment_data['amount'] = f"₹{amount_match.group(1)}"
        print(f"💰 Amount: ₹{amount_match.group(1)}")
    
    # UPI Transaction ID
    upi_match = re.search(r'(\d{12})', text)
    if upi_match:
        payment_data['transaction_id'] = upi_match.group(1)
        print(f"🔖 UPI Transaction ID: {upi_match.group(1)}")
    
    # Bank name
    bank_match = re.search(r'([\w\s]+Bank[\w\s]*\d*)', text, re.IGNORECASE)
    if bank_match:
        payment_data['bank'] = bank_match.group(1).strip()
        print(f"🏦 Bank: {bank_match.group(1).strip()}")
    
    # Date
    date_match = re.search(r'(\d{1,2}\s+\w+\s+\d{4})', text)
    if date_match:
        payment_data['date'] = date_match.group(1)
        print(f"📅 Date: {date_match.group(1)}")
    
    # Time
    time_match = re.search(r'(\d{1,2}:\d{2}\s*(?:am|pm))', text, re.IGNORECASE)
    if time_match:
        payment_data['time'] = time_match.group(1)
        print(f"🕐 Time: {time_match.group(1)}")
    
    # To
    to_match = re.search(r'To:\s*([^\n]+)', text, re.IGNORECASE)
    if to_match:
        payment_data['to'] = to_match.group(1).strip()
        print(f"👤 To: {to_match.group(1).strip()}")
    
    # From
    from_match = re.search(r'From:\s*([^\n]+)', text, re.IGNORECASE)
    if from_match:
        payment_data['from'] = from_match.group(1).strip()
        print(f"👤 From: {from_match.group(1).strip()}")
    
    # Status
    if 'completed' in text.lower():
        payment_data['status'] = 'Completed'
        print(f"✅ Status: Completed")
    elif 'pending' in text.lower():
        payment_data['status'] = 'Pending'
        print(f"⏳ Status: Pending")
    elif 'failed' in text.lower():
        payment_data['status'] = 'Failed'
        print(f"❌ Status: Failed")
    
    print("="*60)
    
    if not payment_data:
        print("⚠️ Could not extract structured data")
    
    return payment_data


def main():
    """Main execution function"""
    print("\n" + "="*60)
    print("GOOGLE PAY PAYMENT RECEIPT OCR SYSTEM")
    print("="*60)
    
    # Step 1: Capture (optional - comment out if you already have payment.jpg)
    # if not capture_payment_screen():
    #     return
    
    # Step 2: Preprocess
    if not preprocess_for_ocr():
        return
    
    # Step 3: OCR and extract
    payment_data = extract_payment_info()
    
    print("\n" + "="*60)
    print("✅ PROCESS COMPLETE")
    print("="*60)
    print("Files created:")
    print("  - payment.jpg (original capture)")
    print("  - screen_for_ocr.jpg (preprocessed)")


if __name__ == "__main__":
    main()