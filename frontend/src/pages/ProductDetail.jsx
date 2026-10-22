import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';
import StockBadge from '../components/StockBadge';
import Spinner, { EmptyState } from '../components/Spinner';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(undefined);
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();

  useEffect(() => { api(`/products/${id}`).then(setP).catch(() => setP(null)); }, [id]);

  if (p === undefined) return <Spinner full />;
  if (p === null) return <div className="container-app py-10"><EmptyState title="Producto no encontrado" action={<Link to="/catalogo" className="btn-primary">Volver al catálogo</Link>} /></div>;

  const handleAdd = () => {
    if (!user) { notify('Inicia sesión para comprar', 'info'); return navigate('/login', { state: { from: `/producto/${id}` } }); }
    if (user.rol !== 'Cliente') return notify('Solo los clientes pueden usar el carrito', 'info');
    add(p, qty);
  };

  return (
    <div className="container-app py-10">
      <Link to="/catalogo" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Volver</Link>
      <div className="grid animate-fade-up gap-10 md:grid-cols-2">
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-neon-violet/30 to-neon-cyan/20 blur-2xl" />
          <img src={p.imagen_url} alt={p.nombre} className="aspect-square w-full rounded-3xl border border-white/10 object-cover" />
        </div>
        <div>
          <span className="text-sm font-medium uppercase tracking-wider text-neon-cyan">{p.categoria} · {p.marca}</span>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{p.nombre}</h1>
          <div className="mt-4"><StockBadge product={p} /></div>
          <p className="mt-6 text-4xl font-bold text-white">{money(p.precio)}</p>
          <p className="mt-6 leading-relaxed text-slate-400">{p.descripcion}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-xl border border-white/10 bg-ink-800">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:text-neon-cyan" aria-label="Menos"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} className="p-3 hover:text-neon-cyan" aria-label="Más"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={handleAdd} disabled={p.stock <= 0} className="btn-primary flex-1 py-3 text-base">
              <ShoppingCart className="h-5 w-5" /> {p.stock > 0 ? 'Agregar al carrito' : 'Agotado'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{p.stock} unidades disponibles</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="card flex items-center gap-3 p-4"><Truck className="h-5 w-5 text-neon-cyan" /><span className="text-sm">Envío en 1–6 días hábiles</span></div>
            <div className="card flex items-center gap-3 p-4"><ShieldCheck className="h-5 w-5 text-neon-cyan" /><span className="text-sm">Garantía de 12 meses</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
