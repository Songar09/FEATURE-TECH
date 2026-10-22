import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const MAP = {
  en_stock: { label: 'En Stock', Icon: CheckCircle2, cls: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30' },
  pocas_unidades: { label: 'Pocas Unidades', Icon: AlertTriangle, cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30 animate-pulse' },
  agotado: { label: 'Agotado', Icon: XCircle, cls: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30' },
};

export const stockStatus = (p) =>
  p.estado_stock || (p.stock <= 0 ? 'agotado' : p.stock <= p.stock_minimo ? 'pocas_unidades' : 'en_stock');

export default function StockBadge({ product, className = '' }) {
  const { label, Icon, cls } = MAP[stockStatus(product)];
  return (
    <span className={`badge ${cls} ${className}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}
