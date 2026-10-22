export const money = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export const date = (d) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const ORDER_STATES = {
  pendiente: { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30' },
  pagado: { label: 'Pagado', cls: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30' },
  enviado: { label: 'Enviado', cls: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30' },
  entregado: { label: 'Entregado', cls: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30' },
  cancelado: { label: 'Cancelado', cls: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30' },
};

export const SUPPORT_STATES = {
  abierto: { label: 'Abierto', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30' },
  en_proceso: { label: 'En proceso', cls: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30' },
  cerrado: { label: 'Cerrado', cls: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/30' },
};

export const ROLE_STYLES = {
  Administrador: 'bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-400/30',
  Empleado: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30',
  Cliente: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/30',
};
