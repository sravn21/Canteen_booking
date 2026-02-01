"""
OCR extraction for GPay payment screenshots
Reads payment_processed.jpg and extracts payment details
"""

import cv2
import pytesseract
import re
import numpy as np

# If Tesseract is not in PATH, uncomment and set the path:
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_with_ocr(image_path='payment_processed.jpg'):
    """
    Extract text using Tesseract OCR with multiple configurations
    """
    print("="*70)
    print("EXTRACTING TEXT WITH OCR")
    print("="*70)
    
    print(f"\n[1/3] Loading image: {image_path}")
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    if img is None:
        print(f"✗ Error: Could not load {image_path}")
        return None
    
    # Additional preprocessing for better OCR
    print("\n[2/3] Applying final OCR optimization...")
    
    # Ensure proper contrast
    img = cv2.equalizeHist(img)
    
    # Make sure text is black on white
    if np.mean(img) < 127:
        img = cv2.bitwise_not(img)
    
    print("\n[3/3] Running OCR with multiple passes...")
    
    # Try multiple configurations with different parameters
    configs = [
        r'--oem 3 --psm 6',   # Uniform text block
        r'--oem 3 --psm 4',   # Single column
        r'--oem 3 --psm 11',  # Sparse text
        r'--oem 1 --psm 6',   # Legacy engine
        r'--oem 3 --psm 3',   # Fully automatic
    ]
    
    all_texts = []
    best_text = ""
    max_length = 0
    
    for i, config in enumerate(configs, 1):
        try:
            print(f"  Pass {i}/{len(configs)}...", end=" ")
            text = pytesseract.image_to_string(img, lang='eng', config=config)
            all_texts.append(text)
            if len(text) > max_length:
                max_length = len(text)
                best_text = text
            print(f"({len(text)} chars)")
        except Exception as e:
            print(f"Failed: {e}")
            continue
    
    # Also try to get data with confidence scores
    try:
        print("  Getting detailed OCR data...")
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT, config=r'--oem 3 --psm 6')
        # Filter by confidence and combine
        confident_words = []
        for i in range(len(data['text'])):
            if int(data['conf'][i]) > 20 and data['text'][i].strip():  # Lower threshold
                confident_words.append(data['text'][i])
        detailed_text = ' '.join(confident_words)
        all_texts.append(detailed_text)
    except Exception as e:
        print(f"  Detailed OCR failed: {e}")
    
    # Combine all results with the best result first
    combined_text = best_text + '\n' + '\n'.join(all_texts)
    
    print(f"\n✓ OCR complete - extracted {len(combined_text)} characters")
    return combined_text

def parse_payment_details(text):
    """
    Extract specific payment fields from OCR text
    """
    print("\n[3/3] Parsing payment details...")
    
    # Clean text - handle common OCR errors
    text = text.replace('\n', ' ')
    text = text.replace('|', 'I')
    text = text.replace('l', '1')  # lowercase L to 1
    text = text.replace('O', '0')  # capital O to 0 in numbers
    text = text.replace('o', '0')  # lowercase o to 0 in numbers
    
    results = {
        'amount': None,
        'date': None,
        'time': None,
        'receiver': None,
        'sender': None,
        'upi_transaction_id': None,
        'google_transaction_id': None,
        'note': None
    }
    
    print("\n" + "="*70)
    print("RAW OCR TEXT:")
    print("="*70)
    print(text[:800] if len(text) > 800 else text)
    print("="*70)
    
    # Extract Amount - be more flexible
    amount_patterns = [
        r'[₹Rs]\s*(\d+)',
        r'₹(\d+)',
        r'\b(\d{2})\b.*?(?:Super|Money|UPI|Paid)',  # 2 digit number before payment text
        r'^\s*(\d{2,})\s*$',  # Number on its own line
    ]
    for pattern in amount_patterns:
        matches = re.findall(pattern, text, re.MULTILINE)
        if matches:
            for amt in matches:
                amt = amt.strip()
                if 2 <= len(amt) <= 6:  # Reasonable amount length
                    results['amount'] = amt
                    break
            if results['amount']:
                break
    
    # Extract Date - more patterns
    date_patterns = [
        r'(\d{1,2}\s+Jan(?:uary)?\s+\d{4})',
        r'(\d{1,2}\s+Feb(?:ruary)?\s+\d{4})',
        r'(\d{1,2}\s+Mar(?:ch)?\s+\d{4})',
        r'(\d{1,2}\s+Apr(?:il)?\s+\d{4})',
        r'(\d{1,2}\s+May\s+\d{4})',
        r'(\d{1,2}\s+Jun(?:e)?\s+\d{4})',
        r'(\d{1,2}\s+Jul(?:y)?\s+\d{4})',
        r'(\d{1,2}\s+Aug(?:ust)?\s+\d{4})',
        r'(\d{1,2}\s+Sep(?:tember)?\s+\d{4})',
        r'(\d{1,2}\s+Oct(?:ober)?\s+\d{4})',
        r'(\d{1,2}\s+Nov(?:ember)?\s+\d{4})',
        r'(\d{1,2}\s+Dec(?:ember)?\s+\d{4})',
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            results['date'] = match.group(1).strip()
            break
    
    # Extract Time - more flexible
    time_patterns = [
        r'(\d{1,2}:\d{2}\s*(?:am|pm))',
        r'(\d{1,2}\s*:\s*\d{2}\s*(?:am|pm)?)',
    ]
    for pattern in time_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            results['time'] = match.group(1).strip()
            break
    
    # Extract UPI Transaction ID - look for 12+ digit sequences
    upi_patterns = [
        r'UPI.*?[Tt]ransaction.*?[IiDd]{2}\s*[:\s]*(\d{12,})',
        r'[Tt]ransaction.*?[IiDd]{2}\s*[:\s]*(\d{12,})',
        r'\b(\d{12,15})\b',  # 12-15 digit number
    ]
    for pattern in upi_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            results['upi_transaction_id'] = matches[0]
            break
    
    # Extract Google Transaction ID - alphanumeric
    google_patterns = [
        r'Google.*?[Tt]ransaction.*?[IiDd]{2}\s*[:\s]*([A-Za-z0-9]{8,})',
        r'Google.*?[Pp]ay.*?([A-Za-z0-9]{8,}@[A-Za-z0-9]+)',
        r'\b([A-Z]{2}[0-9A-Z]{8,})\b',
    ]
    for pattern in google_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            if match != results['upi_transaction_id'] and len(match) >= 8:
                results['google_transaction_id'] = match
                break
        if results['google_transaction_id']:
            break
    
    # Extract Receiver - "To:" patterns
    to_patterns = [
        r'[Tt]o\s*:?\s*([A-Z][A-Z\s\.]+?)(?:\s+Google|\s+\(|$|\d)',
        r'[Pp]aid\s+to\s+([A-Z][A-Z\s\.]+?)(?:\s+Google|\s+\(|$|\d)',
        r'[Tt]o:\s*([A-Z][A-Z\s\.]+)',
    ]
    for pattern in to_patterns:
        match = re.search(pattern, text)
        if match:
            name = match.group(1).strip()
            # Clean up name
            name = re.sub(r'\s+', ' ', name)  # Multiple spaces to single
            if 3 <= len(name) <= 50 and not any(char.isdigit() for char in name):
                results['receiver'] = name
                break
    
    # Extract Sender - "From:" patterns
    from_patterns = [
        r'[Ff]rom\s*:?\s*([A-Z][A-Z\s\.]+?)(?:\s+\d|$|₹|\()',
        r'[Ff]rom:\s*([A-Z][A-Z\s\.]+)',
    ]
    for pattern in from_patterns:
        match = re.search(pattern, text)
        if match:
            name = match.group(1).strip()
            name = re.sub(r'\s+', ' ', name)
            if 3 <= len(name) <= 50 and not any(char.isdigit() for char in name):
                results['sender'] = name
                break
    
    # Extract Note/Payment Method
    note_patterns = [
        r'[Pp]aid\s+via\s+([^₹\d\n]{5,}?)(?:\s*\d|$|₹)',
        r'(Super\s+Money\s+UPI)',
        r'(Canara\s+Bank\s*\d*)',
        r'([A-Z][a-z]+\s+Bank\s*\d*)',
        r'([A-Z][a-z]+\s+(?:Money|Pay)\s*[A-Z]*)',
    ]
    for pattern in note_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            note = match.group(1).strip()
            if 3 <= len(note) <= 100:
                results['note'] = note
                break
    
    return results
    
    # Extract Date
    date_patterns = [
        r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            results['date'] = match.group(1).strip()
            break
    
    # Extract Time
    time_patterns = [
        r'(\d{1,2}:\d{2}\s*(?:am|pm))',
        r'(\d{1,2}:\d{2})',
    ]
    for pattern in time_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            results['time'] = match.group(1).strip()
            break
    
    # Extract UPI Transaction ID (12+ digits)
    upi_matches = re.findall(r'\b(\d{12,})\b', text)
    if upi_matches:
        results['upi_transaction_id'] = upi_matches[0]
    
    # Extract Google Transaction ID
    google_patterns = [
        r'Google.*?([A-Z0-9]{10,})',
        r'\b([A-Z]{2,}[0-9]{2,}[A-Z0-9]*)\b',
    ]
    for pattern in google_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            if match != results['upi_transaction_id'] and len(match) >= 8:
                results['google_transaction_id'] = match
                break
        if results['google_transaction_id']:
            break
    
    # Extract Receiver (To: NAME)
    to_patterns = [
        r'[Tt]o\s*:?\s*([A-Z][A-Z\s]+?)(?:\s+\d|\s+Google|\s+\(|$)',
        r'Paid\s+to\s+([A-Z][A-Z\s]+?)(?:\s+\d|\s+Google|\s+\(|$)',
    ]
    for pattern in to_patterns:
        match = re.search(pattern, text)
        if match:
            name = match.group(1).strip()
            if len(name) > 2 and len(name) < 50:
                results['receiver'] = name
                break
    
    # Extract Sender (From: NAME)
    from_patterns = [
        r'[Ff]rom\s*:?\s*([A-Z][A-Z\s\.]+?)(?:\s+\d|\s+Google|\s+\(|$)',
    ]
    for pattern in from_patterns:
        match = re.search(pattern, text)
        if match:
            name = match.group(1).strip()
            if len(name) > 2 and len(name) < 50:
                results['sender'] = name
                break
    
    # Extract Note/Payment Method
    note_patterns = [
        r'(?:Paid\s+via|via)\s+([^\d\n]+?)(?:\s*\d|$)',
        r'((?:Canara|HDFC|ICICI|SBI|Axis|Bank)\s*Bank\s*\d*)',
        r'([A-Z][a-z]+\s+(?:Bank|Money|Pay)\s*\w*)',
        r'(Super\s+Money\s+UPI)',
    ]
    for pattern in note_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            note = match.group(1).strip()
            if len(note) > 3 and len(note) < 100:
                results['note'] = note
                break
    
    return results

def print_results(results):
    """
    Display extracted results
    """
    print("\n" + "="*70)
    print("EXTRACTED PAYMENT DETAILS")
    print("="*70)
    
    print(f"\n💰 Amount: ₹{results['amount']}" if results['amount'] else "\n💰 Amount: NOT FOUND")
    print(f"📅 Date: {results['date']}" if results['date'] else "📅 Date: NOT FOUND")
    print(f"🕐 Time: {results['time']}" if results['time'] else "🕐 Time: NOT FOUND")
    print(f"👤 Receiver: {results['receiver']}" if results['receiver'] else "👤 Receiver: NOT FOUND")
    print(f"👤 Sender: {results['sender']}" if results['sender'] else "👤 Sender: NOT FOUND")
    print(f"🔢 UPI Transaction ID: {results['upi_transaction_id']}" if results['upi_transaction_id'] else "🔢 UPI Transaction ID: NOT FOUND")
    print(f"🔢 Google Transaction ID: {results['google_transaction_id']}" if results['google_transaction_id'] else "🔢 Google Transaction ID: NOT FOUND")
    print(f"📝 Note/Payment Method: {results['note']}" if results['note'] else "📝 Note/Payment Method: NOT FOUND")
    
    print("\n" + "="*70)

def main():
    """
    Main OCR extraction function
    """
    try:
        # Extract text
        text = extract_text_with_ocr()
        
        if text is None:
            return None
        
        # Parse details
        results = parse_payment_details(text)
        
        # Display results
        print_results(results)
        
        return results
        
    except FileNotFoundError:
        print("\n✗ Error: payment_processed.jpg not found!")
        print("Please run preprocess_only.py first")
        return None
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    results = main()