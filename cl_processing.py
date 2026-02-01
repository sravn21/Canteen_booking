"""
Image preprocessing for GPay payment screenshots
Takes payment.jpg (camera capture) and creates payment_processed.jpg
Optimized for OCR with aggressive enhancement
"""

import cv2
import numpy as np

def preprocess_for_ocr(input_path='payment.jpg', output_path='payment_processed.jpg'):
    """
    Gentle preprocessing pipeline that preserves text quality for OCR
    """
    print("="*70)
    print("PREPROCESSING IMAGE FOR OCR")
    print("="*70)
    
    print(f"\n[1/6] Loading image: {input_path}")
    img = cv2.imread(input_path)
    
    if img is None:
        print(f"✗ Error: Could not load {input_path}")
        return False
    
    print(f"  Original size: {img.shape[1]}x{img.shape[0]} pixels")
    
    # Convert to grayscale
    print("\n[2/6] Converting to grayscale...")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Moderate upscaling (2x instead of 3x)
    print("\n[3/6] Upscaling image (2x)...")
    height, width = gray.shape
    gray = cv2.resize(gray, (width*2, height*2), interpolation=cv2.INTER_CUBIC)
    print(f"  New size: {gray.shape[1]}x{gray.shape[0]} pixels")
    
    # Gentle denoising - preserves edges better
    print("\n[4/6] Applying gentle noise reduction...")
    denoised = cv2.fastNlMeansDenoising(gray, h=8, templateWindowSize=7, searchWindowSize=21)
    
    # Moderate contrast enhancement
    print("\n[5/6] Enhancing contrast...")
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    
    # Very gentle sharpening to preserve text integrity
    kernel = np.array([[0, -0.5, 0],
                       [-0.5, 3, -0.5],
                       [0, -0.5, 0]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    
    # Gentler adaptive thresholding
    print("\n[6/6] Converting to binary (black & white)...")
    binary = cv2.adaptiveThreshold(
        sharpened,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=15,
        C=8
    )
    
    # Invert if background is dark
    if np.mean(binary) < 127:
        binary = cv2.bitwise_not(binary)
    
    # Very minimal morphology - only clean tiny specks
    kernel = np.ones((1, 1), np.uint8)
    processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)
    
    # Save processed image
    print(f"\nSaving processed image: {output_path}")
    cv2.imwrite(output_path, processed)
    
    print("\n" + "="*70)
    print("✓ PREPROCESSING COMPLETE")
    print("="*70)
    print(f"\nProcessed image saved as: {output_path}")
    print("You can now run the OCR script on this file")
    print("="*70)
    
    return True

if __name__ == "__main__":
    try:
        success = preprocess_for_ocr()
        if not success:
            print("\nPreprocessing failed!")
    except FileNotFoundError:
        print("\n✗ Error: payment.jpg not found!")
        print("Please run the camera capture script first")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nMake sure opencv-python is installed:")
        print("pip install opencv-python numpy")