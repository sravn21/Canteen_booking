"""
Payment Receipt OCR - Using EasyOCR for High Accuracy
Extracts: Amount (₹), Receiver UPI ID
Simplified and focused extraction
"""

import sys
import os
import json
import re
from difflib import SequenceMatcher  # For fuzzy matching

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    print("[WARN] EasyOCR not installed. Install with: pip install easyocr")


# Initialize reader once globally (expensive operation)
_reader = None


def get_ocr_reader():
    """Get or create OCR reader"""
    global _reader
    if _reader is None:
        print("[OCR] Initializing EasyOCR reader...")
        # Suppress verbose output and progress bars
        import warnings
        warnings.filterwarnings('ignore')

        # Redirect stderr to suppress progress bars
        import io
        import contextlib

        f = io.StringIO()
        with contextlib.redirect_stderr(f):
            _reader = easyocr.Reader(['en'], verbose=False, gpu=False)

        print("[OCR] Reader initialized successfully")
    return _reader


def extract_text_easyocr(img_path):
    """Extract text using EasyOCR - much more accurate than Tesseract"""
    if not EASYOCR_AVAILABLE:
        raise Exception("EasyOCR not installed. Run: pip install easyocr")

    reader = get_ocr_reader()

    # Extract text from image
    results = reader.readtext(img_path)

    # Combine all text blocks into one string
    full_text = ""
    for detection in results:
        text = detection[1]
        confidence = detection[2]
        # Only include high confidence text
        if confidence > 0.3:
            full_text += text + " "

    print("[OCR] Text extracted successfully")
    print("[OCR] Preview:", full_text[:300])

    # Save raw OCR output for debugging
    debug_data = {"raw_text": full_text, "method": "EasyOCR", "confidence_threshold": 0.3}
    with open(os.path.join(os.path.dirname(__file__), "debug.json"), "w") as f:
        json.dump(debug_data, f)

    return full_text


def extract_amount(text, expected_amount=None):
    """
    Extract payment amount from text.
    Looking for: ₹120, Rs 60, INR 80, etc.
    """
    results = {
        'amount': None,
        'receiver_upi': None
    }

    # Normalize text
    norm = text.lower()

    # If we have expected amount, search for it first (most reliable)
    if expected_amount:
        expected_str = str(expected_amount).strip()
        print(f"[SEARCH] Looking for expected amount: {expected_str}")

        # Strategy 1: Exact match anywhere
        if expected_str in norm:
            results['amount'] = expected_str
            print(f"[OK] Found exact amount: {expected_str}")
            return results

        # Strategy 2: Handle 0 read as O
        expected_with_O = expected_str.replace("0", "o")
        if expected_with_O in norm:
            results['amount'] = expected_str
            print(f"[OK] Found amount (0 as O): {expected_str}")
            return results

        # Strategy 3: With currency symbols (flexible)
        for currency in ['₹', 'rs', 'rupee', 'inr', 'r', 'r.']:
            # Try with space
            pattern = rf'{re.escape(currency)}\s*{expected_str}'
            if re.search(pattern, norm, re.IGNORECASE):
                results['amount'] = expected_str
                print(f"[OK] Found amount with currency: {expected_str}")
                return results

            # Try with O instead of 0
            pattern = rf'{re.escape(currency)}\s*{expected_with_O}'
            if re.search(pattern, norm, re.IGNORECASE):
                results['amount'] = expected_str
                print(f"[OK] Found amount with currency (O as 0): {expected_str}")
                return results

        # Strategy 4: With space or special chars
        pattern = rf'[^a-z0-9]{expected_str}[^a-z0-9]'
        if re.search(pattern, norm):
            results['amount'] = expected_str
            print(f"[OK] Found amount with boundaries: {expected_str}")
            return results

        # Strategy 5: With O instead of 0 and space/special
        pattern = rf'[^a-z0-9]{expected_with_O}[^a-z0-9]'
        if re.search(pattern, norm):
            results['amount'] = expected_str
            print(f"[OK] Found amount with O boundaries: {expected_str}")
            return results

        print(f"[FAIL] Could not find expected amount: {expected_str}")
        print(f"[INFO] Searching in text: {norm[:200]}")

    # Fallback: Extract any amount pattern if no expected amount or match failed
    amount_patterns = [
        (r'[₹r]\s*(\d+)', 'rupee symbol'),
        (r'rs[\.\s]*(\d+)', 'rs'),
        (r'inr\s*(\d+)', 'inr'),
        (r'\b(\d{2,5})\s*(?:rupee|inr|rs|₹)', 'amount before currency'),
    ]

    for pattern, desc in amount_patterns:
        match = re.search(pattern, norm, re.IGNORECASE)
        if match:
            amt = match.group(1)
            if 10 <= int(amt) <= 99999:  # reasonable amount range
                results['amount'] = amt
                print(f"[OK] Fallback: Found amount ({desc}): {amt}")
                return results

    print("[FAIL] No amount found in text")
    return results


def extract_upi(text):
    """Extract UPI ID from text with fuzzy matching"""
    # UPI format: username@bank
    upi_pattern = r'([a-z0-9._-]+@[a-z0-9]+)'
    matches = re.findall(upi_pattern, text.lower())

    if not matches:
        print("[INFO] No UPI found in text")
        return None

    # Known UPI bank domains
    known_banks = [
        'okhdfcbank', 'okaxis', 'okicici', 'okibsl', 'okhbank',  # OK domains
        'paytm', 'upi', 'ibl', 'hdfc', 'icic', 'axis',  # Generic
        'google', 'phonepe', 'whatsapp', 'airtel',  # New apps
    ]

    print(f"[INFO] Found {len(matches)} email-like patterns")

    for upi in matches:
        if '@' not in upi:
            continue

        username, domain = upi.split('@', 1)

        # Try exact match with known banks
        if any(bank in domain for bank in known_banks):
            print(f"[OK] Found valid UPI: {upi}")
            return upi

        # Try fuzzy matching if no exact match
        # Find the best matching known bank for this domain
        best_match = None
        best_score = 0.8  # 80% similarity threshold

        for known_bank in known_banks:
            similarity = SequenceMatcher(None, domain, known_bank).ratio()
            if similarity > best_score:
                best_score = similarity
                best_match = known_bank

        if best_match:
            corrected_upi = f"{username}@{best_match}"
            print(f"[OK] Found UPI (fuzzy match {best_score:.0%}): {corrected_upi}")
            return corrected_upi

    # Fallback: return first match even if domain isn't recognized
    print(f"[INFO] Using first match (unrecognized domain): {matches[0]}")
    return matches[0]


def parse_payment(img_path, expected_amount=None):
    """Main extraction function"""
    print(f"\n[START] Extracting payment details from: {img_path}")

    try:
        # Extract text using EasyOCR
        text = extract_text_easyocr(img_path)

        # Extract amount
        print("\n[AMOUNT] Extracting amount...")
        results = extract_amount(text, expected_amount)

        # Extract UPI
        print("[UPI] Extracting UPI ID...")
        upi = extract_upi(text)
        results['receiver_upi'] = upi

        print(f"\n[RESULT] Amount: {results['amount']}, UPI: {results['receiver_upi']}")

        return results

    except Exception as e:
        print(f"[ERROR] Extraction failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'amount': None, 'receiver_upi': None, 'error': str(e)}


def save_json(results, output_filename="payment_details.json"):
    """Save results to JSON file"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, output_filename)

    with open(json_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"[SAVE] JSON saved at: {json_path}")


def main():
    """Main entry point - called by Node.js"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))

        # Read arguments from Node.js
        input_filename = sys.argv[1] if len(sys.argv) > 1 else "payment.jpg"
        output_filename = sys.argv[2] if len(sys.argv) > 2 else "payment_details.json"
        expected_amount = sys.argv[3] if len(sys.argv) > 3 else None

        img_path = os.path.join(base_dir, input_filename)

        print("=" * 60)
        print("[INIT] Payment OCR Processing")
        print(f"[INIT] Image: {input_filename}")
        print(f"[INIT] Expected Amount: {expected_amount}")
        print("=" * 60)

        if not os.path.exists(img_path):
            raise Exception(f"Image file not found: {img_path}")

        # Extract payment details
        results = parse_payment(img_path, expected_amount)

        # Save to JSON
        save_json(results, output_filename)

        # Print final results
        print("\n" + "=" * 60)
        print("[FINAL] Extracted Data:")
        print(f"  Amount: {results.get('amount', 'NOT FOUND')}")
        print(f"  UPI: {results.get('receiver_upi', 'NOT FOUND')}")
        print("=" * 60)

    except Exception as e:
        print(f"\n[FATAL] {str(e)}")

        # Save error result
        error_result = {
            'amount': None,
            'receiver_upi': None,
            'error': str(e)
        }

        base_dir = os.path.dirname(os.path.abspath(__file__))
        error_path = os.path.join(base_dir, "payment_details.json")
        with open(error_path, "w") as f:
            json.dump(error_result, f)


if __name__ == "__main__":
    main()
