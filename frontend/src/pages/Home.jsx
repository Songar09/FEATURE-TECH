import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Laptop, Smartphone, Headphones, Watch, Monitor, Keyboard, Tablet, Gamepad2, ArrowRight } from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { api } from '../lib/api';

const CAT_ICONS = { Laptops: Laptop, Smartphones: Smartphone, Audio: Headphones, Wearables: Watch, Monitores: Monitor, Accesorios: Keyboard, Tablets: Tablet, Gaming: Gamepad2 };

export default function Home() {
  const [products, setProducts] = useState(null);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    api('/products').then(setProducts).catch(() => setProducts([]));
    api('/products/categorias').then(setCats).catch(() => {});
  }, []);

  return (
    <>
      <HeroBanner />

      <section className="container-app mt-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Explora por categoría</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {cats.map((c, i) => {
            const Icon = CAT_ICONS[c] || Laptop;
            return (
              <Link key={c} to={`/catalogo?categoria=${encodeURIComponent(c)}`} style={{ animationDelay: `${i * 50}ms` }}
                className="card group flex animate-fade-up flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-1 hover:border-neon-cyan/40 hover:shadow-glow-cyan">
                <Icon className="h-7 w-7 text-neon-cyan transition group-hover:scale-110" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-white">{c}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-app mt-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Destacados</h2>
            <p className="mt-1 text-slate-400">Lo más nuevo en tecnología, listo para enviar.</p>
          </div>
          <Link to="/catalogo" className="hidden items-center gap-1 text-sm font-semibold text-neon-cyan hover:underline sm:flex">Ver todo <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products === null
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 8).map((p, i) => <ProductCard key={p.id_producto} product={p} index={i} />)}
        </div>
      </section>
    </>
  );
}
