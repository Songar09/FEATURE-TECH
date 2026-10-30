/**
 * Pasarela de pagos (modo SANDBOX / simulado).
 *
 * No mueve dinero real ni guarda datos de tarjeta: valida el formato, simula la
 * respuesta del proveedor y devuelve solo una referencia y los últimos 4 dígitos.
 * Está aislada para reemplazarla por Wompi, Mercado Pago o Stripe: basta con
 * implementar `procesarPago` con la misma firma.
 *
 * Tarjetas de prueba:
 *   4242 4242 4242 4242  → aprobada
 *   4000 0000 0000 0002  → rechazada
 */
import crypto from 'node:crypto';
import { HttpError } from '../utils/http.js';

export const METODOS = ['tarjeta', 'pse', 'nequi'];

const luhn = (num) => {
  let sum = 0;
  [...num].reverse().forEach((d, i) => {
    let n = Number(d);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  });
  return sum % 10 === 0;
};

const ref = () => `FT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

export async function procesarPago({ metodo, monto, tarjeta, telefono }) {
  if (!METODOS.includes(metodo)) throw new HttpError(400, 'Método de pago inválido');
  if (!(monto > 0)) throw new HttpError(400, 'Monto inválido');

  if (metodo === 'tarjeta') {
    const numero = String(tarjeta?.numero || '').replace(/\s+/g, '');
    const [mm, aa] = String(tarjeta?.vence || '').split('/').map((x) => Number(x));
    const cvv = String(tarjeta?.cvv || '');
    if (!/^\d{13,19}$/.test(numero) || !luhn(numero)) throw new HttpError(400, 'Número de tarjeta inválido');
    if (!(mm >= 1 && mm <= 12) || !(aa >= 0)) throw new HttpError(400, 'Fecha de vencimiento inválida (MM/AA)');
    const finMes = new Date(2000 + aa, mm, 1);
    if (finMes <= new Date()) throw new HttpError(400, 'La tarjeta está vencida');
    if (!/^\d{3,4}$/.test(cvv)) throw new HttpError(400, 'CVV inválido');
    if (!tarjeta?.titular?.trim()) throw new HttpError(400, 'El titular de la tarjeta es obligatorio');
    if (numero === '4000000000000002') throw new HttpError(402, 'Pago rechazado por el banco. Prueba con otra tarjeta.');
    return { referencia: ref(), ultimos4: numero.slice(-4) };
  }

  if (metodo === 'nequi' && !/^3\d{9}$/.test(String(telefono || '').replace(/\s+/g, ''))) {
    throw new HttpError(400, 'Ingresa un celular Nequi válido (10 dígitos que empiece por 3)');
  }
  return { referencia: ref(), ultimos4: null };
}
