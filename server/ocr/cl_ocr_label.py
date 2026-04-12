# """
# GPay Receipt OCR - Optimized for Camera Photos
# Extracts: Amount, Order ID, Date, Time, Receiver UPI
# Saves results to payment_details.txt
# """

# import cv2
# import pytesseract
# import re
# import numpy as np
# import json
# from datetime import datetime

# def preprocess_camera_image(img_path):
#     """
#     Better preprocessing for camera-captured images
#     """
#     img = cv2.imread(img_path)
    
#     # Convert to grayscale
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
#     # Invert if dark
#     if np.mean(gray) < 127:
#         gray = cv2.bitwise_not(gray)
    
#     # Upscale significantly
#     gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    
#     # Strong denoising for camera noise
#     denoised = cv2.fastNlMeansDenoising(gray, h=10)
    
#     # Adaptive threshold
#     binary = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
#                                    cv2.THRESH_BINARY, 21, 10)
    
#     return binary

# def extract_all_text(img_path):
#     """
#     Extract all text with multiple attempts
#     """
#     # Preprocess
#     processed = preprocess_camera_image(img_path)
    
#     # Try multiple OCR configurations
#     all_text = []
    
#     configs = [
#         '--oem 3 --psm 6',
#         '--oem 3 --psm 4',
#         '--oem 3 --psm 11',
#     ]
    
#     for config in configs:
#         text = pytesseract.image_to_string(processed, config=config)
#         all_text.append(text)
    
#     # Combine
#     combined = '\n'.join(all_text)
#     return combined

# def parse_payment_details(text):
#     """
#     Extract specific fields
#     """
#     results = {
#         'amount': None,
#         'order_id': None,
#         'date': None,
#         'time': None,
#         'receiver_upi': None,
#         'receiver_name': None,
#         'upi_transaction_id': None,
#     }
    
#     print("\n" + "="*70)
#     print("RAW OCR TEXT:")
#     print("="*70)
#     print(text[:800])
#     print("="*70)
    
#     # Extract Amount (₹1) - prioritize small amounts
#     amount_patterns = [
#         r'[₹]\s*([1-9])\b',  # Single digit with rupee symbol
#         r'To\s+[A-Za-z\s]+\n.*?[₹]\s*(\d{1,3})\b',  # After "To" name
#         r'\b([1-9])\s*\n\s*[A-Z]{2}\d+',  # Single digit before order ID
#     ]
#     for pattern in amount_patterns:
#         match = re.search(pattern, text, re.DOTALL)
#         if match:
#             amt = match.group(1)
#             if 1 <= len(amt) <= 4:
#                 results['amount'] = amt
#                 break
    
#     # Fallback: any reasonable amount
#     if not results['amount']:
#         general_amount = re.search(r'[₹Rs]\s*(\d{1,4})\b', text)
#         if general_amount:
#             results['amount'] = general_amount.group(1)
    
#     # Extract Order ID (RD912 - appears after amount, before Pay again)
#     order_patterns = [
#         r'\b(RD\d+)\b',  # RD followed by numbers
#         r'\b([A-Z]{2,3}\d{3,})\b',  # 2-3 letters + 3+ numbers
#         r'₹\d+\s*\n\s*([A-Z0-9\-]+)\s*\n',  # After amount
#     ]
#     for pattern in order_patterns:
#         match = re.search(pattern, text)
#         if match:
#             order_id = match.group(1).strip()
#             if 3 <= len(order_id) <= 20 and not order_id.isdigit():
#                 results['order_id'] = order_id
#                 break
    
#     # Extract Date and Time - more flexible
#     datetime_patterns = [
#         r'(\d{1,2}\s*(?:Feb|Jan|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})[,\s]+(\d{1,2}:\d{2}\s*(?:pm|am)?)',
#         r'(\d{1,2})\s*(?:Feb|Jan|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{4})[,\s]+(\d{1,2})[:\s]*(\d{2})\s*(?:pm|am)?',
#     ]
    
#     # Try first pattern
#     match = re.search(datetime_patterns[0], text, re.IGNORECASE)
#     if match:
#         results['date'] = match.group(1).strip()
#         results['time'] = match.group(2).strip()
#     else:
#         # Try second pattern with more detail
#         match = re.search(datetime_patterns[1], text, re.IGNORECASE)
#         if match:
#             day = match.group(1)
#             year = match.group(2)
#             hour = match.group(3)
#             minute = match.group(4)
            
#             # Find month name
#             month_match = re.search(r'(Feb|Jan|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', text, re.IGNORECASE)
#             if month_match:
#                 month = month_match.group(1)
#                 results['date'] = f"{day} {month} {year}"
#                 results['time'] = f"{hour}:{minute} pm"
    
#     # Extract Receiver UPI (sachusamuel2@okicici)
#     upi_pattern = r'([a-z0-9\.\-_]+@[a-z]+)'
#     upi_match = re.search(upi_pattern, text, re.IGNORECASE)
#     if upi_match:
#         results['receiver_upi'] = upi_match.group(1).lower()
    
#     # Extract Receiver Name (Sachu Samuel)
#     name_patterns = [
#         r'To[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)',
#         r'To\s+([A-Z][A-Za-z\s]+?)(?:\n|\+)',
#     ]
#     for pattern in name_patterns:
#         match = re.search(pattern, text)
#         if match:
#             name = match.group(1).strip()
#             if 5 <= len(name) <= 50:
#                 results['receiver_name'] = name
#                 break
    
#     # Extract UPI Transaction ID
#     upi_trans_patterns = [
#         r'UPI\s+transaction\s+ID\s*(\d{10,15})',
#         r'\b(\d{12})\b',
#     ]
#     for pattern in upi_trans_patterns:
#         match = re.search(pattern, text, re.IGNORECASE)
#         if match:
#             results['upi_transaction_id'] = match.group(1)
#             break
    
#     return results

# def save_to_file(results, filename='payment_details.txt'):
#     """
#     Save extracted details to file
#     """
#     timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
#     # Save as readable text
#     with open(filename, 'w', encoding='utf-8') as f:
#         f.write("="*70 + "\n")
#         f.write("GPAY PAYMENT DETAILS\n")
#         f.write(f"Extracted on: {timestamp}\n")
#         f.write("="*70 + "\n\n")
        
#         f.write(f"Amount: ₹{results['amount']}\n" if results['amount'] else "Amount: NOT FOUND\n")
#         f.write(f"Order ID: {results['order_id']}\n" if results['order_id'] else "Order ID: NOT FOUND\n")
#         f.write(f"Date: {results['date']}\n" if results['date'] else "Date: NOT FOUND\n")
#         f.write(f"Time: {results['time']}\n" if results['time'] else "Time: NOT FOUND\n")
#         f.write(f"Receiver Name: {results['receiver_name']}\n" if results['receiver_name'] else "Receiver Name: NOT FOUND\n")
#         f.write(f"Receiver UPI: {results['receiver_upi']}\n" if results['receiver_upi'] else "Receiver UPI: NOT FOUND\n")
#         f.write(f"UPI Transaction ID: {results['upi_transaction_id']}\n" if results['upi_transaction_id'] else "UPI Transaction ID: NOT FOUND\n")
        
#         f.write("\n" + "="*70 + "\n")
    
#     # Also save as JSON
#     json_filename = filename.replace('.txt', '.json')
#     with open(json_filename, 'w', encoding='utf-8') as f:
#         json.dump(results, f, indent=2, ensure_ascii=False)
    
#     print(f"\n✓ Details saved to: {filename}")
#     print(f"✓ JSON saved to: {json_filename}")

# def main():
#     """
#     Main function
#     """
#     print("="*70)
#     print("GPAY RECEIPT OCR - CAMERA PHOTO MODE")
#     print("="*70)
    
#     img_path = 'payment.jpg'
    
#     try:
#         print("\nExtracting text from image...")
#         text = extract_all_text(img_path)
        
#         print("\nParsing payment details...")
#         results = parse_payment_details(text)
        
#         # Display results
#         print("\n" + "="*70)
#         print("EXTRACTED PAYMENT DETAILS")
#         print("="*70)
        
#         print(f"\n💰 Amount: ₹{results['amount']}" if results['amount'] else "\n💰 Amount: NOT FOUND")
#         print(f"🏷️  Order ID: {results['order_id']}" if results['order_id'] else "🏷️  Order ID: NOT FOUND")
#         print(f"📅 Date: {results['date']}" if results['date'] else "📅 Date: NOT FOUND")
#         print(f"🕐 Time: {results['time']}" if results['time'] else "🕐 Time: NOT FOUND")
#         print(f"👤 Receiver: {results['receiver_name']}" if results['receiver_name'] else "👤 Receiver: NOT FOUND")
#         print(f"   UPI: {results['receiver_upi']}" if results['receiver_upi'] else "   UPI: NOT FOUND")
#         print(f"🔢 UPI Transaction ID: {results['upi_transaction_id']}" if results['upi_transaction_id'] else "🔢 UPI Transaction ID: NOT FOUND")
        
#         print("\n" + "="*70)
        
#         # Save to file
#         save_to_file(results)
        
#         return results
        
#     except Exception as e:
#         print(f"\n✗ Error: {e}")
#         import traceback
#         traceback.print_exc()
#         return None

# if __name__ == "__main__":
#     main()








import cv2
import pytesseract
import re
import numpy as np
import json
import os

# SET TESSERACT PATH
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def preprocess_camera_image(img_path):
    img = cv2.imread(img_path)

    if img is None:
        raise Exception(f"OpenCV failed to read image at: {img_path}")

    print("Image loaded successfully")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if np.mean(gray) < 127:
        gray = cv2.bitwise_not(gray)

    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    binary = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 21, 10
    )

    return binary


def extract_all_text(img_path):
    processed = preprocess_camera_image(img_path)

    configs = [
        '--oem 3 --psm 6',
        '--oem 3 --psm 4',
        '--oem 3 --psm 11',
    ]

    all_text = []

    for config in configs:
        text = pytesseract.image_to_string(processed, config=config)
        all_text.append(text)

    final_text = '\n'.join(all_text)

    # DEBUG DUMP
    with open("debug.json", "w") as f:
        json.dump({"raw_text": final_text}, f)

    print("\nOCR TEXT PREVIEW:\n")
    print(final_text[:500])

    return final_text


def parse_payment_details(text, expected_amount=None):
    results = {
        'amount': None,
        'order_id': None,
        'date': None,
        'time': None,
        'receiver_upi': None,
        'receiver_name': None,
        'upi_transaction_id': None,
    }

    # Amount detection (Targeted verification)
    if expected_amount:
        # To prevent matching "40" inside a Transaction ID like "121340473644",
        # we enforce that the matched amount MUST be surrounded by non-digits,
        # while safely allowing Tesseract hallucinated prefixes like "2" or "?".
        
        # Regex breakdown:
        # (?:^|\D)          -> Must start at beginning of line OR after a non-digit character
        # (?:[₹RsINR\?]+|2)? -> Can optionally be prefixed by Rupee icons OR Tesseract's misread "2"
        # \s*               -> Optional spaces
        # ({expected_amount}) -> The EXACT expected number
        # (?:\.00)?         -> Optional ".00"
        # (?:$|\D)          -> Must end at line-end OR before a non-digit character
        
        safe_boundary_pattern = rf"(?:^|\D)(?:[₹RsINR\?]+|2)?\s*({expected_amount})(?:\.00)?(?:$|\D)"
        
        if re.search(safe_boundary_pattern, text, re.IGNORECASE):
            results['amount'] = expected_amount

    # Fallback to guessing ONLY if we weren't looking for a specific target
    if not results['amount'] and not expected_amount:
        amount_patterns = [
            r'[₹]\s*(\d+)',
            r'[?R]\s*(\d+)',   # Sometimes Tesseract hallucinates ? or R instead of ₹
            r'Rs\.?\s*(\d+)',
            r'INR\s*(\d+)',
            r'\b(\d+)\.00\b'   # Gpay often shows 95.00
        ]
    
        for pattern in amount_patterns:
            match = re.search(pattern, text)
            if match:
                results['amount'] = match.group(1)
                break

    # Order ID
    order_patterns = [
        r'\b(RD\d+)\b',
        r'\b([A-Z]{2,3}\d{3,})\b'
    ]

    for pattern in order_patterns:
        match = re.search(pattern, text)
        if match:
            results['order_id'] = match.group(1)
            break

    # Receiver UPI (Smart extraction)
    # We want to find the UPI associated with "To:" to avoid grabbing the sender's UPI
    # Pattern looks for "To: [Name] [UPI]"
    receiver_upi_patterns = [
        r'To:?\s+.*?\s+([a-z0-9\.\-_]+@[a-z]+)',
        r'([a-z0-9\.\-_]+@[a-z]+)' # Fallback to first one found
    ]
    
    for pattern in receiver_upi_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            results['receiver_upi'] = match.group(1).lower()
            break

    # Transaction ID
    txn_match = re.search(r'\b(\d{10,})\b', text)
    if txn_match:
        results['upi_transaction_id'] = txn_match.group(1)

    return results


import sys

def save_json(results, output_filename="payment_details.json"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, output_filename)

    # ⚠️ IMPORTANT: no utf-8, no emojis → avoids Windows crash
    with open(json_path, "w") as f:
        json.dump(results, f, indent=2)

    print("JSON saved at:", json_path)


def main():
    output_filename = "payment_details.json"
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Read dynamic filenames and explicit target amount from Node.js
        input_filename = sys.argv[1] if len(sys.argv) > 1 else "payment.jpg"
        output_filename = sys.argv[2] if len(sys.argv) > 2 else "payment_details.json"
        expected_amount = sys.argv[3] if len(sys.argv) > 3 else None
        
        img_path = os.path.join(base_dir, input_filename)

        print("FULL IMAGE PATH:", img_path)

        if not os.path.exists(img_path):
            raise Exception(f"{input_filename} file does not exist")

        text = extract_all_text(img_path)
        results = parse_payment_details(text, expected_amount)

        save_json(results, output_filename)

        print("FINAL EXTRACTED DATA:", results)

    except Exception as e:
        error_path = os.path.join(os.path.dirname(__file__), "payment_details.json")

        with open(error_path, "w") as f:
            json.dump({"error": str(e)}, f)

        print("ERROR:", str(e))


if __name__ == "__main__":
    main()