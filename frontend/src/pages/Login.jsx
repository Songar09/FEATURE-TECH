import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import GoogleButton from '../components/GoogleButton';
import { homeFor, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="container-app grid min-h-[calc(100vh-4rem)] place-items-center py-10">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r from-neon-cyan/30 via-neon-violet/30 to-neon-pink/30 blur-xl" />
        <div className="card animate-fade-up p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

const ERRORS = { google: 'No se pudo iniciar sesión con Google', suspendido: 'Tu cuenta está suspendida' };

export default function Login() {
  const { login } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ correo: '', contrasena: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const e = params.get('error');
    if (e) notify(ERRORS[e] || 'Error de autenticación', 'error');
  }, [params, notify]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.correo, form.contrasena);
      notify(`¡Bienvenido, ${u.nombre}!`);
      navigate(location.state?.from || homeFor(u), { replace: true });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Iniciar sesión" subtitle="Accede a tu cuenta de FEATURE TECH">
      <GoogleButton />
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
        <span className="h-px flex-1 bg-white/10" /> o con tu correo <span className="h-px flex-1 bg-white/10" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="correo">Correo</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input id="correo" type="email" required autoComplete="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="input pl-9" placeholder="tu@correo.com" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="contrasena">Contraseña</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input id="contrasena" type="password" required autoComplete="current-password" value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} className="input pl-9" placeholder="••••••••" />
          </div>
        </div>
        <button disabled={loading} className="btn-primary w-full py-3"><LogIn className="h-4 w-4" /> {loading ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">¿No tienes cuenta? <Link to="/registro" className="font-semibold text-neon-cyan hover:underline">Regístrate</Link></p>
    </AuthShell>
  );
}
