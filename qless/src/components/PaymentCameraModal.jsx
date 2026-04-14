import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --coral: #FF6B5B;
    --coral-dark: #E8503F;
    --teal: #2DD4BF;
    --dark: #0F1923;
    --dark2: #1A2737;
    --surface: #1E2D3D;
    --text: #F0F4F8;
    --border: rgba(255,255,255,0.08);
  }

  .payment-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: 'DM Sans', sans-serif;
  }

  .payment-modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    animation: slideUp 0.5s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .payment-modal-header {
    background: linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%);
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .payment-modal-header h2 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    color: white;
    margin: 0;
    font-size: 1.3rem;
    flex: 1;
  }

  .modal-close-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .modal-close-btn:hover {
    background: rgba(255,255,255,0.3);
  }

  .payment-modal-close-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .payment-viewfinder {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  video, canvas {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .payment-status-tag {
    position: absolute;
    top: 15px;
    left: 15px;
    padding: 5px 12px;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(5px);
    border-radius: 50px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--teal);
    border: 1px solid rgba(45,212,191,0.3);
    z-index: 10;
  }

  .payment-controls {
    padding: 30px;
    display: flex;
    gap: 15px;
    justify-content: center;
    background: var(--dark2);
  }

  .btn-payment {
    padding: 12px 24px;
    border-radius: 50px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    border: none;
    transition: all 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    letter-spacing: 0.5px;
  }

  .btn-capture {
    background: linear-gradient(135deg, var(--teal) 0%, #14B8A6 100%);
    color: var(--dark);
    box-shadow: 0 6px 20px rgba(45,212,191,0.3);
  }

  .btn-capture:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(45,212,191,0.4);
  }

  .btn-capture:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-retake {
    background: transparent;
    border: 1.5px solid var(--coral);
    color: var(--coral);
  }

  .btn-retake:hover {
    background: rgba(255,107,91,0.1);
  }

  .btn-confirm {
    background: linear-gradient(135deg, var(--teal) 0%, #14B8A6 100%);
    color: var(--dark);
    box-shadow: 0 6px 20px rgba(45,212,191,0.3);
  }

  .btn-confirm:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(45,212,191,0.4);
  }

  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .result-container {
    padding: 40px 30px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    text-align: center;
    color: var(--text);
  }

  .result-success {
    padding: 20px;
    background: rgba(45, 212, 191, 0.1);
    border: 1px solid rgba(45, 212, 191, 0.3);
    border-radius: 12px;
  }

  .result-success h3 {
    margin: 0 0 15px 0;
    color: var(--teal);
    font-size: 1.2rem;
  }

  .result-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
    font-size: 0.9rem;
  }

  .result-detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid rgba(45, 212, 191, 0.2);
  }

  .result-detail-label {
    color: rgba(255,255,255,0.6);
  }

  .result-detail-value {
    font-weight: 600;
    color: var(--teal);
  }

  .result-error {
    padding: 20px;
    background: rgba(255, 107, 91, 0.1);
    border: 1px solid rgba(255, 107, 91, 0.3);
    border-radius: 12px;
  }

  .result-error h3 {
    margin: 0 0 10px 0;
    color: var(--coral);
    font-size: 1.1rem;
  }

  .result-error p {
    margin: 0;
    font-size: 0.9rem;
  }

  .error-message {
    padding: 30px;
    text-align: center;
    color: rgba(255,107,91,0.8);
    font-size: 0.95rem;
  }

  .modal-content {
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    overflow-y: auto;
  }
`;

export default function PaymentCameraModal({ order, onClose, onSuccess }) {
  const [state, setState] = useState("live"); // live, preview, loading, success, error
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize Camera
  useEffect(() => {
    if (state === "live") {
      startCamera();
    }
    return () => stopCamera();
  }, [state]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1440 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied. Please check permissions and try again.");
      setState("error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      stopCamera();
      setState("preview");
    }
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    setError(null);

    try {
      // Convert canvas to blob with high quality
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError("Failed to process image");
          setLoading(false);
          setState("error");
          return;
        }

        // Create FormData with image and orderNumber
        const formData = new FormData();
        formData.append("image", blob, `payment_order_${order.orderNumber}.jpg`);
        formData.append("orderNumber", order.orderNumber);

        try {
          // Send to backend
          const res = await axios.post("/api/process_payment", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });

          if (res.data.success) {
            setResult(res.data.extracted);
            setState("success");
            // Auto-close after 2 seconds
            setTimeout(() => {
              if (onSuccess) onSuccess(res.data.order);
              onClose();
            }, 2000);
          } else {
            setError(res.data.error || "Verification failed");
            setState("error");
          }
        } catch (apiError) {
          console.error("API error:", apiError);
          const errorMsg =
            apiError.response?.data?.error ||
            apiError.message ||
            "Failed to verify payment";
          setError(errorMsg);
          setState("error");
        }

        setLoading(false);
      }, 'image/jpeg', 0.95); // 95% JPEG quality for better OCR
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to process image");
      setState("error");
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setCameraError(null);
    setResult(null);
    setState("live");
  };

  const isCloseable = state === "success" || state === "error" || (state === "preview" && !loading);

  return (
    <div className="payment-modal-overlay">
      <style>{MODAL_CSS}</style>

      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>
            {state === "live" && "📸 Capture Payment"}
            {state === "preview" && "✓ Verify Photo"}
            {state === "loading" && "⏳ Processing..."}
            {state === "success" && "✅ Verified!"}
            {state === "error" && "❌ Verification Failed"}
          </h2>
          <button
            className={`modal-close-btn ${!isCloseable ? "payment-modal-close-disabled" : ""}`}
            onClick={onClose}
            disabled={!isCloseable}
            title={isCloseable ? "Close" : "Cannot close while processing"}
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          {/* Camera Feed / Canvas / Result */}
          {(state === "live" || state === "preview") && (
            <div className="payment-viewfinder">
              <div className="payment-status-tag">
                {state === "live" ? "● Live Feed" : "● Preview"}
              </div>

              {cameraError ? (
                <div className="error-message">{cameraError}</div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ display: state === "live" ? "block" : "none" }}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{ display: state === "preview" ? "block" : "none" }}
                  />
                </>
              )}
            </div>
          )}

          {/* Loading State */}
          {state === "loading" && (
            <div className="result-container">
              <div className="loading-spinner"></div>
              <p>Processing payment verification...</p>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                Extracting payment details from image
              </p>
            </div>
          )}

          {/* Success State */}
          {state === "success" && result && (
            <div className="result-container">
              <div className="result-success">
                <h3>✅ Payment Verified Successfully!</h3>
                <div className="result-details">
                  <div className="result-detail-row">
                    <span className="result-detail-label">Order Amount:</span>
                    <span className="result-detail-value">₹{result.amount}</span>
                  </div>
                  <div className="result-detail-row">
                    <span className="result-detail-label">Receiver UPI:</span>
                    <span className="result-detail-value">{result.receiver_upi || "N/A"}</span>
                  </div>
                  {result.upi_transaction_id && (
                    <div className="result-detail-row">
                      <span className="result-detail-label">Transaction ID:</span>
                      <span className="result-detail-value">{result.upi_transaction_id}</span>
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                Closing in 2 seconds...
              </p>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="result-container">
              <div className="result-error">
                <h3>❌ Verification Failed</h3>
                <p>{error || cameraError || "Unknown error occurred"}</p>
              </div>
              {error && error.includes("Amount mismatch") && (
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                  The amount in the payment screenshot doesn't match the order total.
                </p>
              )}
              {error && error.includes("wrong UPI") && (
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                  The payment was sent to the wrong UPI address.
                </p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="payment-controls">
            {state === "live" && !cameraError && (
              <button
                className="btn-payment btn-capture"
                onClick={capturePhoto}
              >
                <span>📸</span> CAPTURE
              </button>
            )}

            {state === "preview" && !loading && (
              <>
                <button className="btn-payment btn-retake" onClick={handleRetry}>
                  <span>🔄</span> RETAKE
                </button>
                <button
                  className="btn-payment btn-confirm"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  <span>✅</span> VERIFY PAYMENT
                </button>
              </>
            )}

            {state === "loading" && (
              <button className="btn-payment btn-capture" disabled>
                <div className="loading-spinner"></div> PROCESSING...
              </button>
            )}

            {state === "error" && (
              <>
                <button className="btn-payment btn-retake" onClick={handleRetry}>
                  <span>🔄</span> RETRY
                </button>
                <button className="btn-payment btn-capture" onClick={onClose}>
                  <span>✕</span> CLOSE
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
