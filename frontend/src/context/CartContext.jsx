import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);
const EMPTY = { items: [], total: 0, cantidad_total: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const notify = useToast();
  const [cart, setCart] = useState(EMPTY);
  const [bump, setBump] = useState(0); // dispara la animación del ícono del carrito
  const isClient = user?.rol === 'Cliente';

  const refresh = useCallback(async () => {
    if (!isClient) return setCart(EMPTY);
    try { setCart(await api('/cart')); } catch { setCart(EMPTY); }
  }, [isClient]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (fn, okMsg) => {
    try {
      const data = await fn();
      setCart(data);
      if (okMsg) { notify(okMsg); setBump((b) => b + 1); }
      return true;
    } catch (e) {
      notify(e.message, 'error');
      return false;
    }
  };

  const add = (producto, cantidad = 1) =>
    run(() => api('/cart/items', { method: 'POST', body: { id_producto: producto.id_producto, cantidad } }), `${producto.nombre} agregado al carrito`);
  const update = (id, cantidad) => run(() => api(`/cart/items/${id}`, { method: 'PUT', body: { cantidad } }));
  const remove = (id) => run(() => api(`/cart/items/${id}`, { method: 'DELETE' }), 'Producto retirado');
  const clear = () => run(() => api('/cart', { method: 'DELETE' }));

  return (
    <CartContext.Provider value={{ cart, add, update, remove, clear, refresh, bump, isClient }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
