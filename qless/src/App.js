import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ── DATA ──────────────────────────────────────────────────────────────────────
const INITIAL_MENU = [
  { id: 1, name: "Masala Dosa", price: 60, category: "Breakfast", inStock: false, quantity: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Masala_dosa.jpg/640px-Masala_dosa.jpg" },
  { id: 2, name: "Idli Vada", price: 50, category: "Breakfast", inStock: false, quantity: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Idli_Sambar.jpg/640px-Idli_Sambar.jpg" },
  { id: 3, name: "Chicken Biryani", price: 150, category: "Lunch", inStock: false, quantity: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Chicken_biryani.jpg/640px-Chicken_biryani.jpg" },
  { id: 4, name: "Veg Meals", price: 80, category: "Lunch", inStock: false, quantity: 0, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Veg-thali-at-Bharat-Restaurant%2C-Mysore.jpg/640px-Veg-thali-at-Bharat-Restaurant%2C-Mysore.jpg" },
  { id: 5, name: "Egg Puffs", price: 20, category: "Snacks", inStock: true, quantity: 20, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Puff_pastry_01.jpg/640px-Puff_pastry_01.jpg" },
  { id: 6, name: "Tea / Coffee", price: 15, category: "Drinks", inStock: true, quantity: 50, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/640px-A_small_cup_of_coffee.JPG" },
  { id: 7, name: "Lime Juice", price: 25, category: "Drinks", inStock: true, quantity: 30, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Lemonade_from_concentrate.jpg/640px-Lemonade_from_concentrate.jpg" },
  { id: 8, name: "Fried Rice", price: 130, category: "Lunch", inStock: true, quantity: 15, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Fried_rice_-_stonesoup.jpg/640px-Fried_rice_-_stonesoup.jpg" },
  { id: 9, name: "Samosa", price: 15, category: "Snacks", inStock: true, quantity: 40, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Samosachutney.jpg/640px-Samosachutney.jpg" },
  { id: 10, name: "Cold Coffee", price: 40, category: "Drinks", inStock: true, quantity: 25, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Single_coffee_latte_on_white_background.jpg/640px-Single_coffee_latte_on_white_background.jpg" },
];

const USERS = [{ id: "stud", password: "pass123", name: "Rahul Kumar" }];
const ADMIN = { username: "admin", password: "admin123" };

const getQty = (item) => Number(item.quantity || 0);

// ── STYLES ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --coral: #FF6B5B;
    --coral-light: #FF8C7F;
    --coral-dark: #E8503F;
    --teal: #2DD4BF;
    --teal-dark: #14B8A6;
    --dark: #0F1923;
    --dark2: #1A2737;
    --dark3: #243447;
    --text: #F0F4F8;
    --text-muted: #8BA3C1;
    --surface: #1E2D3D;
    --border: rgba(255,255,255,0.08);
    --white: #FFFFFF;
    --green: #22C55E;
    --red: #EF4444;
    --yellow: #F59E0B;
    --shadow: 0 20px 60px rgba(0,0,0,0.4);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--dark);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--dark2); }
  ::-webkit-scrollbar-thumb { background: var(--coral); border-radius: 3px; }

  /* ── LOGIN PAGE ── */
  .login-bg {
    min-height: 100vh;
    background: linear-gradient(135deg, #0F1923 0%, #1A2737 50%, #0F1923 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .login-bg::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255,107,91,0.15) 0%, transparent 70%);
    top: -200px; right: -200px;
    border-radius: 50%;
    animation: pulse 4s ease-in-out infinite;
  }
  .login-bg::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%);
    bottom: -100px; left: -100px;
    border-radius: 50%;
    animation: pulse 4s ease-in-out infinite reverse;
  }
  @keyframes pulse {
    0%,100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.1); opacity: 1; }
  }

  .login-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    width: 420px;
    overflow: hidden;
    box-shadow: var(--shadow), 0 0 0 1px rgba(255,107,91,0.1);
    position: relative;
    z-index: 1;
    animation: slideUp 0.5s ease;
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .login-header {
    background: linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%);
    padding: 40px 36px;
    text-align: center;
    position: relative;
  }
  .login-header h1 {
    font-family: 'Syne', sans-serif;
    font-size: 2.4rem;
    font-weight: 800;
    color: white;
    letter-spacing: -1px;
  }
  .login-header p {
    color: rgba(255,255,255,0.85);
    margin-top: 6px;
    font-size: 0.95rem;
    font-weight: 300;
  }

  .login-body { padding: 36px; }

  .tab-switch {
    display: flex;
    background: var(--dark2);
    border-radius: 50px;
    padding: 4px;
    margin-bottom: 28px;
    gap: 2px;
  }
  .tab-btn {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 50px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    background: transparent;
    color: var(--text-muted);
  }
  .tab-btn.active {
    background: var(--coral);
    color: white;
    box-shadow: 0 4px 12px rgba(255,107,91,0.4);
  }

  .login-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 20px;
    text-align: center;
  }

  .form-group { margin-bottom: 16px; }
  .form-input {
    width: 100%;
    padding: 14px 16px;
    background: var(--dark2);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    transition: border-color 0.2s;
    outline: none;
  }
  .form-input::placeholder { color: var(--text-muted); }
  .form-input:focus { border-color: var(--coral); box-shadow: 0 0 0 3px rgba(255,107,91,0.15); }
  .input-wrap { position: relative; }
  .eye-btn {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--text-muted); font-size: 1.1rem;
  }

  .btn-primary {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%);
    color: white;
    border: none;
    border-radius: 50px;
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    margin-top: 8px;
    transition: all 0.25s;
    box-shadow: 0 6px 20px rgba(255,107,91,0.35);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,91,0.45); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .forgot-link {
    text-align: center;
    margin-top: 16px;
    color: var(--text-muted);
    font-size: 0.88rem;
    cursor: pointer;
    transition: color 0.2s;
  }
  .forgot-link:hover { color: var(--coral); }

  .error-msg {
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.4);
    color: #FCA5A5;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 0.88rem;
    margin-bottom: 16px;
    text-align: center;
  }

  .success-msg {
    background: rgba(34,197,94,0.15);
    border: 1px solid rgba(34,197,94,0.4);
    color: #86efac;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 0.88rem;
    margin-bottom: 16px;
    text-align: center;
    animation: fadeIn 0.3s ease;
  }

  /* ── STEP INDICATOR (Forgot Password) ── */
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin: 8px 0 0;
  }
  .step-dot {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--dark3);
    border: 2px solid var(--border);
    color: var(--text-muted);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 700;
    transition: all 0.3s ease;
    z-index: 1;
  }
  .step-dot.done {
    background: var(--coral);
    border-color: var(--coral);
    color: white;
    box-shadow: 0 0 12px rgba(255,107,91,0.4);
  }
  .step-line {
    flex: 1; max-width: 80px; height: 2px;
    background: var(--border);
    transition: background 0.3s ease;
  }
  .step-line.done { background: var(--coral); }
  .step-labels {
    display: flex;
    justify-content: space-between;
    padding: 6px 4px 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ── MENU PAGE ── */
  .menu-page { min-height: 100vh; background: var(--dark); }

  .nav {
    background: var(--dark2);
    border-bottom: 1px solid var(--border);
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(20px);
  }
  .nav-logo {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--coral);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nav-right { display: flex; align-items: center; gap: 12px; }

  .cart-btn {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 8px 14px;
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .cart-btn:hover { border-color: var(--coral); color: var(--coral); }
  .cart-badge {
    position: absolute;
    top: -6px; right: -6px;
    background: var(--coral);
    color: white;
    border-radius: 50%;
    width: 20px; height: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-btn {
    padding: 8px 18px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .nav-btn:hover { border-color: var(--coral); color: var(--coral); }
  .nav-btn.logout { color: var(--coral); border-color: rgba(255,107,91,0.3); }
  .nav-btn.logout:hover { background: rgba(255,107,91,0.1); }

  .menu-hero {
    padding: 48px 24px 24px;
    max-width: 1100px;
    margin: 0 auto;
  }
  .menu-hero h2 {
    font-family: 'Syne', sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 6px;
  }
  .menu-hero h2 span { color: var(--coral); }
  .menu-hero p { color: var(--text-muted); margin-bottom: 28px; }

  .category-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 32px;
  }
  .cat-tab {
    padding: 8px 22px;
    border-radius: 50px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .cat-tab:hover { border-color: var(--teal); color: var(--teal); }
  .cat-tab.active { background: var(--teal); border-color: var(--teal); color: var(--dark); font-weight: 700; }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px 48px;
  }

  .menu-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    overflow: hidden;
    transition: all 0.3s ease;
    animation: fadeIn 0.4s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .menu-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.35); border-color: rgba(255,255,255,0.15); }
  .menu-card.sold-out { opacity: 0.65; }

  .card-img {
    height: 160px;
    background: var(--dark3);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .menu-card:hover .card-img img { transform: scale(1.06); }
  .sold-badge {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.7);
  }

  .card-body { padding: 16px; }
  .card-name {
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .card-category {
    font-size: 0.78rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-price {
    font-family: 'Syne', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--teal);
  }

  .add-btn {
    padding: 7px 16px;
    border-radius: 8px;
    border: none;
    background: var(--coral);
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .add-btn:hover { background: var(--coral-light); transform: scale(1.05); }
  .add-btn:disabled {
    background: var(--dark3);
    color: var(--text-muted);
    cursor: not-allowed;
    transform: none;
  }

  .qty-ctrl {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--dark2);
    border-radius: 8px;
    padding: 4px;
  }
  .qty-btn {
    width: 26px; height: 26px;
    border-radius: 6px;
    border: none;
    background: var(--coral);
    color: white;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  .qty-btn:hover { background: var(--coral-dark); }
  .qty-num {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    min-width: 18px;
    text-align: center;
  }

  /* CART DRAWER */
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 200;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }
  .cart-drawer {
    position: fixed;
    top: 0; right: 0;
    height: 100%;
    width: 380px;
    background: var(--dark2);
    border-left: 1px solid var(--border);
    z-index: 201;
    display: flex;
    flex-direction: column;
    animation: slideRight 0.3s ease;
  }
  @keyframes slideRight {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }
  .drawer-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .drawer-header h3 {
    font-family: 'Syne', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
  }
  .close-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    padding: 6px 10px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }
  .close-btn:hover { color: var(--coral); border-color: var(--coral); }

  .drawer-items { flex: 1; overflow-y: auto; padding: 16px 24px; }
  .drawer-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  .drawer-item-emoji {
    width: 52px; height: 52px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--dark3);
  }
  .drawer-item-emoji img {
    width: 100%; height: 100%;
    object-fit: cover;
  }
  .drawer-item-info { flex: 1; }
  .drawer-item-name { font-weight: 600; font-size: 0.9rem; }
  .drawer-item-price { color: var(--teal); font-size: 0.85rem; margin-top: 2px; }
  .drawer-item-qty {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface);
    border-radius: 8px;
    padding: 4px 8px;
  }
  .remove-btn {
    background: none; border: none;
    color: var(--text-muted); cursor: pointer;
    font-size: 0.8rem;
    transition: color 0.2s;
    width: 20px; height: 20px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px;
  }
  .remove-btn:hover { color: var(--red); background: rgba(239,68,68,0.1); }

  .empty-cart { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .empty-cart-icon { font-size: 3rem; margin-bottom: 12px; }

  .drawer-footer {
    padding: 20px 24px;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .total-label { color: var(--text-muted); font-size: 0.9rem; }
  .total-amount {
    font-family: 'Syne', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--teal);
  }
  .btn-checkout {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%);
    color: var(--dark);
    border: none;
    border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
  }
  .btn-checkout:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(45,212,191,0.35); }

  /* ORDERS PAGE */
  .orders-section {
    max-width: 700px;
    margin: 0 auto;
    padding: 40px 24px;
  }
  .orders-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.8rem;
    font-weight: 800;
    margin-bottom: 24px;
  }
  .order-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
  }
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  .order-id {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: var(--teal);
  }
  .order-time { color: var(--text-muted); font-size: 0.8rem; margin-top: 2px; }
  .order-status {
    padding: 4px 12px;
    border-radius: 50px;
    font-size: 0.78rem;
    font-weight: 600;
  }
  .status-preparing { background: rgba(245,158,11,0.2); color: var(--yellow); }
  .status-ready { background: rgba(34,197,94,0.2); color: var(--green); }
  .status-completed { background: rgba(139,163,193,0.15); color: var(--text-muted); }
  .status-cancelled { background: rgba(239,68,68,0.15); color: var(--red); }
  .order-items { margin-bottom: 12px; font-size: 0.88rem; color: var(--text-muted); }
  .order-total {
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
    text-align: right;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }

  /* ── ADMIN PAGE ── */
  .admin-layout { display: flex; min-height: 100vh; }

  .sidebar {
    width: 260px;
    min-width: 260px;
    background: var(--dark2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0;
    height: 100vh;
    z-index: 50;
  }
  .sidebar-logo {
    padding: 24px 24px 20px;
    border-bottom: 1px solid var(--border);
    font-family: 'Syne', sans-serif;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--teal);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sidebar-nav { flex: 1; padding: 16px 12px; }
  .side-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 12px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-muted);
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }
  .side-link:hover { background: var(--surface); color: var(--text); }
  .side-link.active { background: var(--surface); color: var(--teal); font-weight: 600; border-right: 3px solid var(--teal); }
  .side-link-icon { font-size: 1.1rem; }

  .sidebar-footer { padding: 16px; border-top: 1px solid var(--border); }
  .logout-side {
    width: 100%;
    padding: 11px;
    border-radius: 12px;
    border: 1px solid rgba(255,107,91,0.3);
    background: transparent;
    color: var(--coral);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .logout-side:hover { background: rgba(255,107,91,0.1); }

  .admin-main { margin-left: 260px; flex: 1; padding: 32px; min-height: 100vh; }

  .page-title {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 28px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: rgba(255,255,255,0.15); }
  .stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .stat-label { color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-card.teal .stat-value { color: var(--teal); }
  .stat-card.coral .stat-value { color: var(--coral); }
  .stat-card.green .stat-value { color: var(--green); }
  .stat-card.yellow .stat-value { color: var(--yellow); }

  /* Live Orders */
  .orders-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  .live-order-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px;
    transition: all 0.2s;
  }
  .live-order-card.new { border-color: rgba(245,158,11,0.4); animation: glow 2s ease-in-out infinite; }
  @keyframes glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
    50% { box-shadow: 0 0 0 4px rgba(245,158,11,0.15); }
  }
  .live-order-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
  .live-order-id { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--teal); }
  .live-order-student { color: var(--text-muted); font-size: 0.8rem; margin-top: 2px; }
  .live-order-items { margin: 10px 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.7; }
  .live-order-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid var(--border); }
  .live-order-total { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--text); }
  .status-btns { display: flex; gap: 6px; }
  .status-btn {
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
  }
  .status-btn.preparing { border-color: var(--yellow); color: var(--yellow); }
  .status-btn.preparing:hover { background: rgba(245,158,11,0.15); }
  .status-btn.ready { border-color: var(--green); color: var(--green); }
  .status-btn.ready:hover { background: rgba(34,197,94,0.15); }
  .status-btn.completed { border-color: var(--text-muted); color: var(--text-muted); }
  .status-btn.completed:hover { background: rgba(139,163,193,0.1); }

  /* Menu Management */
  .add-item-form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 28px;
  }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 140px 160px auto;
    gap: 12px;
    align-items: end;
  }
  .form-label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .admin-input {
    width: 100%;
    padding: 11px 14px;
    background: var(--dark2);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .admin-input:focus { border-color: var(--teal); }
  .admin-select {
    width: 100%;
    padding: 11px 14px;
    background: var(--dark2);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .admin-select:focus { border-color: var(--teal); }
  .btn-add {
    padding: 11px 20px;
    background: var(--teal);
    color: var(--dark);
    border: none;
    border-radius: 10px;
    font-family: 'Syne', sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .btn-add:hover { background: var(--teal-dark); transform: translateY(-1px); }

  .menu-table {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  }
  .table-head {
    background: var(--dark3);
    display: grid;
    grid-template-columns: 55px 1fr 90px 110px 160px 110px;
    padding: 12px 20px;
    gap: 12px;
  }
  .th {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
  }
  .table-row {
    display: grid;
    grid-template-columns: 55px 1fr 90px 110px 160px 110px;
    padding: 14px 20px;
    gap: 12px;
    align-items: center;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  .table-row:last-child { border-bottom: none; }
  .table-row:hover { background: rgba(255,255,255,0.02); }
  .td { font-size: 0.9rem; }
  .td.id { color: var(--text-muted); font-family: monospace; }
  .td.price { font-family: 'Syne', sans-serif; font-weight: 600; color: var(--teal); }
  .td.cat { color: var(--text-muted); font-size: 0.82rem; }

  .qty-control {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .qty-control-btn {
    width: 28px; height: 28px;
    border-radius: 7px;
    border: 1.5px solid var(--border);
    background: var(--dark2);
    color: var(--text);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
    line-height: 1;
  }
  .qty-control-btn:hover:not(:disabled) { border-color: var(--teal); color: var(--teal); background: rgba(45,212,191,0.08); }
  .qty-control-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .qty-control-btn.plus:hover:not(:disabled) { border-color: var(--green); color: var(--green); background: rgba(34,197,94,0.08); }
  .qty-display {
    min-width: 38px;
    text-align: center;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    padding: 4px 6px;
    background: var(--dark2);
    border-radius: 6px;
    border: 1px solid var(--border);
  }
  .qty-display.zero { color: var(--red); border-color: rgba(239,68,68,0.3); }
  .qty-display.low { color: var(--yellow); border-color: rgba(245,158,11,0.3); }
  .qty-display.ok { color: var(--green); border-color: rgba(34,197,94,0.3); }
  .sold-out-pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 50px;
    background: rgba(139,163,193,0.12);
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 6px;
  }

  /* Payment badge */
  .pay-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .pay-badge.paid { background: rgba(34,197,94,0.15); color: var(--green); border: 1px solid rgba(34,197,94,0.3); }
  .pay-badge.pending { background: rgba(245,158,11,0.15); color: var(--yellow); border: 1px solid rgba(245,158,11,0.3); }
  .pay-toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.7rem;
    color: var(--text-muted);
    padding: 2px 5px;
    border-radius: 4px;
    transition: color 0.2s, background 0.2s;
    margin-left: 2px;
  }
  .pay-toggle-btn:hover { color: var(--text); background: rgba(255,255,255,0.07); }

  .delete-btn {
    padding: 5px 14px;
    border-radius: 8px;
    border: 1px solid rgba(239,68,68,0.4);
    background: transparent;
    color: var(--red);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .delete-btn:hover { background: rgba(239,68,68,0.12); border-color: var(--red); }

  /* Toast */
  .toast {
    position: fixed;
    bottom: 24px; right: 24px;
    background: var(--dark3);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 20px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 999;
    animation: toastIn 0.3s ease;
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .toast.success { border-color: rgba(34,197,94,0.5); }
  .toast.error { border-color: rgba(239,68,68,0.5); }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .no-orders {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-muted);
    font-size: 1rem;
  }
  .no-orders-icon { font-size: 3rem; margin-bottom: 12px; }

  @media (max-width: 768px) {
    .form-row { grid-template-columns: 1fr; }
    .table-head, .table-row { grid-template-columns: 40px 1fr 80px 1fr; }
    .th:nth-child(4), .td:nth-child(4),
    .th:nth-child(5), .td:nth-child(5) { display: none; }
    .sidebar { width: 60px; }
    .sidebar-logo span:last-child { display: none; }
    .side-link span:last-child { display: none; }
    .admin-main { margin-left: 60px; }
    .cart-drawer { width: 100%; }
  }
`;

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Toast({ message, type = "success" }) {
  const icon = type === "success" ? "✅" : "❌";
  return (
    <div className={`toast ${type}`}>
      <span>{icon}</span>
      {message}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };
  return [toast, show];
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("user"); // "user" | "admin" | "register" | "forgot"
  const [form, setForm] = useState({ id: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [forgotForm, setForgotForm] = useState({ studentId: "", email: "", newPassword: "", confirm: "" });
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter ID, 2 = enter new password
  const [showPw, setShowPw] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredStudentId, setRegisteredStudentId] = useState(""); // set after successful registration

  const switchTab = (t) => {
    setTab(t);
    setError("");
    setSuccess("");
    setRegisteredStudentId(""); // clear success card when switching tabs
    setForgotStep(1);
    setForgotForm({ studentId: "", email: "", newPassword: "", confirm: "" });
  };

  // ── LOGIN ──
  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.id || !form.password) { setError("Please enter Student ID and Password"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: form.id.trim().toUpperCase(), password: form.password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }
      if (tab === "admin" && data.user.role !== "admin") { setError("Invalid admin credentials."); return; }
      if (tab === "user" && data.user.role === "admin") { setError("Please use the Admin tab to log in."); return; }
      const userRole = data.user.role === "admin" ? "admin" : "user";
      onLogin({ id: data.user.studentId, name: data.user.name, ...data.user, role: userRole });
    } catch (err) {
      setError("Server not reachable. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError(""); setSuccess("");
    if (!regForm.name || !regForm.email || !regForm.password || !regForm.confirm) {
      setError("All fields are required"); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regForm.email)) { setError("Please enter a valid college email"); return; }
    if (regForm.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (regForm.password !== regForm.confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regForm.name.trim(),
          email: regForm.email.trim().toLowerCase(),
          password: regForm.password
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      setRegForm({ name: "", email: "", password: "", confirm: "" });
      // Show a persistent ID card instead of a toast that auto-dismisses
      setRegisteredStudentId(data.user.studentId);
    } catch (err) {
      setError("Server not reachable. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep1 = async () => {
    setError(""); setSuccess("");
    if (!forgotForm.studentId.trim()) { setError("Please enter your Student ID"); return; }
    if (!forgotForm.email.trim()) { setError("Please enter your registered email"); return; }
    setLoading(true);
    try {
      // Use the dedicated verify-identity endpoint — checks both studentId AND email
      const res = await fetch("/api/auth/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: forgotForm.studentId.trim().toUpperCase(),
          email: forgotForm.email.trim().toLowerCase()
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed"); return; }
      setForgotStep(2);
    } catch (err) {
      setError("Server not reachable. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async () => {
    setError(""); setSuccess("");
    if (!forgotForm.newPassword) { setError("Please enter a new password"); return; }
    if (forgotForm.newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (forgotForm.newPassword !== forgotForm.confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Re-send studentId + email so server re-verifies identity before saving new password
        body: JSON.stringify({
          studentId: forgotForm.studentId.trim(),
          email: forgotForm.email.trim().toLowerCase(),
          newPassword: forgotForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }
      setForgotForm({ studentId: "", email: "", newPassword: "", confirm: "" });
      setForgotStep(1);
      setSuccess("✅ Password reset! You can now sign in.");
      setTimeout(() => switchTab("user"), 2000);
    } catch (err) {
      setError("Server not reachable. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-header">
          <h1>Q-Less 🍔</h1>
          <p>Reserve your meals and skip the queue.</p>
        </div>
        <div className="login-body">
          {/* ── TABS ── */}
          <div className="tab-switch">
            <button className={`tab-btn ${tab === "user" ? "active" : ""}`} onClick={() => switchTab("user")}>Student</button>
            <button className={`tab-btn ${tab === "admin" ? "active" : ""}`} onClick={() => switchTab("admin")}>Admin</button>
          </div>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          {/* ── STUDENT / ADMIN LOGIN ── */}
          {(tab === "user" || tab === "admin") && (
            <>
              <div className="login-title">{tab === "user" ? "Student Login" : "Admin Login"}</div>
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder={tab === "user" ? "Student ID (e.g. STU001)" : "Username"}
                  value={form.id}
                  onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>
              <div className="form-group">
                <div className="input-wrap">
                  <input
                    className="form-input"
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                  <button className="eye-btn" onClick={() => setShowPw(x => !x)}>{showPw ? "🙈" : "👁"}</button>
                </div>
              </div>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Signing in…" : "SIGN IN"}
              </button>
              {tab === "user" && (
                <>
                  <div className="forgot-link" onClick={() => switchTab("forgot")} style={{marginTop:"14px"}}>
                    🔑 Forgot your password? <span style={{color:"var(--coral)"}}>Reset it</span>
                  </div>
                  <div className="forgot-link" onClick={() => switchTab("register")}>
                    Don't have an account? <span style={{color:"var(--coral)"}}>Register here</span>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── REGISTER ── */}
          {tab === "register" && (
            <>
              {registeredStudentId ? (
                /* ── SUCCESS CARD: shown after registration ── */
                <div style={{
                  textAlign: "center",
                  padding: "8px 0",
                  animation: "fadeIn 0.4s ease"
                }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🎉</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text)", marginBottom: "4px" }}>
                    Account Created!
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                    Save your Student ID — you'll need it to sign in.
                  </div>

                  {/* ID box */}
                  <div style={{
                    background: "rgba(var(--coral-rgb, 255,100,80), 0.1)",
                    border: "2px dashed var(--coral)",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    marginBottom: "16px"
                  }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Your Student ID</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--coral)", letterSpacing: "0.08em" }}>
                      {registeredStudentId}
                    </div>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(registeredStudentId)
                        .then(() => setSuccess("✅ Student ID copied to clipboard!"))
                        .catch(() => setSuccess(`Your ID: ${registeredStudentId}`));
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      borderRadius: "8px",
                      padding: "8px 20px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      marginBottom: "12px",
                      width: "100%"
                    }}
                  >
                    📋 Copy ID to Clipboard
                  </button>
                  {success && <div className="success-msg" style={{ marginBottom: "12px" }}>{success}</div>}

                  {/* Go to login */}
                  <button
                    className="btn-primary"
                    onClick={() => switchTab("user")}
                  >
                    Go to Sign In →
                  </button>
                </div>
              ) : (
                /* ── REGISTRATION FORM ── */
                <>
                  <div className="login-title">Create Account</div>
                  <div className="form-group">
                    <input
                      className="form-input"
                      placeholder="Full Name"
                      value={regForm.name}
                      onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="form-input"
                      type="email"
                      placeholder="College Email (e.g. john@college.edu)"
                      value={regForm.email}
                      onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <div className="input-wrap">
                      <input
                        className="form-input"
                        type={showRegPw ? "text" : "password"}
                        placeholder="Password (min 6 chars)"
                        value={regForm.password}
                        onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                      />
                      <button className="eye-btn" onClick={() => setShowRegPw(x => !x)}>{showRegPw ? "🙈" : "👁"}</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Confirm Password"
                      value={regForm.confirm}
                      onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleRegister()}
                    />
                  </div>
                  <button className="btn-primary" onClick={handleRegister} disabled={loading}>
                    {loading ? "Creating account…" : "CREATE ACCOUNT"}
                  </button>
                  <div className="forgot-link" onClick={() => switchTab("user")}>
                    Already have an account? <span style={{color:"var(--coral)"}}>Sign in</span>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {tab === "forgot" && (
            <>
              <div className="login-title">Reset Password</div>

              {/* Step indicator */}
              <div className="step-indicator">
                <div className={`step-dot ${forgotStep >= 1 ? "done" : ""}`}>1</div>
                <div className={`step-line ${forgotStep >= 2 ? "done" : ""}`} />
                <div className={`step-dot ${forgotStep >= 2 ? "done" : ""}`}>2</div>
              </div>
              <div className="step-labels">
                <span style={{color: forgotStep === 1 ? "var(--coral)" : "var(--text-muted)"}}>Verify Identity</span>
                <span style={{color: forgotStep === 2 ? "var(--coral)" : "var(--text-muted)"}}>New Password</span>
              </div>

              {/* Step 1 — enter Student ID + email */}
              {forgotStep === 1 && (
                <>
                  <div className="form-group" style={{marginTop:"20px"}}>
                    <input
                      className="form-input"
                      placeholder="Student ID (e.g. STU847362)"
                      value={forgotForm.studentId}
                      onChange={e => setForgotForm(f => ({ ...f, studentId: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="form-input"
                      type="email"
                      placeholder="Registered Email"
                      value={forgotForm.email}
                      onChange={e => setForgotForm(f => ({ ...f, email: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleForgotStep1()}
                    />
                  </div>
                  <button className="btn-primary" onClick={handleForgotStep1} disabled={loading}>
                    {loading ? "Verifying…" : "VERIFY IDENTITY →"}
                  </button>
                </>
              )}

              {/* Step 2 — set new password */}
              {forgotStep === 2 && (
                <>
                  <p style={{textAlign:"center", color:"var(--text-muted)", fontSize:"0.85rem", margin:"16px 0 12px"}}>
                    Setting new password for <strong style={{color:"var(--teal)"}}>{forgotForm.studentId.toUpperCase()}</strong>
                    {" "}&middot;{" "}
                    <span style={{color:"var(--text-muted)"}}>{forgotForm.email.toLowerCase()}</span>
                  </p>
                  <div className="form-group">
                    <div className="input-wrap">
                      <input
                        className="form-input"
                        type={showForgotPw ? "text" : "password"}
                        placeholder="New Password (min 6 chars)"
                        value={forgotForm.newPassword}
                        onChange={e => setForgotForm(f => ({ ...f, newPassword: e.target.value }))}
                      />
                      <button className="eye-btn" onClick={() => setShowForgotPw(x => !x)}>{showForgotPw ? "🙈" : "👁"}</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <input
                      className="form-input"
                      type="password"
                      placeholder="Confirm New Password"
                      value={forgotForm.confirm}
                      onChange={e => setForgotForm(f => ({ ...f, confirm: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleForgotReset()}
                    />
                  </div>
                  <button className="btn-primary" onClick={handleForgotReset} disabled={loading}>
                    {loading ? "Resetting…" : "RESET PASSWORD"}
                  </button>
                  <div className="forgot-link" onClick={() => { setForgotStep(1); setError(""); }}>
                    ← Use different details
                  </div>
                </>
              )}

              <div className="forgot-link" onClick={() => switchTab("user")}>
                Back to <span style={{color:"var(--coral)"}}>Sign In</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── MENU PAGE ─────────────────────────────────────────────────────────────────
function MenuPage({ user, menu, onLogout, onPlaceOrder, onCancelOrder, liveOrders, setLiveOrders, formatOrderNumber }) {
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState("menu"); // "menu" | "account"
  const [toast, showToast] = useToast();
  const [cancellingId, setCancellingId] = useState(null);

  // Keeps IDs of orders that the student cancelled (or is cancelling).
  // Using both a ref (for the polling guard) and a state Set (so the button
  // can't reappear even if the poll overwrites liveOrders before the server
  // confirms the new status).
  const pendingCancels = useRef(new Set());
  const [cancelledOrderIds, setCancelledOrderIds] = useState(() => new Set());

  // Poll orders every 5 seconds. Merge pendingCancels to prevent flicker.
  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const res = await axios.get("/api/orders");
        setLiveOrders(
          res.data.map(o => {
            const id = o._id || o.id;
            // If this order is pending cancel and server hasn't confirmed yet,
            // keep it as cancelled so the UI doesn't flicker back.
            if (pendingCancels.current.has(id) && o.status !== "cancelled") {
              return { ...o, status: "cancelled" };
            }
            // Once server confirms, clean up the pending set
            if (pendingCancels.current.has(id) && o.status === "cancelled") {
              pendingCancels.current.delete(id);
            }
            return o;
          })
        );
      } catch (err) {
        console.error("Failed to poll orders", err);
      }
    };
    poll();
    const intervalId = setInterval(poll, 5000);
    return () => clearInterval(intervalId);
  }, [user, setLiveOrders]);

  // Filter orders belonging to this student, sorted newest first.
  // The server returns orders in ascending orderNumber order, but we always
  // want the most recent order at the top so it doesn't jump around after
  // the poll overwrites the optimistic prepend.
  const orders = liveOrders
    .filter(o => o.studentId === user.id)
    .slice() // avoid mutating the original array
    .sort((a, b) => {
      if (a.orderNumber != null && b.orderNumber != null) {
        return b.orderNumber - a.orderNumber; // newest (highest) first
      }
      // Fallback: MongoDB _id is time-based, lexicographic desc = newest first
      if (a._id && b._id) return b._id > a._id ? 1 : -1;
      return 0;
    });

  const categories = ["All", "Breakfast", "Lunch", "Snacks", "Drinks"];
  const filtered = menu.filter(i => category === "All" || i.category === category);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, quantity]) => {
    const item = menu.find(m => m.id === parseInt(id));
    return sum + (item ? item.price * quantity : 0);
  }, 0);

  const addItem = (id) => {
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    showToast("Added to cart!");
  };
  const removeItem = (id) => {
    setCart(c => {
      const n = { ...c };
      if (n[id] > 1) n[id]--;
      else delete n[id];
      return n;
    });
  };

  const checkout = async () => {
    if (cartCount === 0) return;

    const items = Object.entries(cart).map(([id, quantity]) => {
      const item = menu.find(m => m.id === parseInt(id));

      // CHECK STOCK
      if (quantity > item.quantity) {
        showToast(`${item.name} only has ${item.quantity} left`, "error");
        throw new Error("Insufficient stock");
      }

      return { ...item, quantity };
    });
    const order = {
      studentId: user.id,
      studentName: user.name,
      items,
      total: cartTotal,
      status: "preparing",
      paid: false,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    try {
      await onPlaceOrder(order);
      setCart({});
      setCartOpen(false);
      showToast("Order placed successfully! 🎉");
    } catch (err) {
      showToast("Failed to place order. Please try again.", "error");
    }
  };

  return (
    <div className="menu-page">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <nav className="nav">
        <div className="nav-logo">Q-Less <span>🍔</span></div>
        <div className="nav-right">
          <button className="nav-btn" onClick={() => setView(v => v === "menu" ? "account" : "menu")}>
            {view === "menu" ? "👤 My Account" : "🍽 Menu"}
          </button>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="nav-btn logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      {view === "menu" ? (
        <>
          <div className="menu-hero">
            <h2>Today's <span>Menu</span></h2>
            <p>Fresh food, ready fast — order ahead and skip the queue.</p>
            <div className="category-tabs">
              {categories.map(c => (
                <button key={c} className={`cat-tab ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="menu-grid">
            {filtered.map(item => {
              const qty = getQty(item);
              const soldOut = qty === 0;
              return (
                <div key={item.id} className={`menu-card ${soldOut ? "sold-out" : ""}`}>
                  <div className="card-img">
                    <img src={item.image} alt={item.name} onError={e => { e.target.style.display = 'none'; }} />
                    {soldOut && <div className="sold-badge">SOLD OUT</div>}
                  </div>
                  <div className="card-body">
                    <div className="card-name">{item.name}</div>
                    <div className="card-category">{item.category}</div>
                    {qty > 0 && <div className="card-qty">Qty: {qty}</div>}
                    <div className="card-footer">
                      <span className="card-price">₹{item.price}</span>
                      {!soldOut ? (
                        cart[item.id] ? (
                          <div className="qty-ctrl">
                            <button className="qty-btn" onClick={() => removeItem(item.id)}>−</button>
                            <span className="qty-num">{cart[item.id]}</span>
                            <button className="qty-btn" onClick={() => addItem(item.id)}>+</button>
                          </div>
                        ) : (
                          <button className="add-btn" onClick={() => addItem(item.id)}>Add +</button>
                        )
                      ) : (
                        <button className="add-btn" disabled>Sold Out</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="orders-section">
          {/* PROFILE CARD */}
          <div className="profile-card" style={{ padding: "24px", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", marginBottom: "32px", display: "flex", alignItems: "center", gap: "24px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, var(--coral), #ff8a65)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", flexShrink: 0, boxShadow: "0 4px 12px rgba(255, 107, 107, 0.4)" }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <h2 style={{ margin: "0 0 6px 0", color: "var(--text)", fontSize: "1.5rem" }}>{user?.name || "Student"}</h2>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                <span><strong>ID:</strong> {user?.id}</span>
                {user?.email && <span><strong>Email:</strong> {user.email}</span>}
              </div>
            </div>
          </div>

          <div className="orders-title">Order History</div>
          {orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📋</div>
              You haven't placed any orders yet.
            </div>
          ) : orders.map(o => {
            // Use cancelledOrderIds as the source of truth for status while the
            // cancel is in-flight or confirmed. This prevents any poll-generated
            // 'preparing' data from briefly showing the wrong badge.
            const effectiveStatus = cancelledOrderIds.has(o._id || o.id)
              ? "cancelled"
              : o.status;
            return (
            <div key={o._id || o.orderNumber} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-id">{formatOrderNumber(o)}</div>
                  <div className="order-time">{o.time}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <div className={`order-status status-${effectiveStatus}`}>
                    {effectiveStatus === "preparing" ? "⏳ Preparing"
                      : effectiveStatus === "ready" ? "✅ Ready"
                      : effectiveStatus === "cancelled" ? "❌ Cancelled"
                      : "✔ Completed"}
                  </div>
                  <span className={`pay-badge ${o.paid ? "paid" : "pending"}`}>
                    {o.paid ? "✔ Payment Done" : "⏳ Payment Pending"}
                  </span>
                  {/* Show cancel button only when truly still preparing */}
                  {effectiveStatus === "preparing" && (
                    <button 
                      className="delete-btn" 
                      disabled={cancellingId === (o._id || o.id)}
                      onClick={async () => {
                        const oid = o._id || o.id;
                        pendingCancels.current.add(oid);
                        setCancelledOrderIds(prev => new Set([...prev, oid]));
                        setCancellingId(oid);
                        try {
                          await onCancelOrder(oid);
                          showToast("Order cancelled successfully.");
                        } catch(err) {
                          pendingCancels.current.delete(oid);
                          setCancelledOrderIds(prev => {
                            const next = new Set(prev);
                            next.delete(oid);
                            return next;
                          });
                          showToast(err?.response?.data?.error || "Failed to cancel order.", "error");
                        } finally {
                          setCancellingId(null);
                        }
                      }}
                      style={{ 
                        marginTop: "4px", padding: "4px 8px", fontSize: "0.8rem", 
                        background: cancellingId === (o._id || o.id) ? "rgba(239,68,68,0.05)" : "rgba(239, 68, 68, 0.1)", 
                        color: "var(--red)", 
                        border: "1px solid var(--red)", borderRadius: "4px", 
                        cursor: cancellingId === (o._id || o.id) ? "not-allowed" : "pointer",
                        opacity: cancellingId === (o._id || o.id) ? 0.55 : 1,
                        transition: "opacity 0.2s"
                      }}
                    >
                      {cancellingId === (o._id || o.id) ? "Cancelling…" : "Cancel Order"}
                    </button>
                  )}
                </div>
              </div>
              <div className="order-items">
                {o.items.map(i => `${i.name} × ${i.qty ?? i.quantity ?? 1}`).join("  •  ")}
              </div>
              <div className="order-total">₹{o.total}</div>
            </div>
          );
          })}
        </div>
      )}

      {cartOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="drawer-header">
              <h3>🛒 Your Cart</h3>
              <button className="close-btn" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div className="drawer-items">
              {cartCount === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  Your cart is empty.<br />Add items from the menu!
                </div>
              ) : Object.entries(cart).map(([id, quantity]) => {
                const item = menu.find(m => m.id === parseInt(id));
                if (!item) return null;
                return (
                  <div key={id} className="drawer-item">
                    <div className="drawer-item-emoji">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="drawer-item-info">
                      <div className="drawer-item-name">{item.name}</div>
                      <div className="drawer-item-price">₹{item.price} × {quantity} = ₹{item.price * quantity}</div>
                    </div>
                    <div className="drawer-item-qty">
                      <button className="remove-btn" onClick={() => removeItem(item.id)}>−</button>
                      <span className="qty-num">{quantity}</span>
                      <button className="remove-btn" onClick={() => addItem(item.id)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {cartCount > 0 && (
              <div className="drawer-footer">
                <div className="total-row">
                  <span className="total-label">Total Amount</span>
                  <span className="total-amount">₹{cartTotal}</span>
                </div>
                <button className="btn-checkout" onClick={checkout}>Place Order →</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── ADMIN PAGE ────────────────────────────────────────────────────────────────
function AdminPage({ onLogout, menu, setMenu, liveOrders, setLiveOrders, formatOrderNumber }) {
  const [section, setSection] = useState("orders");
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Breakfast", quantity: 10 });
  const [toast, showToast] = useToast();

  const safeLiveOrders = Array.isArray(liveOrders) ? liveOrders : [];
  const activeOrders = safeLiveOrders.filter(o => o.status !== "completed" && o.status !== "cancelled");
  const totalRevenue = safeLiveOrders.reduce((s, o) => s + (o.total || 0), 0);
  const inStockCount = Array.isArray(menu) ? menu.filter(m => getQty(m) > 0).length : 0;

  // Poll orders so admin sees new orders placed by users in other sessions
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("/api/orders");
        setLiveOrders(res.data);
      } catch (err) {
        console.error("Failed to fetch orders for admin", err);
      }
    };

    fetchOrders();
    const intervalId = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalId);
  }, [setLiveOrders]);

  const updateTimeouts = useRef({});

  const updateQty = (id, delta) => {
    const current = menu.find(i => i.id === id);
    if (!current) return;

    const newQty = Math.max(0, Number(current.quantity || 0) + delta);

    // Update UI purely
    setMenu(m => m.map(i => i.id === id ? { ...i, quantity: newQty, inStock: newQty > 0 } : i));

    // Side effect (debounce sync to server) MUST NOT be inside setMenu()
    if (updateTimeouts.current[id]) {
      clearTimeout(updateTimeouts.current[id]);
    }
    
    updateTimeouts.current[id] = setTimeout(async () => {
      try {
        await axios.put(`/api/menu/${id}`, { quantity: newQty });
      } catch (err) {
        console.error(err);
        showToast(`Failed to save quantity for ${current.name}`, "error");
      }
    }, 300);
  };
  const deleteItem = (id) => {
    const idNum = Number(id);
    setMenu(m => m.filter(i => Number(i.id) !== idNum));
    showToast("Item removed from menu.");
  };
  const addItem = async () => {
    if (!newItem.name.trim() || !newItem.price) { showToast("Fill in item name and price.", "error"); return; }

    const existingIds = (menu || []).map((i) => Number(i.id)).filter((n) => Number.isFinite(n) && n < 1e9);
    const nextId = (existingIds.length ? Math.max(...existingIds) : 0) + 1;

    const quantity = Math.max(0, parseInt(newItem.quantity, 10) || 0);
    const item = {
      id: nextId,
      name: newItem.name.trim(),
      price: parseInt(newItem.price, 10),
      category: newItem.category,
      inStock: quantity > 0,
      quantity: quantity,
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/640px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
    };

    try {
      const res = await axios.post("/api/menu", item);
      const added = res.data;
      const addedQty = Number(added.quantity ?? added.qty ?? added.stock ?? 0);
      const normalized = { ...added, quantity: addedQty, inStock: addedQty > 0 };
      setMenu(m => [...m, normalized]);
      setNewItem({ name: "", price: "", category: "Breakfast", quantity: 10 });
      showToast("Item added to menu!");
    } catch (err) {
      console.error("Failed to add menu item", err);
      showToast("Failed to add menu item.", "error");
    }
  };
  const updateStatus = async (orderId, status) => {
    try {
      const res = await axios.put(`/api/orders/${orderId}`, { status });

      setLiveOrders(o => (o || []).map(x => (x._id === orderId ? res.data : x)));
    } catch (err) {
      console.error("Failed to update order status", err);
      showToast("Failed to update order status", "error");
    }
  };

  const togglePayment = async (orderId) => {
    const order = (liveOrders || []).find(x => x._id === orderId);
    if (!order) return;

    try {
      const res = await axios.put(`/api/orders/${orderId}`, { paid: !order.paid });
      setLiveOrders(o => (o || []).map(x => (x._id === orderId ? res.data : x)));
      showToast("Payment status updated.");
    } catch (err) {
      console.error("Failed to toggle payment", err);
      showToast("Failed to toggle payment", "error");
    }
  };

  const verifyViaPi = async (order) => {
    try {
      showToast(`Triggering Pi Scanner for Order #${order.orderNumber}...`);
      const res = await axios.post("/api/process_payment", { orderNumber: order.orderNumber });
      
      if (res.data.success) {
         showToast(`OCR Success! Amount verified: ₹${res.data.extracted.amount}`);
         // Update the local order to show it's paid
         setLiveOrders(o => (o || []).map(x => (x._id === order._id ? res.data.order : x)));
      } else {
         showToast(res.data.error || "OCR Verification Failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || "OCR or Camera Error", "error");
    }
  };

  return (
    <div className="admin-layout">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🍔</span>
          <span>Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          <button className={`side-link ${section === "orders" ? "active" : ""}`} onClick={() => setSection("orders")}>
            <span className="side-link-icon">📦</span>
            <span>Live Orders</span>
            {activeOrders.length > 0 && (
              <span style={{ marginLeft: "auto", background: "var(--coral)", color: "white", borderRadius: "50px", padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>
                {activeOrders.length}
              </span>
            )}
          </button>
          <button className={`side-link ${section === "menu" ? "active" : ""}`} onClick={() => setSection("menu")}>
            <span className="side-link-icon">🍽</span>
            <span>Manage Menu</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-side" onClick={onLogout}>↩ Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        {section === "orders" && (
          <>
            <div className="page-title">Incoming Orders</div>
            <div className="stats-row">
              <div className="stat-card coral">
                <div className="stat-value">{activeOrders.length}</div>
                <div className="stat-label">Active Orders</div>
              </div>
              <div className="stat-card teal">
                <div className="stat-value">₹{totalRevenue}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card green">
                <div className="stat-value">{liveOrders.length}</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-card yellow">
                <div className="stat-value">{inStockCount}</div>
                <div className="stat-label">Items In Stock</div>
              </div>
            </div>
            {activeOrders.length === 0 ? (
              <div className="no-orders">
                <div className="no-orders-icon">🎉</div>
                No active orders right now.
              </div>
            ) : (
              <div className="orders-grid">
                {activeOrders.map(order => (
                  <div key={order._id} className={`live-order-card ${order.status === "preparing" ? "new" : ""}`}>
                    <div className="live-order-header">
                      <div>
                        <div className="live-order-id">{formatOrderNumber(order)}</div>
                        <div className="live-order-student">{order.studentName} · {order.studentId}</div>
                      </div>
                      <div className={`order-status status-${order.status}`}>
                        {order.status === "preparing" ? "⏳ Preparing" : "✅ Ready"}
                      </div>
                    </div>
                    <div className="live-order-items">
                      {(order.items || []).map(i => (
                        <div key={i.id || `${order._id}-${i.name}`}>• {i.name} × {i.qty}</div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                      <span className={`pay-badge ${order.paid ? "paid" : "pending"}`}>
                        {order.paid ? "✔ Payment Done" : "⏳ Payment Pending"}
                      </span>
                      <button className="pay-toggle-btn" onClick={() => togglePayment(order._id)} title="Toggle payment status">
                        {order.paid ? "Mark Pending" : "Mark Paid manually"}
                      </button>
                      {!order.paid && (
                        <button 
                          className="status-btn ready" 
                          style={{ marginLeft: "auto", padding: "4px 8px", fontSize: "0.8rem", background: "var(--teal)" }}
                          onClick={() => verifyViaPi(order)}
                        >
                          📷 Verify via Pi
                        </button>
                      )}
                    </div>
                    <div className="live-order-footer">
                      <div className="live-order-total">₹{order.total}</div>
                      <div className="status-btns">
                        {order.status === "preparing" && (
                          <button className="status-btn ready" onClick={() => updateStatus(order._id, "ready")}>Mark Ready</button>
                        )}
                        {order.status === "ready" && (
                          <button className="status-btn completed" onClick={() => updateStatus(order._id, "completed")}>Complete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {section === "menu" && (
          <>
            <div className="page-title">Menu Management</div>
            <div className="add-item-form">
              <div className="form-row">
                <div>
                  <label className="form-label">Item Name</label>
                  <input className="admin-input" placeholder="e.g. Burger" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Price (₹)</label>
                  <input className="admin-input" type="number" placeholder="100" value={newItem.price} onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select className="admin-select" value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}>
                    {["Breakfast", "Lunch", "Snacks", "Drinks"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Quantity</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={newItem.quantity}
                    onChange={e => setNewItem(n => ({ ...n, quantity: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">&nbsp;</label>
                  <button className="btn-add" onClick={addItem}>+ Add Item</button>
                </div>
              </div>
            </div>

            <div className="menu-table">
              <div className="table-head">
                <div className="th">ID</div>
                <div className="th">Name</div>
                <div className="th">Price</div>
                <div className="th">Category</div>
                <div className="th">Quantity</div>
                <div className="th">Actions</div>
              </div>
              {menu.map(item => (
                <div key={item.id} className="table-row">
                  <div className="td id">{item.id}</div>
                  <div className="td" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={item.image} alt={item.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                    <span>{item.name}</span>
                    {getQty(item) === 0 && <span className="sold-out-pill">Sold Out</span>}
                  </div>
                  <div className="td price">₹{item.price}</div>
                  <div className="td cat">{item.category}</div>
                  <div className="td">
                    <div className="qty-control">
                      <button
                        className="qty-control-btn"
                        onClick={() => updateQty(item.id, -1)}
                        disabled={getQty(item) === 0}
                        title="Decrease quantity"
                      >−</button>
                      <span className={`qty-display ${getQty(item) === 0 ? "zero" : getQty(item) <= 5 ? "low" : "ok"}`}>
                        {getQty(item)}
                      </span>
                      <button
                        className="qty-control-btn plus"
                        onClick={() => updateQty(item.id, 1)}
                        title="Increase quantity"
                      >+</button>
                    </div>
                  </div>
                  <div className="td">
                    <button className="delete-btn" onClick={() => deleteItem(item.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });

  // Memoize so the reference is stable across renders.
  // Without this, any component that uses setLiveOrders in a useEffect
  // dependency array would re-run on every render, firing extra network calls.
  const set = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { }
      return next;
    });
  }, [key]); // key is a constant string — set will never change

  return [value, set];
}

export default function App() {
  // Persist logged-in user so refresh doesn't send everything back to login
  const [user, setUser] = useLocalStorage("qless_user", null);

  // Invalidate stale session if role is unrecognised
  useEffect(() => {
    if (user && user.role !== "user" && user.role !== "admin" && user.role !== "student") {
      setUser(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [menu, setMenu] = useState(INITIAL_MENU);
  const [liveOrders, setLiveOrders] = useLocalStorage("qless_orders", []);

  const logoutTimer = useRef(null);
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  const resetInactivityTimer = () => {
    if (!user) return;
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      setUser(null);
      alert("Logged out due to inactivity.");
    }, INACTIVITY_TIMEOUT_MS);
  };

  useEffect(() => {
    if (!user) return;

    resetInactivityTimer();
    const events = ["mousemove", "keydown", "click", "touchstart"];
    const onActivity = () => resetInactivityTimer();

    events.forEach((evt) => window.addEventListener(evt, onActivity));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders");
      setLiveOrders(res.data);
    } catch (err) {
      console.error("Failed to load orders", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [menuRes, ordersRes] = await Promise.all([
          axios.get("/api/menu"),
          axios.get("/api/orders"),
        ]);

        const normalize = (item) => {
          const quantity = Number(item.quantity ?? 0);
          return {
            ...item,
            quantity: quantity,
            inStock: quantity > 0,
          };
        };

        setMenu((menuRes.data || []).map(normalize));
        setLiveOrders(ordersRes.data);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };

    loadData();
  }, [setMenu, setLiveOrders]);

  const handleLogin = async (u) => {
    setUser(u);
    await fetchOrders();
  };

  const handleLogout = () => {
    setUser(null);
    setLiveOrders([]);
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
  };
  const handlePlaceOrder = async (order) => {
    try {
      const safeOrder = {
        ...order,
        studentId: order.studentId ?? user?.id ?? "UNKNOWN",
        studentName: order.studentName ?? user?.name ?? "Unknown",
      };

      const res = await axios.post("/api/orders", safeOrder);
      const newOrder = res.data;

      // If the backend returned a valid orderNumber, add it to local state.
      // Otherwise, refresh from server to ensure we have the persisted order.
      if (newOrder?.orderNumber != null) {
        setLiveOrders((o) => [newOrder, ...o]);
      } else {
        const ordersRes = await axios.get("/api/orders");
        setLiveOrders(ordersRes.data);
      }
    } catch (err) {
      console.error("Failed to place order", err);
      throw err;
    }
  };

  const handleCancelOrder = async (orderId) => {
    // Optimistic update so the UI responds immediately
    setLiveOrders(orders => orders.map(o =>
      (o._id === orderId || o.id === orderId) ? { ...o, status: "cancelled" } : o
    ));

    try {
      await axios.put(`/api/orders/${orderId}/cancel`);

      // Fetch fresh orders AND menu from server so state is authoritative.
      // Running them in parallel keeps it fast.
      const [ordersRes, menuRes] = await Promise.all([
        axios.get("/api/orders"),
        axios.get("/api/menu"),
      ]);
      const normalize = (item) => ({
        ...item,
        quantity: Number(item.quantity ?? 0),
        inStock: Number(item.quantity ?? 0) > 0,
      });
      setMenu((menuRes.data || []).map(normalize));
      // Server data is now authoritative after the confirmed cancel.
      // MenuPage's own pendingCancels guard in the polling loop will
      // protect any other concurrent in-flight cancellations.
      setLiveOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
      // Revert the optimistic update on failure
      setLiveOrders(orders => orders.map(o =>
        (o._id === orderId || o.id === orderId) ? { ...o, status: "preparing" } : o
      ));
      throw err;
    }
  };

  const formatOrderNumber = (input) => {
    const order = typeof input === "object" ? input : null;
    const n = order ? order.orderNumber : input;

    if (n != null && n !== "") return `#${String(n).padStart(4, "0")}`;

    const fallbackId = order ? (order._id || order.id) : null;
    if (fallbackId) return `#${String(fallbackId).slice(-4)}`;

    return "#----";
  };

  return (
    <>
      <style>{CSS}</style>
      {!user && <LoginPage onLogin={handleLogin} />}
      {(user?.role === "user" || user?.role === "student") && (
        <MenuPage
          user={user}
          menu={menu}
          onLogout={handleLogout}
          onPlaceOrder={handlePlaceOrder}
          onCancelOrder={handleCancelOrder}
          liveOrders={liveOrders}
          setLiveOrders={setLiveOrders}
          formatOrderNumber={formatOrderNumber}
        />
      )}
      {user?.role === "admin" && (
        <AdminPage
          onLogout={handleLogout}
          menu={menu}
          setMenu={setMenu}
          liveOrders={liveOrders}
          setLiveOrders={setLiveOrders}
          formatOrderNumber={formatOrderNumber}
        />
      )}
    </>
  );
}
