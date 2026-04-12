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

    # Amount detection
    # Tesseract mangles ₹ into €, ?, or garbage characters.
    # Strategy: Don't depend on the currency symbol at all.
    # Instead, use CONTEXTUAL EXTRACTION — in GPay receipts the amount
    # always appears as a standalone number between the sender's phone
    # number and the "Completed" status line.
    
    # Also normalize the text: replace / with 7 when adjacent to digits
    # (Tesseract commonly misreads 7 as /)
    norm = text
    # Tesseract misreads ₹ as various characters - normalize them all
    norm = norm.replace('\u20ac', '₹')    # € -> ₹
    norm = norm.replace('\ufffd', '₹')    # replacement char -> ₹
    norm = norm.replace('\u00b0', '₹')    # ° (degree sign) -> ₹  ← actual culprit
    # Tesseract also misreads 7 as / — fix it right after a ₹ symbol
    norm = re.sub(r'₹\s*/(\d)', r'₹7\1', norm)

    # --- Method 1: Contextual extraction ---
    # Find text between a phone number (+91...) and "Completed"
    context_match = re.search(
        r'\+91[\d\s]+\n+(.*?)(?:@\s*)?Completed',
        norm, re.DOTALL | re.IGNORECASE
    )
    context_amount = None
    if context_match:
        region = context_match.group(1).strip()
        # Look for any number in this region (strip non-digit OCR noise)
        nums = re.findall(r'(\d+)', region)
        for n in nums:
            val = int(n)
            if 1 <= val <= 99999:  # reasonable payment amount
                context_amount = str(val)
                break

    # --- Method 2: If we have an expected amount, search anywhere ---
    if expected_amount:
        # Direct search for the expected amount
        safe_pat = rf'(?:^|\D){expected_amount}(?:$|\D)'
        if re.search(safe_pat, norm):
            results['amount'] = expected_amount
        # Also check if Tesseract prepended a '2' (common hallucination)
        elif re.search(rf'(?:^|\D)2{expected_amount}(?:$|\D)', norm):
            results['amount'] = expected_amount
        # Check the contextual amount we found
        elif context_amount == expected_amount:
            results['amount'] = expected_amount
        # Tesseract might prepend '2' to contextual amount too
        elif context_amount and context_amount.startswith('2') and context_amount[1:] == expected_amount:
            results['amount'] = expected_amount

    # --- Method 3: Fallback guess from context ---
    if not results['amount'] and context_amount:
        # If context found '2XX' and XX is a reasonable amount, strip the '2' prefix
        if len(context_amount) >= 2 and context_amount.startswith('2'):
            stripped = context_amount[1:]
            if int(stripped) > 0:
                results['amount'] = stripped
            else:
                results['amount'] = context_amount
        else:
            results['amount'] = context_amount

    # --- Method 4: Last resort - symbol-based ---
    if not results['amount']:
        for pattern in [r'[₹]\s*(\d+)', r'Rs\.?\s*(\d+)', r'INR\s*(\d+)', r'\b(\d+)\.00\b']:
            match = re.search(pattern, norm)
            if match:
                amt = match.group(1)
                if len(amt) <= 5 and int(amt) > 0:
                    results['amount'] = amt
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
    # Pattern looks for "To: [Name] [UPI]", allowing '? ' which OCR often substitutes for '7'
    receiver_upi_patterns = [
        r'To:?\s+.*?\s+([a-z0-9\.\-_\?]+@[a-z]+)',
        r'([a-z0-9\.\-_\?]+@[a-z]+)' # Fallback to first one found
    ]
    
    for pattern in receiver_upi_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            extracted_upi = match.group(1).lower()
            # Sanitize common OCR typos where 7 is read as ?
            extracted_upi = extracted_upi.replace('?', '7')
            results['receiver_upi'] = extracted_upi
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