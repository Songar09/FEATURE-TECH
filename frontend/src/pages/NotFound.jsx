import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-app grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="font-display text-8xl font-bold text-gradient">404</p>
        <p className="mt-2 text-slate-400">Esta página no existe.</p>
        <Link to="/" className="btn-primary mt-6">Ir al inicio</Link>
      </div>
    </div>
  );
}
