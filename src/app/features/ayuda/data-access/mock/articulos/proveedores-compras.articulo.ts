import { AyudaArticulo } from '../../ayuda.models';

export const PROVEEDORES_COMPRAS_ARTICULO: AyudaArticulo = {
  id: 'art-10',
  categoriaId: 'inventario-productos',
  titulo: 'Guía de Proveedores: Reabastecimiento de Stock, Pedidos de Compra y Recepción',
  resumen: 'Aprende a vincular proveedores a productos, generar pedidos de reabasto automático por faltantes, recibir mercancía en almacén y gestionar devoluciones.',
  contenidoMarkdown: `
# Guía de Proveedores y Reabastecimiento de Almacén

Mantener una relación organizada con tus proveedores asegura que nunca te quedes sin productos estrella en tus anaqueles.

En esta guía comprenderás cómo vincular proveedores, usar el motor de reorden automático, recibir mercancía en tienda y tramitar devoluciones por defectos.

---

## 1. Alta de Proveedores y Vinculación con Productos

### A. Registrar un Proveedor
En **Proveedores > Nuevo Proveedor**, registra la información comercial:
- **Código Interno**: Clave única asignada a la empresa proveedora.
- **Razón Social y RFC**: Datos fiscales para facturación de compras.
- **Contacto y Correo**: Datos del agente de ventas asignado.

### B. Vincular Producto con Proveedor
Un mismo producto puede ser vendido por varios proveedores, pero solo uno será el **Proveedor Principal**:
- **Costo de Compra del Proveedor**: Precio negociado por unidad.
- **Stock de Reorden**: Umbral mínimo para pedir mercancía antes de agotarse.
- **Cantidad de Reorden**: Volumen predeterminado a solicitar en cada pedido.

[IMAGEN: Vinculación de catálogo de productos con proveedores]

---

## 2. Motor de Reorden Automático (Generar Pedidos)

Cuando el stock de una sucursal disminuye por debajo del umbral configurado:
1. Dirígete a **Proveedores > Pedidos > Motor de Reorden**.
2. Haz clic en **Generar Borradores de Reabasto**.
3. El sistema agrupará todos los productos faltantes por proveedor y creará órdenes de compra en estado **Borrador**.
4. Un gerente revisa las cantidades y confirma el envío al proveedor.

[IMAGEN: Sugerencia de pedidos por motor de reorden automático]

---

## 3. Recepción de Mercancía en Almacén

Cuando el camión del proveedor entrega la mercancía en tu tienda:
1. Abre el pedido correspondiente y haz clic en **Registrar Recepción**.
2. **Conteo de Unidades**:
   - Registra las unidades recibidas en **Buen Estado** (ingresan al stock vendible inmediatamente).
   - Registra las unidades **Dañadas / Defectuosas** (no entran al stock vendible).
3. **Actualización de Costos**:
   - Si el costo del producto cambió en la factura, marca la casilla *Actualizar costo promedio de venta*.

[IMAGEN: Registro de recepción de mercancía y conteo de piezas dañadas]

---

## 4. Devoluciones a Proveedores

Si recibiste productos dañados o defectuosos:
1. Ingresa a **Proveedores > Devoluciones > Nueva Devolución**.
2. Selecciona la recepción origen y marca los productos a regresar.
3. El sistema generará el comprobante de devolución para solicitar nota de crédito o reembolso al proveedor.
`,
  tags: ['proveedores', 'compras', 'reabasto', 'recepcion', 'inventario', 'merma'],
  ultimaActualizacion: '2026-09-16',
};
