export default function Spinner({ full = false }) {
  const s = <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-neon-violet" />;
  return full ? <div className="grid min-h-[50vh] place-items-center">{s}</div> : s;
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      {Icon && <span className="grid h-14 w-14 place-items-center rounded-2xl bg-neon-violet/15 text-neon-violet"><Icon className="h-7 w-7" /></span>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="max-w-sm text-sm text-slate-400">{text}</p>}
      {action}
    </div>
  );
}
