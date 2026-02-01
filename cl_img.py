"""
Camera capture script for Gapy payment interface shown on phone
Captures image from laptop webcam and saves as payment.jpg
Windows compatible version - Live preview with SPACE to capture
"""

import cv2

def capture_with_preview():
    """
    Opens live camera preview window
    Press SPACE to capture, ESC to exit
    """
    print("Initializing camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Could not open default camera, trying alternative...")
        cap = cv2.VideoCapture(1)
        if not cap.isOpened():
            print("Error: No camera found")
            return
    
    print("Camera opened successfully!")
    print("Live preview window will open shortly...")
    print("")
    print("Instructions:")
    print("  - Position your phone with the Gapy payment interface in front of the camera")
    print("  - Press SPACE to capture the image")
    print("  - Press ESC to exit without capturing")
    print("")
    
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("Error: Failed to read from camera")
            break
        
        # Display the live preview
        cv2.imshow('Live Camera Preview - SPACE to capture, ESC to exit', frame)
        
        # Wait for key press (1ms delay)
        key = cv2.waitKey(1) & 0xFF
        
        # SPACE key (32) to capture
        if key == 32:
            cv2.imwrite('payment.jpg', frame)
            print("✓ Photo captured and saved as payment.jpg")
            break
        
        # ESC key (27) to exit
        elif key == 27:
            print("Capture cancelled")
            break
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("Camera released")

if __name__ == "__main__":
    try:
        capture_with_preview()
    except KeyboardInterrupt:
        print("\n\nCapture cancelled by user")
    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure opencv-python is installed:")
        print("pip install opencv-python")