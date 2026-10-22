import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import StockBadge from './StockBadge';
import { money } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ProductCard({ product, index = 0 }) {
  const { add } = useCart();
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const agotado = product.stock <= 0;

  const handleAdd = () => {
    if (!user) { notify('Inicia sesión para comprar', 'info'); return navigate('/login'); }
    if (user.rol !== 'Cliente') return notify('Solo los clientes pueden usar el carrito', 'info');
    add(product);
  };

  return (
    <article
      style={{ animationDelay: `${index * 60}ms` }}
      className="group relative flex animate-fade-up flex-col overflow-hidden rounded-2xl border border-white/5 bg-ink-900/80 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-neon-violet/40 hover:shadow-glow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        <img
          src={product.imagen_url || 'https://placehold.co/600x450/121527/8b5cf6?text=FEATURE+TECH'}
          alt={product.nombre}
          loading="lazy"
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-110 ${agotado ? 'grayscale' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
        <StockBadge product={product} className="absolute left-3 top-3" />
        <Link
          to={`/producto/${product.id_producto}`}
          className="absolute right-3 top-3 grid h-9 w-9 translate-y-[-8px] place-items-center rounded-full bg-ink-950/70 text-white opacity-0 backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100"
          aria-label={`Ver ${product.nombre}`}
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-neon-cyan/80">{product.categoria}</span>
        <Link to={`/producto/${product.id_producto}`} className="line-clamp-2 font-display font-semibold text-white hover:text-neon-cyan">
          {product.nombre}
        </Link>
        <p className="line-clamp-2 text-sm text-slate-400">{product.descripcion}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="text-xl font-bold text-white">{money(product.precio)}</p>
            <p className="text-xs text-slate-500">{product.stock} disponibles</p>
          </div>
          <button onClick={handleAdd} disabled={agotado} className="btn-primary !px-3" aria-label="Agregar al carrito">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-ink-900/80">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-8 w-1/2" />
      </div>
    </div>
  );
}
