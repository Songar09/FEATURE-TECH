# FEATURE TECH · Prototipo de e-commerce de tecnología

Arquitectura de tres capas:

| Capa | Tecnología |
|---|---|
| Presentación | React 18 + Vite + Tailwind CSS + Lucide React + Recharts |
| Lógica de negocio / API | Node.js 18+ + Express + Passport (Google OAuth 2.0) + JWT + bcrypt |
| Datos | PostgreSQL 14+ |

## 1. Estructura de carpetas

```
feature-tech/
├── database/
│   ├── schema.sql              # Crea la BD feature_tech, tipos, tablas, índices y triggers
│   └── sample_products.sql     # Productos de ejemplo (opcional, el seed también los crea)
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js           # Arranque: carga .env, verifica BD, levanta Express
│       ├── app.js              # Middlewares globales y montaje de rutas
│       ├── config/
│       │   ├── db.js           # Pool de PostgreSQL + helper de transacciones
│       │   └── passport.js     # Estrategia Google OAuth 2.0 (rol "Cliente" por defecto)
│       ├── middleware/
│       │   ├── auth.js         # authenticate (JWT), optionalAuth, authorize(...roles)
│       │   └── error.js        # 404 y manejador de errores
│       ├── routes/
│       │   ├── auth.routes.js       # /api/auth  registro, login, me, Google
│       │   ├── users.routes.js      # /api/users  CRUD de usuarios (Administrador)
│       │   ├── products.routes.js   # /api/products  catálogo e inventario
│       │   ├── cart.routes.js       # /api/cart  carrito (Cliente)
│       │   ├── orders.routes.js     # /api/orders  pedidos con validación de stock
│       │   ├── support.routes.js    # /api/support  solicitudes de soporte
│       │   ├── dashboard.routes.js  # /api/dashboard  métricas
│       │   └── chatbot.routes.js    # /api/chatbot  asistente FAQ
│       ├── services/chatbot.service.js
│       ├── utils/ (auth.js, http.js)
│       └── scripts/seed.js     # Inserta el Administrador principal
└── frontend/
    ├── .env.example
    ├── index.html, vite.config.js, tailwind.config.js, postcss.config.js
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── lib/        api.js (cliente HTTP con JWT), format.js
        ├── context/    AuthContext, CartContext, ToastContext
        ├── components/ Navbar, HeroBanner, ProductCard, StockBadge, ChatBot,
        │               GoogleButton, ProtectedRoute, Modal, Footer, Logo, Spinner
        └── pages/
            ├── Home, Catalog, ProductDetail, Login, Register, AuthCallback,
            │   Cart, MyOrders, Support, NotFound
            └── panel/  PanelLayout, Dashboard, Inventory, OrdersAdmin,
                        SupportAdmin, UsersAdmin
```

## 2. Puesta en marcha

Requisitos: Node.js 18 o superior y PostgreSQL 14 o superior.

```bash
# 1) Base de datos (crea "feature_tech" y todas las tablas)
psql -U postgres -f database/schema.sql

# 2) Configuración (una sola vez). Ajuste DATABASE_URL y JWT_SECRET en backend/.env
copy backend/.env.example backend/.env
copy frontend/.env.example frontend/.env
npm run instalar            # instala dependencias de la raíz, backend y frontend
cd backend && npm run seed && npm run seed:empleados && cd ..

# 3) Correr todo (desde la carpeta FEATURE-TECH, en la terminal de VS Code)
npm run dev                 # backend http://localhost:4000 y frontend http://localhost:5173
```

Para detener todo, presione Ctrl+C en la terminal.

**Administrador inicial:** `robinson.garcia@cun.edu.co`. La contraseña sale de `SEED_ADMIN_PASSWORD` en `backend/.env` (en `.env.example` viene la solicitada) y se guarda encriptada con bcrypt. El seed es idempotente: si el administrador ya existe no cambia su contraseña. Cambie la contraseña después del primer ingreso, y no suba el archivo `.env` a ningún repositorio.

## 3. Configurar Google OAuth 2.0

1. En [Google Cloud Console](https://console.cloud.google.com/apis/credentials) cree un **ID de cliente OAuth** de tipo *Aplicación web*.
2. Origen autorizado de JavaScript: `http://localhost:5173`.
3. URI de redirección autorizada: `http://localhost:4000/api/auth/google/callback`.
4. Copie el Client ID y el Client Secret en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` del `.env` del backend y reinicie.

Flujo: el botón lleva a `/api/auth/google` → Google → `/api/auth/google/callback` → el backend busca o crea el usuario (nuevo = rol **Cliente**; si el correo ya existía, vincula la cuenta) → redirige a `http://localhost:5173/auth/callback#token=<JWT>`. Sin credenciales configuradas el botón aparece deshabilitado y el resto funciona normal.

## 4. Roles y permisos

| Funcionalidad | Administrador | Empleado | Cliente |
|---|:-:|:-:|:-:|
| Ver catálogo | ✅ (incluye inactivos) | ✅ (incluye inactivos) | ✅ |
| Crear / editar / activar / desactivar productos | ✅ | — | — |
| Actualizar existencias (stock) | ✅ | ✅ | — |
| CRUD de usuarios, cambio de rol, suspender | ✅ | — | — |
| Consultar todos los pedidos | ✅ | ✅ | — |
| Cambiar estado de pedidos | ✅ | — | — |
| Responder / cerrar soporte | ✅ | ✅ | — |
| Dashboard de métricas | ✅ | ✅ (sin usuarios por rol) | — |
| Carrito y registrar pedidos | — | — | ✅ |
| Enviar solicitudes de soporte | — | — | ✅ |

Los permisos se validan en el backend con `authorize(...roles)`; el frontend solo oculta lo que no corresponde. El rol y el estado se leen de la base de datos en cada petición, así que un cambio de rol o una suspensión aplican de inmediato.

## 5. Reglas de negocio implementadas

- Todo registro nuevo (manual o Google) queda con rol **Cliente**; el campo `rol` enviado al registrarse se ignora.
- Contraseñas con bcrypt (12 rondas); límite de intentos en login y registro.
- Al confirmar un pedido se bloquean las filas de producto (`SELECT … FOR UPDATE`) dentro de una transacción, se valida stock y estado activo, se descuenta el inventario, se crea `Pedido` + `DetallePedido` y se vacía el carrito. Si falta stock, responde 409 con el detalle por producto.
- Si el Administrador cancela un pedido, el stock se repone automáticamente.
- Un usuario con pedidos no se puede eliminar (se sugiere suspenderlo). El Administrador no puede eliminarse, suspenderse ni quitarse el rol a sí mismo.
- Etiquetas de stock: **En Stock**, **Pocas Unidades** (stock ≤ stock mínimo) y **Agotado**.

## 6. Endpoints principales

```
POST   /api/auth/register | /api/auth/login        GET /api/auth/me
GET    /api/auth/google  →  /api/auth/google/callback
GET    /api/users            POST /api/users        PUT /api/users/:id
PATCH  /api/users/:id/rol    PATCH /api/users/:id/estado   DELETE /api/users/:id
GET    /api/products  (?q&categoria&orden&todos=1)   GET /api/products/:id
POST   /api/products  PUT /api/products/:id  PATCH /api/products/:id/activo
PATCH  /api/products/:id/stock   { stock } o { ajuste }
GET    /api/cart   POST /api/cart/items   PUT|DELETE /api/cart/items/:idProducto   DELETE /api/cart
POST   /api/orders   GET /api/orders/mis-pedidos   GET /api/orders   GET /api/orders/:id
PATCH  /api/orders/:id/estado
POST   /api/support  GET /api/support/mios  GET /api/support
PATCH  /api/support/:id/responder   PATCH /api/support/:id/cerrar
GET    /api/dashboard/metricas
POST   /api/chatbot  { mensaje }
```

## 7. Chatbot "Tecky"

Widget flotante en todas las páginas, conectado a `POST /api/chatbot`. Reconoce intenciones por palabras clave: saludo, **envíos**, **estado de pedidos** (si hay sesión consulta los pedidos reales del usuario, también "pedido #12"), pagos, garantías y devoluciones, soporte, categorías, y en último caso busca productos del catálogo por nombre, marca o categoría. Está aislado en `services/chatbot.service.js` para poder reemplazarlo por un modelo de IA más adelante sin tocar el frontend.

## 8. Publicación gratuita en la nube (Render, un clic)

El archivo `render.yaml` crea todo en Render: una base PostgreSQL gratuita y un solo servicio web que sirve la tienda y el API en el mismo dominio. Al arrancar, el servidor crea las tablas si la base está vacía, aplica las migraciones y carga el administrador y los productos de ejemplo (no borra datos existentes).

1. Abra https://render.com/deploy?repo=https://github.com/Songar09/feature-tech e ingrese con su cuenta de GitHub.
2. Render pide `SEED_ADMIN_PASSWORD`: escriba la contraseña que tendrá el administrador `robinson.garcia@cun.edu.co`. `JWT_SECRET` se genera solo.
3. Pulse **Deploy Blueprint**. En unos minutos el sitio queda en `https://feature-tech-XXXX.onrender.com` (la URL aparece en el servicio `feature-tech`).

Notas del plan gratuito: el servicio se duerme tras 15 minutos sin visitas (la primera carga tarda ~1 minuto) y la base gratuita de Render vence a los 30 días; para algo permanente use un plan pago o una base en Neon (ponga su cadena en `DATABASE_URL`).

Para Google OAuth, agregue en Render `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_CALLBACK_URL=https://<su-url>/api/auth/google/callback`, y registre esa misma URL de redirección en Google Cloud.

Nunca suba claves al repositorio: se escriben solo en el panel de Render.
