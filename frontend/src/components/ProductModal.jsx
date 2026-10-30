import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react';
import Modal from './Modal';
import StockBadge from './StockBadge';
import { money } from '../lib/format';

/** Ventana con la ficha del producto: descripción, garantía y selección de cantidad antes de agregar. */
export default function ProductModal({ product, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setQty(1); }, [product?.id_producto]);
  if (!product) return null;

  const max = Math.max(1, product.stock);
  const confirm = async () => {
    setBusy(true);
    await onConfirm(product, qty);
    setBusy(false);
  };

  return (
    <Modal wide open title={product.nombre} onClose={onClose}>
      <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <img src={product.imagen_url} alt={product.nombre} className="aspect-square w-full rounded-2xl border border-white/10 object-cover" />
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-neon-cyan">{product.categoria}{product.marca ? ` · ${product.marca}` : ''}</p>
          <StockBadge product={product} />
          <p className="text-3xl font-bold text-white">{money(product.precio)}</p>
          <p className="text-sm leading-relaxed text-slate-300">{product.descripcion}</p>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-neon-cyan" /> Envío en 1 a 6 días hábiles (gratis desde {money(300000)})</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-neon-cyan" /> Garantía de 12 meses</li>
            <li className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-neon-cyan" /> Cambios y devoluciones según política de la tienda</li>
            <li className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-neon-cyan" /> Pago con tarjeta, PSE o Nequi</li>
          </ul>
          <Link to={`/producto/${product.id_producto}`} onClick={onClose} className="inline-block text-xs text-neon-cyan hover:underline">Ver página completa del producto</Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
        <div>
          <p className="label !mb-1">Cantidad</p>
          <div className="flex items-center rounded-xl border border-white/10 bg-ink-800">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:text-neon-cyan" aria-label="Menos"><Minus className="h-4 w-4" /></button>
            <span className="w-10 text-center font-semibold">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} className="p-3 hover:text-neon-cyan disabled:opacity-30" aria-label="Más"><Plus className="h-4 w-4" /></button>
          </div>
          <p className="mt-1 text-xs text-slate-500">{product.stock} disponibles</p>
        </div>
        <div className="flex-1 text-right sm:flex-none">
          <p className="text-xs text-slate-400">Subtotal</p>
          <p className="text-2xl font-bold text-white">{money(product.precio * qty)}</p>
          <button onClick={confirm} disabled={busy || product.stock <= 0} className="btn-primary mt-3 w-full py-3 sm:w-auto">
            <ShoppingCart className="h-4 w-4" /> {busy ? 'Agregando…' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
