import { AyudaCategoria } from '../ayuda.models';

export const AYUDA_CATEGORIAS: AyudaCategoria[] = [
  {
    id: 'ventas-caja',
    titulo: 'Ventas y Punto de Venta',
    descripcion: 'Guías de cobro, turnos de caja, métodos de pago, promociones y arqueos.',
    icono: 'lucideShoppingCart',
    articulosCount: 4,
  },
  {
    id: 'inventario-productos',
    titulo: 'Inventario y Productos',
    descripcion: 'Alta de productos, variantes, proveedores, compras y existencias por sucursal.',
    icono: 'lucideBoxes',
    articulosCount: 3,
  },
  {
    id: 'pedidos-envios',
    titulo: 'Pedidos y Entregas',
    descripcion: 'Gestión del tablero Kanban, estado de pedidos, asignación de repartidores y rutas.',
    icono: 'lucideClipboardList',
    articulosCount: 2,
  },
  {
    id: 'clientes-monedero',
    titulo: 'Clientes y Fidelización',
    descripcion: 'Alta de clientes, saldos a crédito, historial de compras y puntos en monedero.',
    icono: 'lucideUserRound',
    articulosCount: 1,
  },
  {
    id: 'reportes-analitica',
    titulo: 'Reportes y Analítica',
    descripcion: 'Cortes de caja, ventas por periodo, exportación de datos y reportes programados.',
    icono: 'lucideChartColumn',
    articulosCount: 1,
  },
  {
    id: 'configuracion-usuarios',
    titulo: 'Configuración y Usuarios',
    descripcion: 'Gestión de roles, permisos de empleados, agenda de citas y sucursales.',
    icono: 'lucideUserCog',
    articulosCount: 1,
  },
];
