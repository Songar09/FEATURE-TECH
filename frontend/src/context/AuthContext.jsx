import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setLoading(false); return null; }
    try {
      const { usuario } = await api('/auth/me');
      setUser(usuario);
      return usuario;
    } catch {
      tokenStore.clear();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const handleSession = ({ token, usuario }) => {
    tokenStore.set(token);
    setUser(usuario);
    return usuario;
  };

  const login = async (correo, contrasena) => handleSession(await api('/auth/login', { method: 'POST', body: { correo, contrasena } }));
  const register = async (data) => handleSession(await api('/auth/register', { method: 'POST', body: data }));
  const loginWithToken = async (token) => { tokenStore.set(token); return loadMe(); };
  const logout = () => { tokenStore.clear(); setUser(null); };
  const hasRole = (...roles) => Boolean(user && roles.includes(user.rol));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithToken, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Ruta del panel según el rol tras iniciar sesión */
export const homeFor = (u) => (u && u.rol !== 'Cliente' ? '/panel' : '/catalogo');
