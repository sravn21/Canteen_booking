import React, { useState, useEffect } from "react";
import axios from "axios";
import PaymentCameraModal from "./PaymentCameraModal";

export default function DigitalPaymentVerificationPage({ orders, togglePayment }) {
  const [searchStudentId, setSearchStudentId] = useState("");
  const [paymentVerificationOrder, setPaymentVerificationOrder] = useState(null);
  const [liveOrders, setLiveOrders] = useState(orders || []);

  // Fetch orders periodically
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/orders");
        setLiveOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders by Student ID and exclude completed/cancelled orders
  const filteredOrders = liveOrders.filter(order =>
    order.studentId && order.studentId.toLowerCase().includes(searchStudentId.toLowerCase()) && 
    order.status !== "completed" && order.status !== "cancelled"
  );

  const handleCameraModalClose = () => {
    setPaymentVerificationOrder(null);
  };

  const handlePaymentSuccess = (updatedOrder) => {
    // Refresh orders after payment verification
    setLiveOrders(o => o.map(x => x._id === updatedOrder._id ? updatedOrder : x));
    setPaymentVerificationOrder(null);
  };

  // Prevent closing this window
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to close the payment verification window?";
      return "Are you sure you want to close the payment verification window?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "'DM Sans', sans-serif", background: "var(--surface, #1E2D3D)", minHeight: "100vh", color: "var(--text, #F0F4F8)" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "10px" }}>🔍 Digital Payment Verification</div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "600" }}>Search by Student ID</label>
        <input
          type="text"
          placeholder="Enter Student ID (e.g., STU123)"
          value={searchStudentId}
          onChange={(e) => setSearchStudentId(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "1rem",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.05)",
            color: "var(--text, #F0F4F8)"
          }}
        />
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: "15px", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
        {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found
      </div>

      {/* No Results */}
      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🔍</div>
          <div>{searchStudentId ? "No orders found for this Student ID." : "Enter a Student ID to search."}</div>
        </div>
      ) : (
        /* Orders Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "15px" }}>
          {filteredOrders.map(order => (
            <div
              key={order._id}
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "15px",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)"
              }}
            >
              {/* Order Header */}
              <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--teal, #2DD4BF)" }}>{order.orderNumber || `Order #${order._id.slice(-6)}`}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>{order.studentName} · {order.studentId}</div>
                </div>
                <div style={{ background: order.status === "preparing" ? "rgba(255,107,91,0.2)" : "rgba(45,212,191,0.2)", color:order.status === "preparing" ? "var(--coral)" : "var(--teal)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600" }}>
                  {order.status === "preparing" ? "⏳ Preparing" : "✅ Ready"}
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: "10px", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                {(order.items || []).map(i => (
                  <div key={i.id || `${order._id}-${i.name}`}>• {i.name} × {i.qty}</div>
                ))}
              </div>

              {/* Payment Status */}
              <div style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "600", background: order.paid ? "rgba(45,212,191,0.2)" : "rgba(255,107,91,0.2)", color: order.paid ? "var(--teal)" : "var(--coral)" }}>
                  {order.paid ? "✔ Payment Done" : "⏳ Payment Pending"}
                </span>
                {!order.paid && (
                  <button
                    onClick={() => setPaymentVerificationOrder(order)}
                    style={{
                      marginLeft: "auto",
                      padding: "6px 12px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      background: "var(--teal, #2DD4BF)",
                      color: "var(--dark, #0F1923)",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
                  >
                    📷 Verify
                  </button>
                )}
              </div>

              {/* Amount */}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", fontSize: "0.9rem", fontWeight: "600" }}>
                <span>Amount:</span>
                <span style={{ color: "var(--teal, #2DD4BF)" }}>₹{order.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Modal */}
      {paymentVerificationOrder && (
        <PaymentCameraModal
          order={paymentVerificationOrder}
          onClose={handleCameraModalClose}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
