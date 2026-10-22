import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, MapPin, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../components/Spinner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { money } from '../lib/format';

const ENVIO_GRATIS = 300000;
const COSTO_ENVIO = 15000;

export default function Cart() {
  const { cart, update, remove, refresh } = useCart();
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [direccion, setDireccion] = useState(user?.direccion || '');
  const [placing, setPlacing] = useState(false);
  const [problemas, setProblemas] = useState([]);

  if (!cart.items.length) {
    return (
      <div className="container-app py-10">
        <EmptyState icon={ShoppingBag} title="Tu carrito está vacío" text="Agrega productos desde el catálogo para comenzar tu compra."
          action={<Link to="/catalogo" className="btn-primary mt-2">Ir al catálogo</Link>} />
      </div>
    );
  }

  const envio = cart.total >= ENVIO_GRATIS ? 0 : COSTO_ENVIO;
  const progreso = Math.min(100, (cart.total / ENVIO_GRATIS) * 100);

  const checkout = async (e) => {
    e.preventDefault();
    setPlacing(true);
    setProblemas([]);
    try {
      const pedido = await api('/orders', { method: 'POST', body: { direccion_envio: direccion } });
      await refresh();
      notify(`Pedido #${pedido.id_pedido} registrado con éxito 🎉`);
      navigate('/mis-pedidos');
    } catch (err) {
      notify(err.message, 'error');
      if (err.details) setProblemas(err.details);
      refresh();
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold">Tu carrito</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {cart.items.map((i) => {
            const issue = problemas.find((p) => p.id_producto === i.id_producto);
            return (
              <div key={i.id_producto} className={`card flex animate-fade-up gap-4 p-4 ${issue ? 'border-rose-400/40' : ''}`}>
                <img src={i.imagen_url} alt={i.nombre} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/producto/${i.id_producto}`} className="font-semibold text-white hover:text-neon-cyan">{i.nombre}</Link>
                    <button onClick={() => remove(i.id_producto)} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300" aria-label="Retirar"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <p className="text-sm text-slate-400">{money(i.precio)} c/u · {i.stock} disponibles</p>
                  {issue && <p className="mt-1 text-xs text-rose-300">Solo hay {issue.disponible} unidades disponibles</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-xl border border-white/10 bg-ink-800">
                      <button onClick={() => i.cantidad > 1 && update(i.id_producto, i.cantidad - 1)} className="p-2 hover:text-neon-cyan" aria-label="Menos"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-8 text-center text-sm font-semibold">{i.cantidad}</span>
                      <button onClick={() => update(i.id_producto, i.cantidad + 1)} disabled={i.cantidad >= i.stock} className="p-2 hover:text-neon-cyan disabled:opacity-30" aria-label="Más"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="font-bold text-white">{money(i.subtotal)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={checkout} className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <div className="rounded-xl bg-ink-800 p-3">
            <p className="text-xs text-slate-400">
              {envio === 0 ? <span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> ¡Tienes envío gratis!</span>
                : <>Te faltan <b className="text-white">{money(ENVIO_GRATIS - cart.total)}</b> para envío gratis</>}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet transition-all duration-500" style={{ width: `${progreso}%` }} />
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Subtotal ({cart.cantidad_total} artículos)</dt><dd>{money(cart.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Envío (estimado)</dt><dd>{envio ? money(envio) : 'Gratis'}</dd></div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold text-white"><dt>Total</dt><dd>{money(cart.total + envio)}</dd></div>
          </dl>
          <div>
            <label className="label flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Dirección de envío</label>
            <textarea required rows={2} value={direccion} onChange={(e) => setDireccion(e.target.value)} className="input resize-none" placeholder="Calle, número, ciudad" />
          </div>
          <button disabled={placing} className="btn-primary w-full py-3">{placing ? 'Validando stock…' : 'Confirmar pedido'}</button>
          <p className="text-center text-xs text-slate-500">El stock se valida automáticamente antes de confirmar.</p>
        </form>
      </div>
    </div>
  );
}
