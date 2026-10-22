import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { homeFor, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/** Recibe el JWT emitido tras Google OAuth (en el fragmento #token=...) */
export default function AuthCallback() {
  const { loginWithToken } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(null, '', window.location.pathname); // limpia el token de la URL
    if (!token) { navigate('/login?error=google', { replace: true }); return; }
    loginWithToken(token).then((u) => {
      if (!u) return navigate('/login?error=google', { replace: true });
      notify(`¡Bienvenido, ${u.nombre}!`);
      navigate(homeFor(u), { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Spinner full />;
}
