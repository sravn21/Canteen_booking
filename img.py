import cv2

cap = cv2.VideoCapture(0)

print("Press 's' to capture image")

while True:
    ret, frame = cap.read()
    cv2.imshow("Capture GPay Screen", frame)

    key = cv2.waitKey(1)
    if key == ord('s'):
        cv2.imwrite("payment.jpg", frame)
        print("Image captured!")
        break

cap.release()
cv2.destroyAllWindows()
