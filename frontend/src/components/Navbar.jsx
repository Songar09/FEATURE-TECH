import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogOut, LayoutDashboard, Package, LifeBuoy, Search, Bell, User } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';

const linkCls = ({ isActive }) =>
  `relative px-3 py-2 text-sm font-medium transition hover:text-white ${isActive ? 'text-white after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-neon-cyan after:to-neon-violet' : 'text-slate-400'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart, bump, isClient } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');
  const [alerts, setAlerts] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = user && user.rol !== 'Cliente';

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Notificaciones: respuestas de soporte (cliente) o solicitudes abiertas (staff)
  useEffect(() => {
    if (!user) return setAlerts(0);
    const path = isStaff ? '/support?estado=abierto' : '/support/mios';
    api(path).then((rows) => setAlerts(isStaff ? rows.length : rows.filter((r) => r.respuesta && r.estado !== 'cerrado').length)).catch(() => {});
  }, [user, isStaff, location.pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/catalogo${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? 'border-b border-white/5 bg-ink-950/80 backdrop-blur-xl' : 'bg-transparent'}`}>
      <nav className="container-app flex h-16 items-center gap-4">
        <Logo />

        <div className="ml-6 hidden items-center md:flex">
          <NavLink to="/" end className={linkCls}>Inicio</NavLink>
          <NavLink to="/catalogo" className={linkCls}>Catálogo</NavLink>
          {isClient && <NavLink to="/mis-pedidos" className={linkCls}>Mis pedidos</NavLink>}
          {isClient && <NavLink to="/soporte" className={linkCls}>Soporte</NavLink>}
          {isStaff && <NavLink to="/panel" className={linkCls}>Panel</NavLink>}
        </div>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 lg:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar productos…" className="input !rounded-full !py-2 pl-9" />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          {user && (
            <Link to={isStaff ? '/panel/soporte' : '/soporte'} className="relative rounded-xl p-2.5 text-slate-300 hover:bg-white/5 hover:text-white" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
              {alerts > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-neon-pink ring-2 ring-ink-950" />}
            </Link>
          )}
          {(!user || isClient) && (
            <Link to="/carrito" className="relative rounded-xl p-2.5 text-slate-300 hover:bg-white/5 hover:text-white" aria-label="Carrito">
              <ShoppingCart key={bump} className={`h-5 w-5 ${bump ? 'animate-pop' : ''}`} />
              {cart.cantidad_total > 0 && (
                <span key={`b${bump}`} className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet px-1 text-[11px] font-bold text-ink-950">
                  {cart.cantidad_total}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="hidden items-center gap-2 pl-2 md:flex">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
                  : <span className="grid h-7 w-7 place-items-center rounded-full bg-neon-violet/30 text-xs font-bold text-white">{user.nombre[0]}</span>}
                <div className="leading-tight">
                  <p className="max-w-[110px] truncate text-xs font-semibold text-white">{user.nombre}</p>
                  <p className="text-[10px] text-neon-cyan">{user.rol}</p>
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/'); }} className="rounded-xl p-2.5 text-slate-400 hover:bg-white/5 hover:text-rose-300" aria-label="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary ml-2 hidden md:inline-flex"><User className="h-4 w-4" /> Ingresar</Link>
          )}

          <button onClick={() => setOpen(!open)} className="rounded-xl p-2.5 text-slate-300 hover:bg-white/5 md:hidden" aria-label="Menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Menú móvil */}
      <div className={`overflow-hidden border-white/5 bg-ink-950/95 backdrop-blur-xl transition-all duration-300 md:hidden ${open ? 'max-h-[480px] border-b' : 'max-h-0'}`}>
        <div className="container-app flex flex-col gap-1 py-4">
          <form onSubmit={submitSearch} className="mb-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar productos…" className="input" />
          </form>
          <NavLink to="/catalogo" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5"><Package className="h-5 w-5 text-neon-cyan" /> Catálogo</NavLink>
          {isClient && <NavLink to="/mis-pedidos" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5"><ShoppingCart className="h-5 w-5 text-neon-cyan" /> Mis pedidos</NavLink>}
          {isClient && <NavLink to="/soporte" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5"><LifeBuoy className="h-5 w-5 text-neon-cyan" /> Soporte</NavLink>}
          {isStaff && <NavLink to="/panel" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5"><LayoutDashboard className="h-5 w-5 text-neon-cyan" /> Panel</NavLink>}
          {user
            ? <button onClick={() => { logout(); navigate('/'); }} className="btn-danger mt-2">Cerrar sesión ({user.nombre})</button>
            : <Link to="/login" className="btn-primary mt-2">Ingresar</Link>}
        </div>
      </div>
    </header>
  );
}
