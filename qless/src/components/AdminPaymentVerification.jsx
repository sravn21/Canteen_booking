import React, { useState } from "react";
import PaymentCameraModal from "./PaymentCameraModal";

export default function AdminPaymentVerification({ orders, onBack, setPaymentVerificationOrder, togglePayment }) {
  const [searchStudentId, setSearchStudentId] = useState("");
  const [paymentVerificationOrder, setPaymentVerificationOrderLocal] = useState(null);

  // Filter orders by Student ID
  const filteredOrders = orders.filter(order =>
    order.studentId && order.studentId.toLowerCase().includes(searchStudentId.toLowerCase())
  );

  const handleCameraModalClose = () => {
    setPaymentVerificationOrderLocal(null);
  };

  const handlePaymentSuccess = (updatedOrder) => {
    // Order is already updated from parent; just close modal
    setPaymentVerificationOrderLocal(null);
  };

  return (
    <div className="admin-payment-verification">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="page-title">Digital Payment Verification</div>
        <button
          className="pay-toggle-btn"
          style={{ background: "var(--coral)", color: "white" }}
          onClick={onBack}
          title="Back to manual payment"
        >
          ← Back to Manual
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <label className="form-label">Search by Student ID</label>
        <input
          type="text"
          className="admin-input"
          placeholder="Enter Student ID (e.g., STU123)"
          value={searchStudentId}
          onChange={(e) => setSearchStudentId(e.target.value)}
          style={{ width: "100%", padding: "10px", fontSize: "1rem" }}
        />
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: "15px", color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
        {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found
      </div>

      {/* No Results */}
      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">🔍</div>
          {searchStudentId ? "No orders found for this Student ID." : "Enter a Student ID to search."}
        </div>
      ) : (
        /* Orders Grid */
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order._id} className={`live-order-card ${order.status === "preparing" ? "new" : ""}`}>
              <div className="live-order-header">
                <div>
                  <div className="live-order-id">{order.orderNumber || `Order #${order._id.slice(-6)}`}</div>
                  <div className="live-order-student">{order.studentName} · {order.studentId}</div>
                </div>
                <div className={`order-status status-${order.status}`}>
                  {order.status === "preparing" ? "⏳ Preparing" : "✅ Ready"}
                </div>
              </div>

              <div className="live-order-items">
                {(order.items || []).map(i => (
                  <div key={i.id || `${order._id}-${i.name}`}>
                    • {i.name} × {i.qty}
                  </div>
                ))}
              </div>

              {/* Payment Status and Verify Button */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                <span className={`pay-badge ${order.paid ? "paid" : "pending"}`}>
                  {order.paid ? "✔ Payment Done" : "⏳ Payment Pending"}
                </span>
                {!order.paid && (
                  <button
                    className="status-btn ready"
                    style={{ marginLeft: "auto", padding: "8px 12px", fontSize: "0.85rem", background: "var(--teal)", color: "var(--dark)" }}
                    onClick={() => setPaymentVerificationOrderLocal(order)}
                  >
                    📷 Verify via Pi
                  </button>
                )}
              </div>

              {/* Amount */}
              <div className="live-order-footer">
                <div className="live-order-total">₹{order.total}</div>
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
