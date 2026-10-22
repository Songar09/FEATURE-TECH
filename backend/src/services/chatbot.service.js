import { query } from '../config/db.js';

/**
 * Bot de preguntas frecuentes basado en reglas (intenciones por palabras clave).
 * No requiere servicios externos; puede sustituirse luego por un LLM manteniendo la misma ruta.
 */
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const money = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const ESTADO_TXT = {
  pendiente: 'pendiente de pago/confirmación ⏳',
  pagado: 'pagado y en preparación 📦',
  enviado: 'enviado, va en camino 🚚',
  entregado: 'entregado ✅',
  cancelado: 'cancelado ❌',
};

const SUGERENCIAS = ['¿Cuánto tarda el envío?', '¿Cuál es el estado de mi pedido?', '¿Qué laptops tienen?', 'Métodos de pago'];

const intents = [
  {
    name: 'saludo',
    match: /\b(hola|buenas|buenos dias|buenas tardes|hey|saludos)\b/,
    reply: () => ({ respuesta: '¡Hola! 👋 Soy **Tecky**, el asistente de FEATURE TECH. Puedo ayudarte con envíos, el estado de tus pedidos o información del catálogo.' }),
  },
  {
    name: 'estado_pedido',
    match: /(pedido|orden|compra|rastre|seguimiento|donde esta)/,
    reply: async (text, user) => {
      if (!user) return { respuesta: 'Para consultar tus pedidos necesito que inicies sesión 🔐. Luego pregúntame "estado de mi pedido" o "pedido #123".' };
      const idMatch = text.match(/#?\s*(\d{1,9})/);
      const params = [user.id_usuario];
      let sql = 'SELECT id_pedido, estado, total, fecha_pedido FROM Pedido WHERE id_usuario = $1';
      if (idMatch) { params.push(Number(idMatch[1])); sql += ' AND id_pedido = $2'; }
      sql += ' ORDER BY fecha_pedido DESC LIMIT 3';
      const { rows } = await query(sql, params);
      if (!rows.length) return { respuesta: idMatch ? `No encontré el pedido #${idMatch[1]} en tu cuenta.` : 'Aún no tienes pedidos registrados. ¡Explora el catálogo! 🛍️' };
      const lines = rows.map((p) => `• Pedido **#${p.id_pedido}** (${money(p.total)}): ${ESTADO_TXT[p.estado]}`);
      return { respuesta: `${idMatch ? 'Este es tu pedido:' : 'Tus pedidos más recientes:'}\n${lines.join('\n')}` };
    },
  },
  {
    name: 'envios',
    match: /(envio|envian|entrega|domicilio|despacho|cuanto tarda|demora|llega)/,
    reply: () => ({ respuesta: '🚚 **Envíos:** despachamos a todo el país. Ciudades principales: 1 a 3 días hábiles; otras zonas: 3 a 6 días hábiles. El envío es **gratis** en compras superiores a $300.000. Recibirás el número de guía cuando tu pedido pase a "enviado".' }),
  },
  {
    name: 'pagos',
    match: /(pago|pagar|tarjeta|pse|nequi|efectivo|cuotas)/,
    reply: () => ({ respuesta: '💳 Aceptamos tarjetas débito/crédito (hasta 36 cuotas), PSE, Nequi y pago contra entrega en ciudades seleccionadas.' }),
  },
  {
    name: 'garantia',
    match: /(garantia|devolu|reembolso|cambio|defect)/,
    reply: () => ({ respuesta: '🛡️ Todos los productos tienen **garantía mínima de 12 meses**. Tienes 5 días hábiles para retracto y devolución. Abre una solicitud en la sección **Soporte** indicando tu número de pedido.' }),
  },
  {
    name: 'soporte',
    match: /(soporte|ayuda|asesor|humano|agente|contacto|queja|reclamo)/,
    reply: () => ({ respuesta: '🎧 Puedes crear una solicitud en la sección **Soporte**; un empleado te responderá en menos de 24 horas. Horario: lunes a sábado, 8:00 a.m. – 6:00 p.m.' }),
  },
  {
    name: 'categorias',
    match: /(categoria|que venden|que productos|catalogo)/,
    reply: async () => {
      const { rows } = await query('SELECT categoria, COUNT(*)::int AS n FROM Producto WHERE activo GROUP BY categoria ORDER BY categoria');
      return { respuesta: `📂 Nuestras categorías: ${rows.map((r) => `${r.categoria} (${r.n})`).join(', ')}. ¿Buscas algo en particular?` };
    },
  },
];

/** Búsqueda en el catálogo con las palabras significativas del mensaje */
async function catalogSearch(text) {
  const stop = new Set(['que', 'tienen', 'tiene', 'hay', 'busco', 'quiero', 'precio', 'cuanto', 'cuesta', 'vale', 'los', 'las', 'una', 'uno', 'unos', 'del', 'para', 'con', 'por', 'me', 'de', 'el', 'la', 'un', 'y', 'en', 'disponible', 'disponibles', 'stock']);
  const words = text.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !stop.has(w));
  if (!words.length) return null;
  // Singulariza de forma simple ("laptops" → "laptop")
  const terms = [...new Set(words.map((w) => (w.endsWith('s') ? w.slice(0, -1) : w)))].slice(0, 5);
  // translate() quita tildes en SQL para comparar con el texto normalizado
  const col = (c) => `translate(LOWER(COALESCE(${c}, '')), 'áéíóúüñ', 'aeiouun')`;
  const conds = terms.map((_, i) => `(${col('nombre')} LIKE $${i + 1} OR ${col('categoria')} LIKE $${i + 1} OR ${col('marca')} LIKE $${i + 1})`);
  const { rows } = await query(
    `SELECT id_producto, nombre, precio, stock, stock_minimo, imagen_url FROM Producto
      WHERE activo AND (${conds.join(' OR ')}) ORDER BY stock DESC LIMIT 4`,
    terms.map((t) => `%${t}%`)
  );
  if (!rows.length) return null;
  const lines = rows.map((p) => `• **${p.nombre}**: ${money(p.precio)} · ${p.stock === 0 ? 'Agotado' : p.stock <= p.stock_minimo ? `¡Solo ${p.stock} unidades!` : 'En stock'}`);
  return { respuesta: `Encontré esto en el catálogo 🔎:\n${lines.join('\n')}`, productos: rows };
}

export async function answer(message, user) {
  const text = normalize(String(message || '').slice(0, 500));
  if (!text.trim()) return { respuesta: '¿En qué te puedo ayudar?', sugerencias: SUGERENCIAS };

  for (const intent of intents) {
    if (intent.match.test(text)) {
      const r = await intent.reply(text, user);
      return { intencion: intent.name, sugerencias: SUGERENCIAS, ...r };
    }
  }
  const found = await catalogSearch(text);
  if (found) return { intencion: 'catalogo', sugerencias: SUGERENCIAS, ...found };

  return {
    intencion: 'desconocida',
    respuesta: 'No estoy seguro de haber entendido 🤔. Puedo responder sobre **envíos**, **estado de pedidos**, **pagos**, **garantías** o buscar productos (ej. "¿tienen audífonos?").',
    sugerencias: SUGERENCIAS,
  };
}
