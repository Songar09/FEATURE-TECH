import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import Support from './pages/Support';
import NotFound from './pages/NotFound';
import PanelLayout from './pages/panel/PanelLayout';
import Dashboard from './pages/panel/Dashboard';
import Inventory from './pages/panel/Inventory';
import OrdersAdmin from './pages/panel/OrdersAdmin';
import SupportAdmin from './pages/panel/SupportAdmin';
import UsersAdmin from './pages/panel/UsersAdmin';
import ClientsAdmin from './pages/panel/ClientsAdmin';

const STAFF = ['Administrador', 'Empleado'];

export default function App() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* key = sección actual → animación de entrada al cambiar de vista */}
      <main key={location.pathname.split('/')[1]} className="flex-1 animate-fade-up">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="/carrito" element={<ProtectedRoute roles={['Cliente']}><Cart /></ProtectedRoute>} />
          <Route path="/mis-pedidos" element={<ProtectedRoute roles={['Cliente']}><MyOrders /></ProtectedRoute>} />
          <Route path="/soporte" element={<ProtectedRoute roles={['Cliente']}><Support /></ProtectedRoute>} />

          <Route path="/panel" element={<ProtectedRoute roles={STAFF}><PanelLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="inventario" element={<Inventory />} />
            <Route path="pedidos" element={<OrdersAdmin />} />
            <Route path="soporte" element={<SupportAdmin />} />
            <Route path="clientes" element={<ClientsAdmin />} />
            <Route path="usuarios" element={<ProtectedRoute roles={['Administrador']}><UsersAdmin /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
}
