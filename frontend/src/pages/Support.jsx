import { useEffect, useState } from 'react';
import { LifeBuoy, Send, MessageSquareReply } from 'lucide-react';
import { EmptyState } from '../components/Spinner';
import { api } from '../lib/api';
import { date, SUPPORT_STATES } from '../lib/format';
import { useToast } from '../context/ToastContext';

export default function Support() {
  const notify = useToast();
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ asunto: '', mensaje: '', id_pedido: '' });
  const [sending, setSending] = useState(false);

  const load = () => api('/support/mios').then(setTickets).catch(() => {});
  useEffect(() => {
    load();
    api('/orders/mis-pedidos').then(setOrders).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api('/support', { method: 'POST', body: { ...form, id_pedido: form.id_pedido || undefined } });
      notify('Solicitud enviada. Te responderemos pronto.');
      setForm({ asunto: '', mensaje: '', id_pedido: '' });
      load();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-app py-10">
      <h1 className="text-3xl font-bold">Centro de soporte</h1>
      <p className="mt-1 text-slate-400">¿Tienes un problema con un pedido o un producto? Escríbenos.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="card h-fit space-y-4 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><LifeBuoy className="h-5 w-5 text-neon-cyan" /> Nueva solicitud</h2>
          <div><label className="label">Asunto</label><input required maxLength={160} value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} className="input" /></div>
          <div>
            <label className="label">Pedido relacionado (opcional)</label>
            <select value={form.id_pedido} onChange={(e) => setForm({ ...form, id_pedido: e.target.value })} className="input">
              <option value="">Ninguno</option>
              {orders.map((o) => <option key={o.id_pedido} value={o.id_pedido}>Pedido #{o.id_pedido}</option>)}
            </select>
          </div>
          <div><label className="label">Mensaje</label><textarea required rows={5} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} className="input resize-none" /></div>
          <button disabled={sending} className="btn-primary w-full"><Send className="h-4 w-4" /> {sending ? 'Enviando…' : 'Enviar solicitud'}</button>
        </form>

        <div className="space-y-3">
          {!tickets.length && <EmptyState icon={LifeBuoy} title="Sin solicitudes" text="Aquí verás tus solicitudes y las respuestas de nuestro equipo." />}
          {tickets.map((t) => (
            <div key={t.id_soporte} className="card animate-fade-up p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="flex-1 font-semibold">{t.asunto}</h3>
                {t.id_pedido && <span className="text-xs text-slate-400">Pedido #{t.id_pedido}</span>}
                <span className={`badge ${SUPPORT_STATES[t.estado].cls}`}>{SUPPORT_STATES[t.estado].label}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{date(t.fecha_creacion)}</p>
              <p className="mt-3 text-sm text-slate-300">{t.mensaje}</p>
              {t.respuesta && (
                <div className="mt-4 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
                  <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neon-cyan"><MessageSquareReply className="h-4 w-4" /> Respuesta del equipo</p>
                  <p className="text-sm text-slate-200">{t.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
