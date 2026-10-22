import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Pencil, Trash2, Ban, CheckCircle2, Search } from 'lucide-react';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { PageHeader } from './PanelLayout';
import { api } from '../../lib/api';
import { date, ROLE_STYLES } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ROLES = ['Cliente', 'Empleado', 'Administrador'];
const EMPTY = { nombre: '', correo: '', contrasena: '', rol: 'Cliente', telefono: '', direccion: '' };

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const notify = useToast();
  const [users, setUsers] = useState(null);
  const [filters, setFilters] = useState({ q: '', rol: '', estado: '' });
  const [editing, setEditing] = useState(null); // null | 'new' | usuario
  const [form, setForm] = useState(EMPTY);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(() => api('/users', { params: filters }).then(setUsers).catch((e) => notify(e.message, 'error')), [filters, notify]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const openNew = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (u) => { setForm({ ...EMPTY, ...u, telefono: u.telefono || '', direccion: u.direccion || '', contrasena: '' }); setEditing(u); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') {
        await api('/users', { method: 'POST', body: form });
        notify('Usuario creado');
      } else {
        const { nombre, correo, telefono, direccion, rol, contrasena } = form;
        await api(`/users/${editing.id_usuario}`, { method: 'PUT', body: { nombre, correo, telefono, direccion, rol, ...(contrasena ? { contrasena } : {}) } });
        notify('Usuario actualizado');
      }
      setEditing(null);
      load();
    } catch (err) { notify(err.message, 'error'); }
  };

  const changeRole = async (u, rol) => {
    try { await api(`/users/${u.id_usuario}/rol`, { method: 'PATCH', body: { rol } }); notify(`${u.nombre} ahora es ${rol}`); load(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const toggleState = async (u) => {
    const estado = u.estado === 'activo' ? 'suspendido' : 'activo';
    try { await api(`/users/${u.id_usuario}/estado`, { method: 'PATCH', body: { estado } }); notify(estado === 'activo' ? 'Cuenta reactivada' : 'Cuenta suspendida'); load(); }
    catch (err) { notify(err.message, 'error'); }
  };
  const remove = async () => {
    try { await api(`/users/${confirmDel.id_usuario}`, { method: 'DELETE' }); notify('Usuario eliminado'); setConfirmDel(null); load(); }
    catch (err) { notify(err.message, 'error'); setConfirmDel(null); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Gestión de usuarios" subtitle="Crea, edita, asigna roles y suspende cuentas"
        action={<button onClick={openNew} className="btn-primary"><UserPlus className="h-4 w-4" /> Nuevo usuario</button>} />

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Buscar por nombre o correo" className="input pl-9" />
        </label>
        <select value={filters.rol} onChange={(e) => setFilters({ ...filters, rol: e.target.value })} className="input">
          <option value="">Todos los roles</option>{ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })} className="input">
          <option value="">Todos los estados</option><option value="activo">Activos</option><option value="suspendido">Suspendidos</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        {!users ? <div className="p-10"><Spinner full /></div> : (
          <table className="table-app">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Acceso</th><th>Registro</th><th className="text-right">Acciones</th></tr></thead>
            <tbody>
              {users.map((u) => {
                const self = u.id_usuario === me.id_usuario;
                return (
                  <tr key={u.id_usuario}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
                          : <span className="grid h-8 w-8 place-items-center rounded-full bg-neon-violet/25 text-xs font-bold">{u.nombre[0]}</span>}
                        <div><p className="font-medium text-white">{u.nombre} {self && <span className="text-xs text-neon-cyan">(tú)</span>}</p><p className="text-xs text-slate-400">{u.correo}</p></div>
                      </div>
                    </td>
                    <td>
                      <select value={u.rol} disabled={self} onChange={(e) => changeRole(u, e.target.value)}
                        className={`badge cursor-pointer border-0 bg-transparent pr-6 ${ROLE_STYLES[u.rol]} disabled:cursor-default`}>
                        {ROLES.map((r) => <option key={r} className="bg-ink-900 text-white">{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.estado === 'activo' ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30' : 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30'}`}>{u.estado}</span>
                    </td>
                    <td className="text-xs text-slate-400">{[u.tiene_contrasena && 'Correo', u.tiene_google && 'Google'].filter(Boolean).join(' + ')}</td>
                    <td className="text-xs text-slate-400">{date(u.fecha_registro)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Editar"><Pencil className="h-4 w-4" /></button>
                        {!self && (
                          <>
                            <button onClick={() => toggleState(u)} className="rounded-lg p-2 text-slate-400 hover:bg-amber-500/10 hover:text-amber-300" title={u.estado === 'activo' ? 'Suspender' : 'Activar'}>
                              {u.estado === 'activo' ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <button onClick={() => setConfirmDel(u)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo usuario' : 'Editar usuario'}>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Nombre</label><input required value={form.nombre} onChange={set('nombre')} className="input" /></div>
          <div><label className="label">Correo</label><input type="email" required value={form.correo} onChange={set('correo')} className="input" /></div>
          <div>
            <label className="label">{editing === 'new' ? 'Contraseña' : 'Nueva contraseña (opcional)'}</label>
            <input type="password" minLength={8} required={editing === 'new'} value={form.contrasena} onChange={set('contrasena')} className="input" autoComplete="new-password" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Rol</label>
              <select value={form.rol} onChange={set('rol')} disabled={editing !== 'new' && editing?.id_usuario === me.id_usuario} className="input">{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
            </div>
            <div><label className="label">Teléfono</label><input value={form.telefono} onChange={set('telefono')} className="input" /></div>
          </div>
          <div><label className="label">Dirección</label><input value={form.direccion} onChange={set('direccion')} className="input" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancelar</button>
            <button className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(confirmDel)} onClose={() => setConfirmDel(null)} title="Eliminar usuario">
        <p className="text-sm text-slate-300">¿Seguro que deseas eliminar a <b className="text-white">{confirmDel?.nombre}</b>? Esta acción no se puede deshacer. Si tiene pedidos, suspende la cuenta en su lugar.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setConfirmDel(null)} className="btn-ghost">Cancelar</button>
          <button onClick={remove} className="btn-danger"><Trash2 className="h-4 w-4" /> Eliminar</button>
        </div>
      </Modal>
    </>
  );
}
