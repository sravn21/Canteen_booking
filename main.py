import cv2
import pytesseract
import re

# Set path if needed
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

IMAGE_PATH = "payment_processed.jpg"

def ocr_digits(region):
    config = "--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789₹"
    return pytesseract.image_to_string(region, config=config)

def main():
    img = cv2.imread(IMAGE_PATH)

    if img is None:
        print("❌ payment_processed.jpg not found")
        return

    h, w = img.shape[:2]

    # ---- ROIs BASED ON GPay LAYOUT (webcam image) ----
    roi_amount = img[int(h*0.05):int(h*0.20), int(w*0.25):int(w*0.75)]
    roi_txn_id = img[int(h*0.45):int(h*0.65), int(w*0.15):int(w*0.85)]

    # OCR only digits
    text_amount = ocr_digits(roi_amount)
    text_txn = ocr_digits(roi_txn_id)

    print("\nRAW OCR OUTPUT")
    print("-"*40)
    print(text_amount)
    print(text_txn)
    print("-"*40)

    # Extract values
    amount = re.search(r"₹\s*\d+", text_amount)
    txn_id = re.search(r"\b\d{12}\b", text_txn)

    print("\nEXTRACTED VALUES")
    print("="*40)
    print("Amount:", amount.group() if amount else "NOT FOUND")
    print("UPI Transaction ID:", txn_id.group() if txn_id else "NOT FOUND")
    print("="*40)

if __name__ == "__main__":
    main()
