import { AyudaArticulo } from '../ayuda.models';
import { VENTA_POS_ARTICULO } from './articulos/venta-pos.articulo';
import { CIERRE_CAJA_ARTICULO } from './articulos/cierre-caja.articulo';
import { CATALOGO_PRODUCTOS_ARTICULO } from './articulos/catalogo-productos.articulo';
import { PEDIDOS_KANBAN_ARTICULO } from './articulos/pedidos-kanban.articulo';
import { MONEDERO_CLIENTES_ARTICULO } from './articulos/monedero-clientes.articulo';
import { ALTA_PRODUCTOS_ARTICULO } from './articulos/alta-productos.articulo';

export const AYUDA_ARTICULOS: AyudaArticulo[] = [
  ALTA_PRODUCTOS_ARTICULO,
  VENTA_POS_ARTICULO,
  CIERRE_CAJA_ARTICULO,
  CATALOGO_PRODUCTOS_ARTICULO,
  PEDIDOS_KANBAN_ARTICULO,
  MONEDERO_CLIENTES_ARTICULO,
];
