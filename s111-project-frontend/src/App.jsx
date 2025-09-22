import React, { useState, useEffect } from 'react';

// The following is a self-contained React application using standard CSS.
// All styles are defined within a <style> tag.
// This version removes all Tailwind CSS classes from the JSX.

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderMessage, setOrderMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  // API base: use same-origin Nginx proxy to avoid CORS issues in Docker
  const API_BASE_URL = '/api';

  useEffect(() => {
    // Fetch products when the component mounts
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json().catch(() => ({ message: 'Unexpected response from server.' }));
      if (!response.ok) {
        console.error('Failed to fetch products:', data?.message || `Failed to fetch products (${response.status})`);
        return;
      }
      if (data.length === 0) {
        // If no products, add some dummy data
        await fetch(`${API_BASE_URL}/products/add-dummy-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const updatedResponse = await fetch(`${API_BASE_URL}/products`);
        const updatedData = await updatedResponse.json();
        setProducts(updatedData);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const handleRegister = async () => {
    setFeedback('');
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({ message: 'Unexpected response from server.' }));
      if (!response.ok) {
        setFeedback(data?.message || `Registration failed (${response.status})`);
        return;
      }
      setFeedback(data.message);
      if (data.message.includes('successful')) {
        setUsername('');
        setPassword('');
        setCurrentPage('login');
      }
    } catch (error) {
      setFeedback('Error during registration. Please try again.');
    }
  };

  const handleLogin = async () => {
    setFeedback('');
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({ message: 'Unexpected response from server.' }));
      if (!response.ok) {
        setFeedback(data?.message || `Login failed (${response.status})`);
        return;
      }
      setFeedback(data.message);
      if (data.message.includes('successful')) {
        setIsLoggedIn(true);
        setUsername('');
        setPassword('');
        setCurrentPage('products');
      }
    } catch (error) {
      setFeedback('Error during login. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCart([]);
    setCurrentPage('home');
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingProduct = prevCart.find(item => item.id === product.id);
      if (existingProduct) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handlePlaceOrder = () => {
    // This is a simplified "order placed" message.
    // In a real app, this would involve a backend call to process the order.
    setOrderMessage('Order placed successfully! Thank you for your purchase.');
    setCart([]);
    setTimeout(() => setOrderMessage(''), 3000);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="content home">
            <h1 className="main-title">Welcome to Our Store</h1>
            <p className="subtitle">Your one-stop shop for everything you need.</p>
            <div className="deals-card">
              <h2 className="section-title">Featured Deals</h2>
              <div className="deals-grid">
                <div className="deal-item deal-green">
                  <h3>50% off on all headphones!</h3>
                </div>
                <div className="deal-item deal-purple">
                  <h3>Buy 1 Get 1 Free on Shirts</h3>
                </div>
                <div className="deal-item deal-red">
                  <h3>Free Shipping on all orders!</h3>
                </div>
              </div>
            </div>
          </div>
        );
      case 'register':
        return (
          <div className="content auth-page">
            <div className="auth-form-card">
              <h2 className="section-title">Register</h2>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
                <button
                  onClick={handleRegister}
                  className="auth-button register-button"
                >
                  Register
                </button>
              </div>
              {feedback && <p className="feedback-message">{feedback}</p>}
            </div>
          </div>
        );
      case 'login':
        return (
          <div className="content auth-page">
            <div className="auth-form-card">
              <h2 className="section-title">Login</h2>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
                <button
                  onClick={handleLogin}
                  className="auth-button login-button"
                >
                  Login
                </button>
              </div>
              {feedback && <p className="feedback-message">{feedback}</p>}
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="content products-page">
            <h2 className="section-title text-center">All Products</h2>
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="add-to-cart-button"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'cart':
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return (
          <div className="content cart-page">
            <h2 className="section-title text-center">Your Cart</h2>
            {cart.length === 0 ? (
              <p className="empty-cart-message">Your cart is empty.</p>
            ) : (
              <div className="cart-container">
                <div className="cart-items-list">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div>
                        <h3>{item.name}</h3>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <p className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <p className="cart-total">Total: ${total.toFixed(2)}</p>
                  <button
                    onClick={handlePlaceOrder}
                    className="place-order-button"
                  >
                    Place Order
                  </button>
                </div>
                {orderMessage && (
                  <div className="order-message">
                    {orderMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const navItems = [
    { name: 'Home', page: 'home', visible: true },
    { name: 'Products', page: 'products', visible: true },
    { name: 'Cart', page: 'cart', visible: true },
    { name: 'Register', page: 'register', visible: !isLoggedIn },
    { name: 'Login', page: 'login', visible: !isLoggedIn },
  ];

  return (
    <div className="app-container">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        :root {
            --bg-light: #f9fafb;
            --bg-white: #ffffff;
            --text-dark: #111827;
            --text-gray: #374151;
            --text-light-gray: #6b7280;
            --blue-800: #1e40af;
            --blue-600: #2563eb;
            --blue-700: #1d4ed8;
            --green-600: #16a34a;
            --green-700: #15803d;
            --red-500: #ef4444;
            --red-600: #dc2626;
            --border-gray: #d1d5db;
        }

        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
          background-color: var(--bg-light);
          color: var(--text-dark);
        }

        .header {
          background-color: var(--bg-white);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 1rem;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .logo {
          font-size: 1.875rem;
          font-weight: 800;
          color: var(--blue-800);
        }

        .search-container {
          flex-grow: 1;
          max-width: 32rem;
        }

        .search-input {
          width: 100%;
          padding: 0.5rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-gray);
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--blue-600);
        }

        .nav {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .nav-link {
          color: var(--text-gray);
          font-weight: 600;
          transition: color 0.3s ease;
          cursor: pointer;
        }

        .nav-link:hover {
          color: var(--blue-600);
        }

        .logout-button {
          background-color: var(--red-500);
          color: var(--bg-white);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: background-color 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: none;
          cursor: pointer;
        }

        .logout-button:hover {
          background-color: var(--red-600);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .content {
          flex: 1;
          padding: 2rem;
          background-color: var(--bg-light);
          display: flex;
          flex-direction: column;
        }

        .main-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--blue-800);
          margin-bottom: 1rem;
          text-align: center;
          animation: fadeIn 1s ease-in-out;
        }

        .subtitle {
          font-size: 1.25rem;
          color: var(--text-gray);
          margin-bottom: 2rem;
          text-align: center;
        }

        .section-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .deals-card {
          width: 100%;
          max-width: 56rem;
          padding: 1.5rem;
          background-color: var(--bg-white);
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          margin: 0 auto;
        }

        .deals-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
        }

        .deal-item {
          padding: 1.5rem;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: transform 0.3s ease;
        }

        .deal-item:hover {
          transform: scale(1.05);
        }

        .deal-item h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--bg-white);
        }

        .deal-green {
          background-image: linear-gradient(to bottom right, #4ade80, #16a34a);
        }

        .deal-purple {
          background-image: linear-gradient(to bottom right, #c084fc, #9333ea);
        }

        .deal-red {
          background-image: linear-gradient(to bottom right, #f87171, #dc2626);
        }

        .auth-page {
          align-items: center;
          justify-content: center;
          flex-grow: 1; /* This is the key fix */
        }

        .auth-form-card {
          width: 100%;
          max-width: 28rem;
          padding: 2rem;
          background-color: var(--bg-white);
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          text-align: center;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-field {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border-gray);
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--blue-600);
        }

        .auth-button {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          border: none;
          cursor: pointer;
          color: var(--bg-white);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .auth-button:hover {
            background-color: var(--blue-700);
        }

        .register-button {
          background-color: var(--blue-600);
        }

        .login-button {
          background-color: var(--blue-600);
        }

        .feedback-message {
          margin-top: 1rem;
          text-align: center;
          color: var(--red-500);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 2rem;
        }

        .product-card {
          background-color: var(--bg-white);
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.3s ease;
        }

        .product-card:hover {
          transform: scale(1.05);
        }

        .product-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }

        .product-description {
          color: var(--text-light-gray);
          margin-bottom: 1rem;
        }

        .product-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--green-600);
          margin-bottom: 1rem;
        }

        .add-to-cart-button {
          width: 100%;
          background-color: var(--blue-600);
          color: var(--bg-white);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: background-color 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .add-to-cart-button:hover {
            background-color: var(--blue-700);
        }

        .empty-cart-message {
          text-align: center;
          color: var(--text-light-gray);
          font-size: 1.25rem;
          flex-grow: 1; /* This is the key fix */
        }

        .cart-page {
          display: flex;
          flex-direction: column;
          flex-grow: 1; /* This is the key fix */
        }

        .cart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-grow: 1; /* This is the key fix */
          justify-content: center; /* Center the cart content */
        }

        .cart-items-list {
          width: 100%;
          max-width: 56rem;
          background-color: var(--bg-white);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .cart-item:last-child {
          border-bottom: none;
        }

        .cart-item-price {
          font-weight: 700;
        }

        .cart-summary {
          width: 100%;
          max-width: 28rem;
          background-color: var(--bg-white);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cart-total {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 1rem;
        }

        .place-order-button {
          width: 100%;
          background-color: var(--green-600);
          color: var(--bg-white);
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1.125rem;
          transition: background-color 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .place-order-button:hover {
          background-color: var(--green-700);
        }

        .order-message {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          padding: 1rem;
          background-color: var(--green-600);
          color: var(--bg-white);
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 50;
          animation: slideUp 0.5s ease-out forwards;
        }
        
        .footer {
          background-color: var(--text-dark);
          color: var(--bg-white);
          padding: 1rem;
          text-align: center;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { transform: translateY(100px) translateX(-50%); opacity: 0; }
          to { transform: translateY(0) translateX(-50%); opacity: 1; }
        }

        @media (min-width: 768px) {
          .main-title {
            font-size: 3.75rem;
          }
          .subtitle {
            font-size: 1.5rem;
          }
          .deals-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .deals-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        `}
      </style>
      <header className="header">
        <div className="header-container">
          <h1 className="logo">Our Store</h1>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
            />
          </div>
          <nav className="nav">
            {navItems.map(item => item.visible && (
              <a
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className="nav-link"
              >
                {item.name}
              </a>
            ))}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">{renderContent()}</main>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; {new Date().getFullYear()} Our Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;