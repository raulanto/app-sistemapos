import { AyudaCategoria } from '../ayuda.models';

export const AYUDA_CATEGORIAS: AyudaCategoria[] = [
  {
    id: 'ventas-caja',
    titulo: 'Ventas y Punto de Venta',
    descripcion: 'Guías de cobro, turnos de caja, métodos de pago y emisión de comprobantes.',
    icono: 'lucideShoppingCart',
    articulosCount: 6,
  },
  {
    id: 'inventario-productos',
    titulo: 'Inventario y Productos',
    descripcion: 'Administración de stock, categorías, variantes, mermas y alertas de reabastecimiento.',
    icono: 'lucideBoxes',
    articulosCount: 8,
  },
  {
    id: 'pedidos-envios',
    titulo: 'Pedidos y Entregas',
    descripcion: 'Gestión del tablero Kanban, estado de pedidos, asignación de repartidores y rutas.',
    icono: 'lucideClipboardList',
    articulosCount: 5,
  },
  {
    id: 'clientes-monedero',
    titulo: 'Clientes y Fidelización',
    descripcion: 'Alta de clientes, saldos a crédito, historial de compras y puntos en monedero.',
    icono: 'lucideUserRound',
    articulosCount: 4,
  },
  {
    id: 'reportes-analitica',
    titulo: 'Reportes y Analítica',
    descripcion: 'Cortes de caja, ventas por periodo, exportación de datos y reportes programados.',
    icono: 'lucideChartColumn',
    articulosCount: 7,
  },
  {
    id: 'configuracion-usuarios',
    titulo: 'Configuración y Usuarios',
    descripcion: 'Gestión de roles, permisos de empleados, sucursales y terminales de cobranza.',
    icono: 'lucideUserCog',
    articulosCount: 5,
  },
];
