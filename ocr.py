import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

config = (
    r'--oem 3 --psm 6 '
    r'-c tessedit_char_whitelist='
    r'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@._₹'
)

text = pytesseract.image_to_string(
    Image.open("screen_for_ocr.jpg"),
    config=config
)

print("===== OCR OUTPUT =====")
print(text if text.strip() else "⚠️ OCR returned EMPTY")
