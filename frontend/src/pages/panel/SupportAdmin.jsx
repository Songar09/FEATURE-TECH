import { useCallback, useEffect, useState } from 'react';
import { MessageSquareReply, Lock, Inbox } from 'lucide-react';
import Spinner, { EmptyState } from '../../components/Spinner';
import { PageHeader } from './PanelLayout';
import { api } from '../../lib/api';
import { date, SUPPORT_STATES } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

export default function SupportAdmin() {
  const notify = useToast();
  const [tickets, setTickets] = useState(null);
  const [estado, setEstado] = useState('');
  const [replies, setReplies] = useState({});

  const load = useCallback(() => api('/support', { params: { estado } }).then(setTickets).catch((e) => notify(e.message, 'error')), [estado, notify]);
  useEffect(() => { load(); }, [load]);

  const reply = async (t, cerrar) => {
    try {
      await api(`/support/${t.id_soporte}/responder`, { method: 'PATCH', body: { respuesta: replies[t.id_soporte], cerrar } });
      notify(cerrar ? 'Respondida y cerrada' : 'Respuesta enviada');
      setReplies(({ [t.id_soporte]: _, ...r }) => r);
      load();
    } catch (err) { notify(err.message, 'error'); }
  };
  const close = async (t) => {
    try { await api(`/support/${t.id_soporte}/cerrar`, { method: 'PATCH' }); notify('Solicitud cerrada'); load(); }
    catch (err) { notify(err.message, 'error'); }
  };

  return (
    <>
      <PageHeader title="Solicitudes de soporte" subtitle="Responde y cierra las solicitudes de los clientes" />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {['', ...Object.keys(SUPPORT_STATES)].map((s) => (
          <button key={s || 'todas'} onClick={() => setEstado(s)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${estado === s ? 'bg-gradient-to-r from-neon-cyan to-neon-violet font-semibold text-ink-950' : 'border border-white/10 bg-white/5 text-slate-300 hover:border-neon-violet/40'}`}>
            {s ? SUPPORT_STATES[s].label : 'Todas'}
          </button>
        ))}
      </div>

      {!tickets ? <Spinner full /> : !tickets.length ? <EmptyState icon={Inbox} title="Bandeja vacía" text="No hay solicitudes con este filtro." /> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {tickets.map((t) => (
            <div key={t.id_soporte} className="card flex animate-fade-up flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-neon-cyan">#{t.id_soporte}</span>
                <h3 className="flex-1 font-semibold">{t.asunto}</h3>
                <span className={`badge ${SUPPORT_STATES[t.estado].cls}`}>{SUPPORT_STATES[t.estado].label}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{t.cliente} · {t.correo_cliente} · {date(t.fecha_creacion)}{t.id_pedido && ` · Pedido #${t.id_pedido}`}</p>
              <p className="mt-3 text-sm text-slate-300">{t.mensaje}</p>

              {t.respuesta && (
                <div className="mt-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold text-neon-cyan">Respuesta de {t.empleado || 'soporte'}</p>
                  {t.respuesta}
                </div>
              )}

              {t.estado !== 'cerrado' && (
                <div className="mt-4 space-y-2">
                  <textarea rows={2} value={replies[t.id_soporte] || ''} onChange={(e) => setReplies({ ...replies, [t.id_soporte]: e.target.value })}
                    placeholder="Escribe una respuesta…" className="input resize-none" />
                  <div className="flex flex-wrap justify-end gap-2">
                    <button onClick={() => close(t)} className="btn-ghost !py-2"><Lock className="h-4 w-4" /> Cerrar</button>
                    <button disabled={!replies[t.id_soporte]?.trim()} onClick={() => reply(t, false)} className="btn-ghost !py-2"><MessageSquareReply className="h-4 w-4" /> Responder</button>
                    <button disabled={!replies[t.id_soporte]?.trim()} onClick={() => reply(t, true)} className="btn-primary !py-2">Responder y cerrar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
