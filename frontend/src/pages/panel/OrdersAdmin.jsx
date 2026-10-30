import { useCallback, useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { PageHeader } from './PanelLayout';
import { OrderTimeline } from '../MyOrders';
import { api } from '../../lib/api';
import { date, money, ORDER_STATES } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function OrdersAdmin() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  const notify = useToast();
  const [orders, setOrders] = useState(null);
  const [estado, setEstado] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => api('/orders', { params: { estado } }).then(setOrders).catch((e) => notify(e.message, 'error')), [estado, notify]);
  useEffect(() => { load(); }, [load]);

  const changeState = async (o, nuevo) => {
    if (nuevo === 'cancelado' && !window.confirm(`¿Cancelar el pedido #${o.id_pedido}? El stock será repuesto.`)) return;
    try {
      const updated = await api(`/orders/${o.id_pedido}/estado`, { method: 'PATCH', body: { estado: nuevo } });
      notify(`Pedido #${o.id_pedido} → ${ORDER_STATES[nuevo].label}`);
      if (detail?.id_pedido === o.id_pedido) setDetail(updated);
      load();
    } catch (err) { notify(err.message, 'error'); }
  };

  return (
    <>
      <PageHeader title="Pedidos" subtitle={isAdmin ? 'Consulta y actualiza el estado de los pedidos' : 'Consulta los pedidos de los clientes'} />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {['', ...Object.keys(ORDER_STATES)].map((s) => (
          <button key={s || 'todos'} onClick={() => setEstado(s)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${estado === s ? 'bg-gradient-to-r from-neon-cyan to-neon-violet font-semibold text-ink-950' : 'border border-white/10 bg-white/5 text-slate-300 hover:border-neon-violet/40'}`}>
            {s ? ORDER_STATES[s].label : 'Todos'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {!orders ? <div className="p-10"><Spinner full /></div> : (
          <table className="table-app">
            <thead><tr><th>#</th><th>Cliente</th><th>Fecha</th><th>Unidades</th><th>Total</th><th>Estado</th><th /></tr></thead>
            <tbody>
              {!orders.length && <tr><td colSpan={7} className="py-10 text-center text-slate-500">No hay pedidos.</td></tr>}
              {orders.map((o) => (
                <tr key={o.id_pedido}>
                  <td className="font-mono text-neon-cyan">#{o.id_pedido}</td>
                  <td><p className="text-white">{o.cliente}</p><p className="text-xs text-slate-400">{o.correo_cliente}</p></td>
                  <td className="text-xs text-slate-400">{date(o.fecha_pedido)}</td>
                  <td>{o.unidades}</td>
                  <td className="font-semibold text-white">{money(o.total)}</td>
                  <td>
                    {isAdmin && o.estado !== 'cancelado' ? (
                      <select value={o.estado} onChange={(e) => changeState(o, e.target.value)} className={`badge cursor-pointer border-0 pr-6 ${ORDER_STATES[o.estado].cls}`}>
                        {Object.entries(ORDER_STATES).map(([k, v]) => <option key={k} value={k} className="bg-ink-900 text-white">{v.label}</option>)}
                      </select>
                    ) : <span className={`badge ${ORDER_STATES[o.estado].cls}`}>{ORDER_STATES[o.estado].label}</span>}
                  </td>
                  <td><button onClick={() => api(`/orders/${o.id_pedido}`).then(setDetail)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Ver detalle"><Eye className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal wide open={Boolean(detail)} onClose={() => setDetail(null)} title={`Pedido #${detail?.id_pedido}`}>
        {detail && (
          <div className="space-y-4">
            <OrderTimeline estado={detail.estado} />
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-slate-400">Cliente:</span> {detail.cliente}</p>
              <p><span className="text-slate-400">Correo:</span> {detail.correo_cliente}</p>
              <p><span className="text-slate-400">Recibe:</span> {detail.nombre_contacto || '—'}</p>
              <p><span className="text-slate-400">Teléfono:</span> {detail.telefono_contacto || '—'}</p>
              <p className="sm:col-span-2"><span className="text-slate-400">Dirección:</span> {detail.direccion_envio}{detail.ciudad_envio ? `, ${detail.ciudad_envio}` : ''}</p>
              <p><span className="text-slate-400">Pago:</span> {detail.metodo_pago ? `${detail.metodo_pago}${detail.tarjeta_ultimos4 ? ` •••• ${detail.tarjeta_ultimos4}` : ''}` : '—'}</p>
              <p><span className="text-slate-400">Referencia:</span> <span className="font-mono text-xs">{detail.referencia_pago || '—'}</span></p>
            </div>
            <div className="divide-y divide-white/5 rounded-xl bg-ink-800">
              {detail.items.map((i) => (
                <div key={i.id_detalle_pedido} className="flex items-center gap-3 p-3 text-sm">
                  <img src={i.imagen_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="flex-1">{i.nombre}</span>
                  <span className="text-slate-400">{i.cantidad} × {money(i.precio_unitario)}</span>
                  <span className="w-28 text-right font-semibold">{money(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <p className="text-right text-lg font-bold text-white">Total: {money(detail.total)}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
