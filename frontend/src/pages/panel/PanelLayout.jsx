import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Boxes, ClipboardList, LifeBuoy, Users, Contact } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ITEMS = [
  { to: '/panel', end: true, label: 'Dashboard', Icon: LayoutDashboard, roles: ['Administrador', 'Empleado'] },
  { to: '/panel/inventario', label: 'Inventario', Icon: Boxes, roles: ['Administrador', 'Empleado'] },
  { to: '/panel/pedidos', label: 'Pedidos', Icon: ClipboardList, roles: ['Administrador', 'Empleado'] },
  { to: '/panel/soporte', label: 'Soporte', Icon: LifeBuoy, roles: ['Administrador', 'Empleado'] },
  { to: '/panel/clientes', label: 'Clientes', Icon: Contact, roles: ['Administrador', 'Empleado'] },
  { to: '/panel/usuarios', label: 'Usuarios', Icon: Users, roles: ['Administrador'] },
];

export default function PanelLayout() {
  const { user } = useAuth();
  const items = ITEMS.filter((i) => i.roles.includes(user.rol));

  return (
    <div className="container-app grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wider text-slate-500 lg:block">Panel · {user.rol}</p>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {items.map(({ to, end, label, Icon }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-gradient-to-r from-neon-violet/25 to-neon-cyan/10 text-white ring-1 ring-neon-violet/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 animate-fade-up"><Outlet /></main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
