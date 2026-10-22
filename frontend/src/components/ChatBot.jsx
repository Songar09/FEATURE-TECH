import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Send, X, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { money } from '../lib/format';

/** Convierte **negritas** y saltos de línea en elementos React (sin dangerouslySetInnerHTML) */
function RichText({ text }) {
  return text.split('\n').map((line, i) => (
    <p key={i} className={i ? 'mt-1' : ''}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') ? <strong key={j} className="text-white">{part.slice(2, -2)}</strong> : part
      )}
    </p>
  ));
}

const WELCOME = {
  from: 'bot',
  text: '¡Hola! 👋 Soy **Tecky**, tu asistente virtual. Pregúntame por envíos, el estado de tu pedido o cualquier producto.',
  sugerencias: ['¿Cuánto tarda el envío?', '¿Cuál es el estado de mi pedido?', '¿Qué laptops tienen?'],
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing, open]);

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || typing) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text: msg }]);
    setTyping(true);
    try {
      const r = await api('/chatbot', { method: 'POST', body: { mensaje: msg } });
      await new Promise((res) => setTimeout(res, 450)); // pequeña pausa para un efecto "escribiendo"
      setMessages((m) => [...m, { from: 'bot', text: r.respuesta, sugerencias: r.sugerencias, productos: r.productos }]);
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: `Ups, ${e.message.toLowerCase()}. Intenta de nuevo.` }]);
    } finally {
      setTyping(false);
    }
  };

  const last = messages[messages.length - 1];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-neon-cyan via-neon-violet to-neon-pink text-white shadow-glow transition hover:scale-110"
      >
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-neon-violet/40" />}
        {open ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
      </button>

      <div className={`fixed bottom-24 right-3 z-50 flex h-[min(560px,75vh)] w-[calc(100vw-1.5rem)] max-w-sm origin-bottom-right flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-900/95 shadow-glow backdrop-blur-xl transition-all duration-300 sm:right-5 ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'}`}>
        <div className="flex items-center gap-3 border-b border-white/5 bg-gradient-to-r from-neon-violet/20 to-neon-cyan/10 px-4 py-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet text-ink-950">
            <Bot className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-ink-900" />
          </span>
          <div>
            <p className="font-display font-semibold text-white">Tecky</p>
            <p className="flex items-center gap-1 text-xs text-slate-400"><Sparkles className="h-3 w-3 text-neon-cyan" /> Asistente FEATURE TECH</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex animate-fade-up ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.from === 'user' ? 'rounded-br-md bg-gradient-to-r from-neon-blue to-neon-violet text-white' : 'rounded-bl-md bg-ink-800 text-slate-300'}`}>
                <RichText text={m.text} />
                {m.productos?.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {m.productos.map((p) => (
                      <Link key={p.id_producto} to={`/producto/${p.id_producto}`} onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-xl bg-ink-900/80 p-1.5 transition hover:bg-ink-700">
                        <img src={p.imagen_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        <span className="flex-1 truncate text-xs text-white">{p.nombre}</span>
                        <span className="text-xs font-semibold text-neon-cyan">{money(p.precio)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-ink-800 px-4 py-3 w-fit">
              {[0, 150, 300].map((d) => <span key={d} style={{ animationDelay: `${d}ms` }} className="h-2 w-2 animate-bounce rounded-full bg-neon-violet" />)}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {last.from === 'bot' && last.sugerencias && !typing && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-2">
            {last.sugerencias.map((s) => (
              <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-neon-violet/30 bg-neon-violet/10 px-3 py-1.5 text-xs text-violet-200 transition hover:bg-neon-violet/25">{s}</button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-white/5 p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta…" className="input !rounded-full" maxLength={500} />
          <button type="submit" disabled={!input.trim() || typing} className="btn-primary !rounded-full !p-3" aria-label="Enviar"><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </>
  );
}
