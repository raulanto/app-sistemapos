import { AyudaArticulo } from '../ayuda.models';
import { ALTA_PRODUCTOS_ARTICULO } from './articulos/alta-productos.articulo';
import { VENTA_POS_ARTICULO } from './articulos/venta-pos.articulo';
import { CIERRE_CAJA_ARTICULO } from './articulos/cierre-caja.articulo';
import { VENTAS_Y_CAJA_ARTICULO } from './articulos/ventas-y-caja.articulo';
import { CATALOGO_PRODUCTOS_ARTICULO } from './articulos/catalogo-productos.articulo';
import { PROVEEDORES_COMPRAS_ARTICULO } from './articulos/proveedores-compras.articulo';
import { PEDIDOS_KANBAN_ARTICULO } from './articulos/pedidos-kanban.articulo';
import { PEDIDOS_ENVIOS_ARTICULO } from './articulos/pedidos-envios.articulo';
import { MONEDERO_CLIENTES_ARTICULO } from './articulos/monedero-clientes.articulo';
import { PROMOCIONES_DESCUENTOS_ARTICULO } from './articulos/promociones-descuentos.articulo';
import { AGENDA_CITAS_ARTICULO } from './articulos/agenda-citas.articulo';
import { REPORTES_ANALITICA_ARTICULO } from './articulos/reportes-analitica.articulo';

export const AYUDA_ARTICULOS: AyudaArticulo[] = [
  ALTA_PRODUCTOS_ARTICULO,
  VENTAS_Y_CAJA_ARTICULO,
  PEDIDOS_ENVIOS_ARTICULO,
  PROVEEDORES_COMPRAS_ARTICULO,
  PROMOCIONES_DESCUENTOS_ARTICULO,
  REPORTES_ANALITICA_ARTICULO,
  AGENDA_CITAS_ARTICULO,
  VENTA_POS_ARTICULO,
  CIERRE_CAJA_ARTICULO,
  CATALOGO_PRODUCTOS_ARTICULO,
  PEDIDOS_KANBAN_ARTICULO,
  MONEDERO_CLIENTES_ARTICULO,
];
