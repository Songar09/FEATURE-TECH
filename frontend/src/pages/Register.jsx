import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import GoogleButton from '../components/GoogleButton';
import { AuthShell } from './Login';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '', confirmar: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.contrasena !== form.confirmar) return notify('Las contraseñas no coinciden', 'error');
    setLoading(true);
    try {
      const u = await register({ nombre: form.nombre, correo: form.correo, contrasena: form.contrasena });
      notify(`¡Cuenta creada! Bienvenido, ${u.nombre}`);
      navigate('/catalogo', { replace: true });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Crear cuenta" subtitle="Regístrate como cliente y empieza a comprar">
      <GoogleButton label="Registrarme con Google" />
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-500">
        <span className="h-px flex-1 bg-white/10" /> o con tu correo <span className="h-px flex-1 bg-white/10" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Nombre completo</label><input required value={form.nombre} onChange={set('nombre')} className="input" /></div>
        <div><label className="label">Correo</label><input type="email" required autoComplete="email" value={form.correo} onChange={set('correo')} className="input" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Contraseña</label><input type="password" required minLength={8} autoComplete="new-password" value={form.contrasena} onChange={set('contrasena')} className="input" /></div>
          <div><label className="label">Confirmar</label><input type="password" required minLength={8} autoComplete="new-password" value={form.confirmar} onChange={set('confirmar')} className="input" /></div>
        </div>
        <button disabled={loading} className="btn-primary w-full py-3"><UserPlus className="h-4 w-4" /> {loading ? 'Creando…' : 'Crear cuenta'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-neon-cyan hover:underline">Inicia sesión</Link></p>
    </AuthShell>
  );
}
