import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Power, Search, Save } from 'lucide-react';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import StockBadge from '../../components/StockBadge';
import { PageHeader } from './PanelLayout';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EMPTY = { nombre: '', descripcion: '', categoria: '', marca: '', precio: '', stock: 0, stock_minimo: 5, imagen_url: '', activo: true };

export default function Inventory() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('Administrador');
  const notify = useToast();
  const [products, setProducts] = useState(null);
  const [q, setQ] = useState('');
  const [stockEdits, setStockEdits] = useState({});
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(() => api('/products', { params: { todos: '1', q } }).then(setProducts).catch((e) => notify(e.message, 'error')), [q, notify]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const saveStock = async (p) => {
    try {
      await api(`/products/${p.id_producto}/stock`, { method: 'PATCH', body: { stock: Number(stockEdits[p.id_producto]) } });
      notify(`Stock de ${p.nombre} actualizado`);
      setStockEdits(({ [p.id_producto]: _, ...rest }) => rest);
      load();
    } catch (err) { notify(err.message, 'error'); }
  };

  const toggleActive = async (p) => {
    try { await api(`/products/${p.id_producto}/activo`, { method: 'PATCH', body: { activo: !p.activo } }); notify(p.activo ? 'Producto desactivado' : 'Producto activado'); load(); }
    catch (err) { notify(err.message, 'error'); }
  };

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, precio: Number(form.precio), stock: Number(form.stock), stock_minimo: Number(form.stock_minimo) };
    try {
      if (editing === 'new') await api('/products', { method: 'POST', body });
      else await api(`/products/${editing.id_producto}`, { method: 'PUT', body });
      notify(editing === 'new' ? 'Producto creado' : 'Producto actualizado');
      setEditing(null);
      load();
    } catch (err) { notify(err.message, 'error'); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <>
      <PageHeader title="Inventario y catálogo" subtitle={isAdmin ? 'Crea, edita, activa o desactiva productos y ajusta existencias' : 'Consulta el catálogo y actualiza existencias'}
        action={isAdmin && <button onClick={() => { setForm(EMPTY); setEditing('new'); }} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo producto</button>} />

      <label className="relative mb-4 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto" className="input pl-9" />
      </label>

      <div className="card overflow-x-auto">
        {!products ? <div className="p-10"><Spinner full /></div> : (
          <table className="table-app">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Stock</th><th className="text-right">Acciones</th></tr></thead>
            <tbody>
              {products.map((p) => {
                const draft = stockEdits[p.id_producto];
                return (
                  <tr key={p.id_producto} className={p.activo ? '' : 'opacity-50'}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={p.imagen_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div><p className="font-medium text-white">{p.nombre}</p><p className="text-xs text-slate-400">{p.marca}{!p.activo && ' · Inactivo'}</p></div>
                      </div>
                    </td>
                    <td className="text-slate-400">{p.categoria}</td>
                    <td>{money(p.precio)}</td>
                    <td><StockBadge product={p} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input type="number" min={0} value={draft ?? p.stock}
                          onChange={(e) => setStockEdits({ ...stockEdits, [p.id_producto]: e.target.value })}
                          className="input !w-20 !py-1.5 text-center" aria-label={`Stock de ${p.nombre}`} />
                        {draft !== undefined && Number(draft) !== p.stock && (
                          <button onClick={() => saveStock(p)} className="btn-primary !p-2" title="Guardar stock"><Save className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                    <td>
                      {isAdmin && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setForm({ ...EMPTY, ...p, marca: p.marca || '', descripcion: p.descripcion || '', imagen_url: p.imagen_url || '' }); setEditing(p); }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Editar"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => toggleActive(p)} className={`rounded-lg p-2 hover:bg-white/10 ${p.activo ? 'text-emerald-300' : 'text-slate-500'}`} title={p.activo ? 'Desactivar' : 'Activar'}>
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal wide open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo producto' : 'Editar producto'}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Nombre</label><input required value={form.nombre} onChange={set('nombre')} className="input" /></div>
          <div><label className="label">Categoría</label><input required value={form.categoria} onChange={set('categoria')} className="input" list="cats" />
            <datalist id="cats">{['Laptops', 'Smartphones', 'Audio', 'Wearables', 'Monitores', 'Accesorios', 'Tablets', 'Gaming'].map((c) => <option key={c} value={c} />)}</datalist></div>
          <div><label className="label">Marca</label><input value={form.marca} onChange={set('marca')} className="input" /></div>
          <div><label className="label">Precio (COP)</label><input type="number" min={0} required value={form.precio} onChange={set('precio')} className="input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Stock</label><input type="number" min={0} value={form.stock} onChange={set('stock')} className="input" /></div>
            <div><label className="label">Mínimo</label><input type="number" min={0} value={form.stock_minimo} onChange={set('stock_minimo')} className="input" /></div>
          </div>
          <div className="sm:col-span-2"><label className="label">URL de imagen</label><input type="url" value={form.imagen_url} onChange={set('imagen_url')} className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Descripción</label><textarea rows={3} value={form.descripcion} onChange={set('descripcion')} className="input resize-none" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.activo} onChange={set('activo')} className="h-4 w-4 accent-violet-500" /> Visible en el catálogo</label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancelar</button>
            <button className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
