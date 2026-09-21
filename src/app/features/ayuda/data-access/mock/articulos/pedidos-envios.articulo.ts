import { AyudaArticulo } from '../../ayuda.models';

export const PEDIDOS_ENVIOS_ARTICULO: AyudaArticulo = {
  id: 'art-8',
  categoriaId: 'pedidos-envios',
  titulo: 'Guía Completa: Creación de Pedidos, Envíos a Domicilio y Tablero Kanban',
  resumen: 'Aprende a registrar pedidos a domicilio, asignar repartidores, gestionar estados de entrega en Kanban y facturar compras al cliente.',
  contenidoMarkdown: `
# Guía Completa de Pedidos y Envíos a Domicilio

El módulo de pedidos permite cotizar, guardar órdenes con entregas posteriores y gestionar envíos a domicilio o recolecciones en tienda.

En esta guía comprenderás el ciclo de vida del pedido, el manejo del tablero Kanban y el proceso de entrega final.

---

## 1. El Ciclo de Vida del Pedido (Estados)

Un pedido cuenta con dos flujos independientes: el **Estado de la Orden** y el **Estado de la Entrega**.

### A. Estado de la Orden
1. **Borrador**: El pedido se está armando o cotizando. Los precios se actualizan si el catálogo cambia.
2. **Confirmado**: El cliente aceptó el pedido. Los precios se **congelan** para garantizar el presupuesto.
3. **Facturado**: El pedido fue pagado y se emitió la venta formal.
4. **Cancelado**: La orden se anuló antes de facturar.

### B. Estado de la Entrega (Solo para Domicilio o Recolección)
- **Pendiente**: Registrado en espera de preparación en almacén.
- **En Preparación**: El personal de almacén empaqueta los artículos.
- **En Ruta / Asignado**: El pedido fue asignado a un repartidor específico.
- **Entregado**: El cliente recibió el paquete de forma satisfactoria.
- **Fallido**: No se encontró al cliente (permite reintentar la entrega).

[IMAGEN: Diagrama de flujo de estados de pedido y entregas]

---

## 2. Creación de un Nuevo Pedido a Domicilio

Al registrar un pedido desde **Pedidos > Nuevo Pedido**:

1. **Datos del Cliente y Dirección**:
   - Selecciona al cliente registrado o captura su nombre y teléfono.
   - Para pedidos de tipo *Domicilio*, selecciona o captura la dirección completa de entrega con referencias de ubicación.
2. **Agregar Productos y Servicios**:
   - Agrega los productos solicitados al carrito.
   - Agrega servicios adicionales si aplica (ej. *Flete a domicilio* o *Mano de obra*).
3. **Registro de Anticipos / Señal**:
   - Si el cliente deja un anticipo (ej. 50% de enganche), regístralo en el formulario.
   - El anticipo se considerará como pago parcial al momento de facturar.

[IMAGEN: Formulario de creación de pedido a domicilio con anticipos]

---

## 3. Control Operativo en el Tablero Kanban

El **Tablero Kanban** muestra visualmente el avance de todos los pedidos divididos por columnas de estado:

- **Arrastrar y Soltar**: Mueve tarjetas entre columnas para actualizar el estado del pedido en tiempo real.
- **Asignar Repartidor**: Haz clic en la tarjeta del pedido para seleccionar el repartidor responsable de la ruta.
- **Filtros por Fecha y Canal**: Filtra pedidos del día, de la semana o por canal de origen (*POS, Web, Teléfono*).

[IMAGEN: Tablero Kanban de pedidos interactivo]

---

## 4. Cobro y Facturación del Pedido

Cuando el repartidor entrega el paquete o el cliente pasa a recogerlo:

1. El pedido debe estar en estado **Confirmado**.
2. Abre la orden y haz clic en **Facturar / Cobrar Pedido**.
3. El sistema verificará que tengas un **turno de caja abierto**.
4. Se calculará el **Saldo por Cobrar** descontando el anticipo previo.
5. Selecciona el método de pago restante y confirma la transacción.

> **Importante:** Las existencias del producto se descuentan del inventario en el instante exacto en que el pedido se **Factura**, no en la etapa de borrador.
`,
  tags: ['pedidos', 'kanban', 'domicilio', 'envios', 'reparto', 'facturacion'],
  ultimaActualizacion: '2026-09-16',
};
