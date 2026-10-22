import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Clock, Boxes, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import Spinner from '../../components/Spinner';
import { PageHeader } from './PanelLayout';
import { api } from '../../lib/api';
import { money, ORDER_STATES } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = { pendiente: '#fbbf24', pagado: '#38bdf8', enviado: '#a78bfa', entregado: '#34d399', cancelado: '#fb7185' };
const ROLE_COLORS = { Administrador: '#e879f9', Empleado: '#22d3ee', Cliente: '#8b5cf6' };
const compact = (n) => new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

function Kpi({ Icon, label, value, hint, color }) {
  return (
    <div className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-glow">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl ${color}`} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${color} bg-opacity-20 text-white`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const tooltipStyle = { contentStyle: { background: '#121527', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#fff' } };

export default function Dashboard() {
  const { user } = useAuth();
  const [m, setM] = useState(null);
  useEffect(() => { api('/dashboard/metricas').then(setM).catch(() => setM(false)); }, []);

  if (m === null) return <Spinner full />;
  if (m === false) return <p className="text-rose-300">No se pudieron cargar las métricas.</p>;
  const k = m.kpis;

  return (
    <>
      <PageHeader title={`Hola, ${user.nombre.split(' ')[0]} 👋`} subtitle="Resumen del negocio e inventario en tiempo real" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi Icon={DollarSign} label="Ingresos" value={money(k.ingresos)} hint="Pedidos no cancelados" color="bg-emerald-500" />
        <Kpi Icon={ShoppingBag} label="Pedidos" value={k.pedidos} hint={`${k.clientes} clientes registrados`} color="bg-neon-violet" />
        <Kpi Icon={Clock} label="Pendientes" value={k.pedidos_pendientes} hint="Requieren gestión" color="bg-amber-500" />
        <Kpi Icon={Boxes} label="Inventario" value={`${k.unidades_inventario} u.`} hint={`Valor: ${money(k.valor_inventario)}`} color="bg-neon-cyan" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><TrendingUp className="h-4 w-4 text-neon-cyan" /> Ventas últimos 7 días</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={m.ventas_7_dias.map((d) => ({ ...d, dia: d.fecha.slice(5) }))}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="dia" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
                <Tooltip {...tooltipStyle} formatter={(v, n) => (n === 'total' ? [money(v), 'Ventas'] : [v, 'Pedidos'])} />
                <Area type="monotone" dataKey="total" stroke="#a78bfa" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold">Pedidos por estado</h3>
          {m.pedidos_por_estado.length ? (
            <>
              <div className="h-44">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={m.pedidos_por_estado} dataKey="cantidad" nameKey="estado" innerRadius={45} outerRadius={70} paddingAngle={3} stroke="none">
                      {m.pedidos_por_estado.map((e) => <Cell key={e.estado} fill={PIE_COLORS[e.estado]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v, n) => [v, ORDER_STATES[n]?.label]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {m.pedidos_por_estado.map((e) => (
                  <li key={e.estado} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[e.estado] }} />{ORDER_STATES[e.estado].label}: <b className="text-white">{e.cantidad}</b></li>
                ))}
              </ul>
            </>
          ) : <p className="text-sm text-slate-500">Sin pedidos todavía.</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-amber-300" /> Stock bajo</h3>
            <Link to="/panel/inventario" className="text-xs text-neon-cyan hover:underline">Gestionar</Link>
          </div>
          <ul className="space-y-3">
            {!m.bajo_stock.length && <li className="text-sm text-slate-500">Todo el inventario está en niveles saludables ✅</li>}
            {m.bajo_stock.map((p) => (
              <li key={p.id_producto}>
                <div className="flex justify-between text-sm"><span className="truncate pr-2">{p.nombre}</span><b className={p.stock === 0 ? 'text-rose-300' : 'text-amber-300'}>{p.stock}/{p.stock_minimo}</b></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${p.stock === 0 ? 'bg-rose-400' : 'bg-amber-400'}`} style={{ width: `${Math.max(4, (p.stock / Math.max(1, p.stock_minimo)) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5 xl:col-span-2">
          <h3 className="mb-4 font-semibold">Productos más vendidos</h3>
          {m.top_productos.length ? (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={m.top_productos} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nombre" width={150} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,.04)' }} formatter={(v) => [v, 'Unidades']} />
                  <Bar dataKey="unidades" barSize={22} radius={[0, 8, 8, 0]} fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slate-500">Aún no hay ventas registradas.</p>}
        </div>
      </div>

      {m.usuarios_por_rol && (
        <div className="card mt-6 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Users className="h-4 w-4 text-neon-pink" /> Usuarios por rol</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Administrador', 'Empleado', 'Cliente'].map((r) => {
              const n = m.usuarios_por_rol.find((x) => x.rol === r)?.cantidad || 0;
              return (
                <div key={r} className="rounded-xl bg-ink-800 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">{r}</p>
                  <p className="mt-1 font-display text-2xl font-bold" style={{ color: ROLE_COLORS[r] }}>{n}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
