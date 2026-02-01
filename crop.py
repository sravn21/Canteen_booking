import cv2

img = cv2.imread("processed_tuned.jpg")
h, w = img.shape[:2]

# Keep almost entire screen area
crop = img[int(h*0.10):int(h*0.85),
           int(w*0.20):int(w*0.80)]

cv2.imwrite("crop_loose.jpg", crop)
