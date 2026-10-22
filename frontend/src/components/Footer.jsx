import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-ink-950/60">
      <div className="container-app grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-slate-400">Tecnología que te impulsa. Laptops, smartphones, audio y gaming con garantía y envío a todo el país.</p>
        </div>
        {[
          ['Tienda', ['Laptops', 'Smartphones', 'Audio', 'Gaming']],
          ['Ayuda', ['Envíos', 'Garantías', 'Métodos de pago', 'Soporte']],
          ['Contacto', ['soporte@featuretech.co', 'Lun a Sáb · 8:00 – 18:00', 'Bogotá, Colombia']],
        ].map(([t, items]) => (
          <div key={t}>
            <h4 className="mb-3 text-sm font-semibold">{t}</h4>
            <ul className="space-y-2 text-sm text-slate-400">{items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
      <p className="border-t border-white/5 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} FEATURE TECH · Prototipo académico</p>
    </footer>
  );
}
