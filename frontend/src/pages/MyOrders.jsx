import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronDown } from 'lucide-react';
import Spinner, { EmptyState } from '../components/Spinner';
import { api } from '../lib/api';
import { date, money, ORDER_STATES } from '../lib/format';

const STEPS = ['pendiente', 'pagado', 'enviado', 'entregado'];

export function OrderTimeline({ estado }) {
  if (estado === 'cancelado') return <p className="text-sm text-rose-300">Este pedido fue cancelado.</p>;
  const idx = STEPS.indexOf(estado);
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col items-center gap-1">
          <div className={`h-1.5 w-full rounded-full ${i <= idx ? 'bg-gradient-to-r from-neon-cyan to-neon-violet' : 'bg-white/10'}`} />
          <span className={`text-[10px] uppercase tracking-wider ${i <= idx ? 'text-white' : 'text-slate-500'}`}>{ORDER_STATES[s].label}</span>
        </div>
      ))}
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState(null);
  const [open, setOpen] = useState(null);
  const [detail, setDetail] = useState({});

  useEffect(() => { api('/orders/mis-pedidos').then(setOrders).catch(() => setOrders([])); }, []);

  const toggle = async (id) => {
    setOpen(open === id ? null : id);
    if (!detail[id]) {
      const d = await api(`/orders/${id}`).catch(() => null);
      if (d) setDetail((x) => ({ ...x, [id]: d }));
    }
  };

  if (!orders) return <Spinner full />;

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold">Mis pedidos</h1>
      <div className="mt-6 space-y-3">
        {!orders.length && <EmptyState icon={Package} title="Aún no tienes pedidos" action={<Link to="/catalogo" className="btn-primary">Comprar ahora</Link>} />}
        {orders.map((o) => (
          <div key={o.id_pedido} className="card animate-fade-up overflow-hidden">
            <button onClick={() => toggle(o.id_pedido)} className="flex w-full flex-wrap items-center gap-4 p-5 text-left">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-neon-violet/15 text-neon-violet"><Package className="h-5 w-5" /></span>
              <div className="flex-1">
                <p className="font-semibold text-white">Pedido #{o.id_pedido}</p>
                <p className="text-xs text-slate-400">{date(o.fecha_pedido)}</p>
              </div>
              <span className={`badge ${ORDER_STATES[o.estado].cls}`}>{ORDER_STATES[o.estado].label}</span>
              <p className="font-bold text-white">{money(o.total)}</p>
              <ChevronDown className={`h-5 w-5 text-slate-400 transition ${open === o.id_pedido ? 'rotate-180' : ''}`} />
            </button>
            {open === o.id_pedido && (
              <div className="animate-fade-up space-y-4 border-t border-white/5 p-5">
                <OrderTimeline estado={o.estado} />
                <p className="text-sm text-slate-400">Envío a: <span className="text-slate-200">{o.direccion_envio}</span></p>
                {detail[o.id_pedido]?.items.map((i) => (
                  <div key={i.id_detalle_pedido} className="flex items-center gap-3 text-sm">
                    <img src={i.imagen_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="flex-1">{i.nombre} × {i.cantidad}</span>
                    <span className="font-semibold">{money(i.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
