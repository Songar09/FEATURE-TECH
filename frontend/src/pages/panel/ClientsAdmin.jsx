import { useCallback, useEffect, useState } from 'react';
import { Eye, Search, Users, ShoppingBag, Wallet } from 'lucide-react';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { PageHeader } from './PanelLayout';
import { api } from '../../lib/api';
import { date, money, ORDER_STATES } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

const FILTROS = [['', 'Todos'], ['con', 'Con compras'], ['sin', 'Sin compras']];

function Stat({ Icon, label, value }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon-violet/20 text-neon-cyan"><Icon className="h-5 w-5" /></span>
      <div><p className="text-xs text-slate-400">{label}</p><p className="text-lg font-bold text-white">{value}</p></div>
    </div>
  );
}

export default function ClientsAdmin() {
  const notify = useToast();
  const [clients, setClients] = useState(null);
  const [filters, setFilters] = useState({ q: '', compras: '' });
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => api('/clients', { params: filters }).then(setClients).catch((e) => notify(e.message, 'error')), [filters, notify]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const openDetail = (c) => api(`/clients/${c.id_usuario}`).then(setDetail).catch((e) => notify(e.message, 'error'));

  const compradores = clients?.filter((c) => c.pedidos > 0).length ?? 0;
  const vendido = clients?.reduce((s, c) => s + c.total_comprado, 0) ?? 0;

  return (
    <>
      <PageHeader title="Clientes" subtitle="Registro de los clientes que se registran y compran en la tienda" />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat Icon={Users} label="Clientes registrados" value={clients?.length ?? '—'} />
        <Stat Icon={ShoppingBag} label="Clientes con compras" value={clients ? compradores : '—'} />
        <Stat Icon={Wallet} label="Total comprado" value={clients ? money(vendido) : '—'} />
      </div>

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Buscar por nombre, correo o teléfono" className="input pl-9" />
        </label>
        <select value={filters.compras} onChange={(e) => setFilters({ ...filters, compras: e.target.value })} className="input">
          {FILTROS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {!clients ? <div className="p-10"><Spinner full /></div> : (
          <table className="table-app">
            <thead><tr><th>Cliente</th><th>Registro</th><th>Método</th><th>Pedidos</th><th>Total comprado</th><th>Último pedido</th><th /></tr></thead>
            <tbody>
              {!clients.length && <tr><td colSpan={7} className="py-10 text-center text-slate-500">No hay clientes.</td></tr>}
              {clients.map((c) => (
                <tr key={c.id_usuario}>
                  <td>
                    <div className="flex items-center gap-3">
                      {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                        : <span className="grid h-8 w-8 place-items-center rounded-full bg-neon-violet/25 text-xs font-bold">{c.nombre[0]}</span>}
                      <div>
                        <p className="font-medium text-white">{c.nombre} {c.estado === 'suspendido' && <span className="text-xs text-rose-300">(suspendido)</span>}</p>
                        <p className="text-xs text-slate-400">{c.correo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-slate-400">{date(c.fecha_registro)}</td>
                  <td className="text-xs text-slate-400">{c.metodo_registro}</td>
                  <td>{c.pedidos}</td>
                  <td className="font-semibold text-white">{money(c.total_comprado)}</td>
                  <td className="text-xs text-slate-400">{c.ultimo_pedido ? date(c.ultimo_pedido) : '—'}</td>
                  <td><button onClick={() => openDetail(c)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Ver detalle"><Eye className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal wide open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.nombre}>
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-slate-400">Correo:</span> {detail.correo}</p>
              <p><span className="text-slate-400">Teléfono:</span> {detail.telefono || '—'}</p>
              <p><span className="text-slate-400">Registro:</span> {date(detail.fecha_registro)}</p>
              <p><span className="text-slate-400">Método:</span> {detail.metodo_registro}</p>
              <p className="sm:col-span-2"><span className="text-slate-400">Dirección:</span> {detail.direccion || '—'}</p>
              <p><span className="text-slate-400">Pedidos:</span> {detail.pedidos}</p>
              <p><span className="text-slate-400">Total comprado:</span> <b className="text-white">{money(detail.total_comprado)}</b></p>
            </div>
            <div className="divide-y divide-white/5 rounded-xl bg-ink-800">
              {!detail.historial.length && <p className="p-4 text-center text-sm text-slate-500">Este cliente aún no ha comprado.</p>}
              {detail.historial.map((p) => (
                <div key={p.id_pedido} className="flex items-center gap-3 p-3 text-sm">
                  <span className="font-mono text-neon-cyan">#{p.id_pedido}</span>
                  <span className="flex-1 text-xs text-slate-400">{date(p.fecha_pedido)} · {p.unidades} und.</span>
                  <span className={`badge ${ORDER_STATES[p.estado].cls}`}>{ORDER_STATES[p.estado].label}</span>
                  <span className="w-28 text-right font-semibold">{money(p.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
