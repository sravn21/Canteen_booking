import React, { useState, useRef, useEffect } from "react";

// ── STYLES ────────────────────────────────────────────────────────────────────
const CAMERA_CSS = `
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

  .camera-container {
    min-height: 100vh;
    background: var(--dark);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    padding: 20px;
  }

  .camera-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    width: 100%;
    max-width: 640px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    position: relative;
    animation: slideUp 0.5s ease;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .camera-header {
    background: linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%);
    padding: 24px;
    text-align: center;
  }

  .camera-header h2 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    color: white;
    margin: 0;
    font-size: 1.5rem;
  }

  .viewfinder {
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

  .camera-controls {
    padding: 30px;
    display: flex;
    gap: 15px;
    justify-content: center;
    background: var(--dark2);
  }

  .btn-cam {
    padding: 14px 28px;
    border-radius: 50px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    border: none;
    transition: all 0.25s;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0.5px;
  }

  .btn-capture {
    background: linear-gradient(135deg, var(--teal) 0%, #14B8A6 100%);
    color: var(--dark);
    box-shadow: 0 6px 20px rgba(45,212,191,0.3);
  }

  .btn-capture:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(45,212,191,0.4);
  }

  .btn-retake {
    background: transparent;
    border: 1.5px solid var(--coral);
    color: var(--coral);
  }

  .btn-retake:hover {
    background: rgba(255,107,91,0.1);
  }

  .status-tag {
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
`;

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function CameraPage() {
  const [hasCaptured, setHasCaptured] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize Camera
  useEffect(() => {
    if (!hasCaptured) {
      startCamera();
    }
    // Cleanup function to stop camera when component closes or captured
    return () => stopCamera();
  }, [hasCaptured]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      setError("Camera access denied. Please check permissions.");
      console.error(err);
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
      // Set canvas to match video resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      stopCamera();
      setHasCaptured(true);
    }
  };

  const handleRetake = () => {
    setHasCaptured(false);
  };

  return (
    <div className="camera-container">
      <style>{CAMERA_CSS}</style>

      <div className="camera-card">
        <div className="camera-header">
          <h2>{hasCaptured ? "Verify Photo 📸" : "Camera Access 🤳"}</h2>
        </div>

        <div className="viewfinder">
          <div className="status-tag">
            {hasCaptured ? "● Preview" : "● Live Feed"}
          </div>

          {error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#FCA5A5' }}>
              ❌ {error}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ display: hasCaptured ? 'none' : 'block' }}
              />
              <canvas
                ref={canvasRef}
                style={{ display: hasCaptured ? 'block' : 'none' }}
              />
            </>
          )}
        </div>

        <div className="camera-controls">
          {!hasCaptured ? (
            <button className="btn-cam btn-capture" onClick={capturePhoto} disabled={!!error}>
              <span>📸</span> CAPTURE PHOTO
            </button>
          ) : (
            <>
              <button className="btn-cam btn-retake" onClick={handleRetake}>
                <span>🔄</span> RETAKE
              </button>
              <button className="btn-cam btn-capture" onClick={() => alert("Identity Verified!")}>
                <span>✅</span> CONFIRM
              </button>
            </>
          )}
        </div>
      </div>

      <p style={{ marginTop: 24, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
        Powered by Q-Less Security Framework
      </p>
    </div>
  );
}
