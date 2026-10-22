import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`group flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet shadow-glow transition group-hover:rotate-6">
        <Zap className="h-5 w-5 text-ink-950" strokeWidth={2.5} />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        FEATURE<span className="text-gradient"> TECH</span>
      </span>
    </Link>
  );
}
