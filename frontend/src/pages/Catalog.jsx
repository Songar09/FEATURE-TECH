import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageSearch } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import { EmptyState } from '../components/Spinner';
import { api } from '../lib/api';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState(null);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState(params.get('q') || '');
  const categoria = params.get('categoria') || '';
  const orden = params.get('orden') || '';
  const disponibles = params.get('disponibles') === '1';

  useEffect(() => { api('/products/categorias').then(setCats).catch(() => {}); }, []);
  useEffect(() => { setQ(params.get('q') || ''); }, [params]);

  useEffect(() => {
    setProducts(null);
    const t = setTimeout(() => {
      api('/products', { params: { q: params.get('q') || '', categoria, orden } })
        .then(setProducts).catch(() => setProducts([]));
    }, 150);
    return () => clearTimeout(t);
  }, [params, categoria, orden]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next);
  };

  const list = products?.filter((p) => !disponibles || p.stock > 0);

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Catálogo</h1>
      <p className="mt-1 text-slate-400">Encuentra el dispositivo perfecto para ti.</p>

      <div className="card mt-6 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <form onSubmit={(e) => { e.preventDefault(); setParam('q', q); }} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => setParam('q', q)} placeholder="Buscar por nombre, marca o descripción" className="input pl-9" />
        </form>
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="hidden h-4 w-4 text-slate-500 md:block" />
          <select value={orden} onChange={(e) => setParam('orden', e.target.value)} className="input !w-auto">
            <option value="">Más recientes</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre A–Z</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={disponibles} onChange={(e) => setParam('disponibles', e.target.checked ? '1' : '')} className="h-4 w-4 accent-violet-500" />
            Solo disponibles
          </label>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {['', ...cats].map((c) => (
          <button key={c || 'todas'} onClick={() => setParam('categoria', c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${categoria === c ? 'bg-gradient-to-r from-neon-cyan to-neon-violet text-ink-950' : 'border border-white/10 bg-white/5 text-slate-300 hover:border-neon-violet/40'}`}>
            {c || 'Todas'}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list === undefined && Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        {list?.map((p, i) => <ProductCard key={p.id_producto} product={p} index={i} />)}
      </div>
      {list?.length === 0 && (
        <EmptyState icon={PackageSearch} title="Sin resultados" text="No encontramos productos con esos filtros. Prueba con otra búsqueda." />
      )}
    </div>
  );
}
