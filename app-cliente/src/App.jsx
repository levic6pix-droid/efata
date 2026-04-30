import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderStatus from './pages/OrderStatus';

function App() {
  return (
    <SocketProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/carrinho" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido/:id" element={<OrderStatus />} />
          </Routes>
        </Router>
        <SpeedInsights />
      </CartProvider>
    </SocketProvider>
  );
}

export default App;
