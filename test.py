import pytesseract
from PIL import Image
import re

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

print("="*60)
print("GOOGLE PAY OCR - MULTI-MODE EXTRACTION")
print("="*60)

# Try different PSM (Page Segmentation Mode) settings
psm_modes = [
    (6, "Uniform block of text"),
    (4, "Single column of text"),
    (3, "Fully automatic"),
    (11, "Sparse text"),
]

best_result = ""
best_length = 0
best_mode = 0

print("\nTrying different OCR modes...\n")

for psm, description in psm_modes:
    config = (
        f'--oem 3 --psm {psm} '
        r'-c tessedit_char_whitelist='
        r'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@._₹:/- (),'
    )
    
    text = pytesseract.image_to_string(
        Image.open("screen_for_ocr.jpg"),
        config=config
    ).strip()
    
    print(f"PSM {psm} ({description}): {len(text)} chars")
    
    if len(text) > best_length:
        best_length = len(text)
        best_result = text
        best_mode = psm

print(f"\n{'='*60}")
print(f"BEST RESULT (PSM {best_mode})")
print("="*60)
print(best_result if best_result else "⚠️ OCR RETURNED EMPTY")
print("="*60)

# Extract structured data
if best_result:
    print("\n" + "="*60)
    print("EXTRACTED PAYMENT INFORMATION")
    print("="*60)
    
    # Amount (₹ symbol followed by digits)
    amount = re.search(r'₹\s*(\d+)', best_result)
    if amount:
        print(f"💰 Amount: ₹{amount.group(1)}")
    else:
        # Try finding just numbers at the start
        amount_alt = re.search(r'^[^\d]*(\d+)', best_result)
        if amount_alt:
            print(f"💰 Amount: ₹{amount_alt.group(1)} (detected)")
    
    # Status
    if 'complet' in best_result.lower():
        print(f"✅ Status: Completed")
    elif 'pending' in best_result.lower():
        print(f"⏳ Status: Pending")
    elif 'fail' in best_result.lower():
        print(f"❌ Status: Failed")
    
    # Payment method
    if 'upi' in best_result.lower():
        print(f"📱 Method: UPI")
    if 'supermoney' in best_result.lower():
        print(f"📱 Via: SuperMoney")
    
    # Date
    date_patterns = [
        r'(\d{1,2}\s+\w{3}\s+\d{4})',  # 27 Jan 2024
        r'(\d{1,2}/\d{1,2}/\d{4})',    # 27/01/2024
        r'(\d{1,2}-\d{1,2}-\d{4})',    # 27-01-2024
    ]
    for pattern in date_patterns:
        date = re.search(pattern, best_result)
        if date:
            print(f"📅 Date: {date.group(1)}")
            break
    
    # Time
    time = re.search(r'(\d{1,2}:\d{2}\s*(?:am|pm))', best_result, re.IGNORECASE)
    if time:
        print(f"🕐 Time: {time.group(1)}")
    
    # Transaction ID (12 digits)
    trans_id = re.search(r'(\d{12})', best_result)
    if trans_id:
        print(f"🔖 Transaction ID: {trans_id.group(1)}")
    
    # Bank (word containing "bank" and possibly numbers)
    bank = re.search(r'([\w\s]*[Bb]ank[\w\s]*\d+)', best_result)
    if bank:
        print(f"🏦 Bank: {bank.group(1).strip()}")
    
    # To/From
    to_match = re.search(r'[Tt]o:\s*([^\n,]+)', best_result)
    if to_match:
        print(f"👤 To: {to_match.group(1).strip()}")
    
    from_match = re.search(r'[Ff]rom:\s*([^\n,]+)', best_result)
    if from_match:
        print(f"👤 From: {from_match.group(1).strip()}")
    
    # Google Pay ID
    gpay = re.search(r'([a-z0-9._-]+@[a-z]+)', best_result, re.IGNORECASE)
    if gpay:
        print(f"📧 Google Pay: {gpay.group(1)}")
    
    print("="*60)

else:
    print("\n⚠️ TROUBLESHOOTING TIPS:")
    print("1. Check if screen_for_ocr.jpg looks clear (open it manually)")
    print("2. Ensure text is BLACK on WHITE background")
    print("3. Try better lighting when capturing")
    print("4. Reduce screen glare/reflections")
    print("5. Hold phone closer to camera")
    print("6. Capture when payment screen is fully loaded")

print("\n✅ OCR Complete")