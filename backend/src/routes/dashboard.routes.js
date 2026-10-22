import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, ROLES } from '../utils/http.js';

const router = Router();

/** GET /api/dashboard/metricas (Administrador y Empleado) */
router.get('/metricas', authenticate, authorize(ROLES.ADMIN, ROLES.EMPLEADO), asyncHandler(async (req, res) => {
  const [kpis, ventas, porEstado, bajoStock, top, roles, soporte] = await Promise.all([
    query(`SELECT
             (SELECT COALESCE(SUM(total),0) FROM Pedido WHERE estado <> 'cancelado') AS ingresos,
             (SELECT COUNT(*) FROM Pedido)::int AS pedidos,
             (SELECT COUNT(*) FROM Pedido WHERE estado = 'pendiente')::int AS pedidos_pendientes,
             (SELECT COUNT(*) FROM Producto WHERE activo)::int AS productos_activos,
             (SELECT COALESCE(SUM(stock),0) FROM Producto WHERE activo)::int AS unidades_inventario,
             (SELECT COALESCE(SUM(stock * precio),0) FROM Producto WHERE activo) AS valor_inventario,
             (SELECT COUNT(*) FROM Usuario WHERE rol = 'Cliente')::int AS clientes`),
    query(`SELECT to_char(d, 'YYYY-MM-DD') AS fecha,
                  COALESCE(SUM(p.total) FILTER (WHERE p.estado <> 'cancelado'), 0) AS total,
                  COUNT(p.id_pedido)::int AS pedidos
             FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, '1 day') d
             LEFT JOIN Pedido p ON p.fecha_pedido::date = d::date
            GROUP BY d ORDER BY d`),
    query(`SELECT estado, COUNT(*)::int AS cantidad FROM Pedido GROUP BY estado`),
    query(`SELECT id_producto, nombre, stock, stock_minimo, categoria FROM Producto
            WHERE activo AND stock <= stock_minimo ORDER BY stock ASC LIMIT 8`),
    query(`SELECT p.id_producto, p.nombre, SUM(d.cantidad)::int AS unidades, SUM(d.subtotal) AS ingresos
             FROM DetallePedido d JOIN Producto p ON p.id_producto = d.id_producto
             JOIN Pedido pe ON pe.id_pedido = d.id_pedido AND pe.estado <> 'cancelado'
            GROUP BY p.id_producto, p.nombre ORDER BY unidades DESC LIMIT 5`),
    query(`SELECT rol, COUNT(*)::int AS cantidad FROM Usuario GROUP BY rol`),
    query(`SELECT estado, COUNT(*)::int AS cantidad FROM Soporte GROUP BY estado`),
  ]);

  res.json({
    kpis: kpis.rows[0],
    ventas_7_dias: ventas.rows,
    pedidos_por_estado: porEstado.rows,
    bajo_stock: bajoStock.rows,
    top_productos: top.rows,
    usuarios_por_rol: req.user.rol === ROLES.ADMIN ? roles.rows : undefined,
    soporte_por_estado: soporte.rows,
  });
}));

export default router;
