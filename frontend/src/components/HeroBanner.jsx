import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';

const SLIDES = [
  {
    tag: 'Lanzamiento',
    title: 'Potencia sin límites',
    highlight: 'Laptops de nueva generación',
    text: 'Procesadores de última gama, pantallas de 144 Hz y hasta 12 cuotas sin interés.',
    img: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=1000',
    cta: { to: '/catalogo?categoria=Laptops', label: 'Ver laptops' },
  },
  {
    tag: 'Hasta -30%',
    title: 'Sonido que te envuelve',
    highlight: 'Audio premium',
    text: 'Audífonos con cancelación activa de ruido y 40 horas de batería.',
    img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1000',
    cta: { to: '/catalogo?categoria=Audio', label: 'Explorar audio' },
  },
  {
    tag: 'Gaming',
    title: 'Sube de nivel',
    highlight: 'Consolas y accesorios',
    text: 'Todo para tu setup: consolas, monitores 4K y periféricos RGB.',
    img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1000',
    cta: { to: '/catalogo?categoria=Gaming', label: 'Equipar mi setup' },
  },
];

export default function HeroBanner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const s = SLIDES[i];

  return (
    <section className="relative overflow-hidden">
      {/* Fondos animados */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-blob rounded-full bg-neon-violet/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 animate-blob rounded-full bg-neon-cyan/20 blur-3xl [animation-delay:-5s]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="container-app relative grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
        <div key={i} className="animate-fade-up">
          <span className="badge glass mb-5 text-neon-cyan"><Sparkles className="h-3.5 w-3.5" /> {s.tag}</span>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {s.title}<br /><span className="text-gradient">{s.highlight}</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-slate-400">{s.text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={s.cta.to} className="btn-primary px-6 py-3 text-base">{s.cta.label} <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/catalogo" className="btn-ghost px-6 py-3 text-base">Ver catálogo</Link>
          </div>
          <div className="mt-8 flex gap-2">
            {SLIDES.map((_, n) => (
              <button key={n} onClick={() => setI(n)} aria-label={`Promoción ${n + 1}`}
                className={`h-1.5 rounded-full transition-all ${n === i ? 'w-10 bg-gradient-to-r from-neon-cyan to-neon-violet' : 'w-4 bg-white/20 hover:bg-white/40'}`} />
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-neon-violet/40 to-neon-cyan/30 blur-2xl" />
          <img key={s.img} src={s.img} alt={s.highlight}
            className="aspect-[4/3] w-full animate-fade-up rounded-[2rem] border border-white/10 object-cover shadow-glow" />
          <div className="glass absolute -bottom-5 left-4 flex animate-float items-center gap-3 rounded-2xl px-4 py-3 sm:left-[-1.5rem]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300"><Truck className="h-5 w-5" /></span>
            <div><p className="text-sm font-semibold text-white">Envío gratis</p><p className="text-xs text-slate-400">Compras desde $300.000</p></div>
          </div>
        </div>
      </div>

      <div className="container-app relative grid gap-3 pb-6 sm:grid-cols-3">
        {[
          { Icon: Truck, t: 'Envíos a todo el país', d: '1 a 6 días hábiles' },
          { Icon: ShieldCheck, t: 'Garantía de 12 meses', d: 'En todos los productos' },
          { Icon: CreditCard, t: 'Pago seguro', d: 'Tarjetas, PSE y Nequi' },
        ].map(({ Icon, t, d }) => (
          <div key={t} className="card flex items-center gap-3 p-4">
            <Icon className="h-6 w-6 text-neon-cyan" />
            <div><p className="text-sm font-semibold text-white">{t}</p><p className="text-xs text-slate-400">{d}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
