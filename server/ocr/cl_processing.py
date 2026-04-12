"""
Simple preprocessing for GPay screenshots
Minimal processing for maximum OCR accuracy
"""

import cv2
import numpy as np

def preprocess_screenshot(input_path='payment.jpg', output_path='payment_processed.jpg'):
    """
    Simple preprocessing - just invert and upscale
    """
    print("="*70)
    print("PREPROCESSING SCREENSHOT")
    print("="*70)
    
    print(f"\nLoading: {input_path}")
    img = cv2.imread(input_path)
    
    if img is None:
        print(f"✗ Error: Could not load {input_path}")
        return False
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Invert if dark background
    if np.mean(gray) < 127:
        gray = cv2.bitwise_not(gray)
    
    # Upscale 2x for better OCR
    resized = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    
    # Save
    cv2.imwrite(output_path, resized)
    
    print(f"✓ Saved: {output_path}")
    print("="*70)
    
    return True

if __name__ == "__main__":
    try:
        preprocess_screenshot()
    except Exception as e:
        print(f"✗ Error: {e}")