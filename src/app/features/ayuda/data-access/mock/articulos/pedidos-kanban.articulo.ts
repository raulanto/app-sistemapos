import { AyudaArticulo } from '../../ayuda.models';

export const PEDIDOS_KANBAN_ARTICULO: AyudaArticulo = {
  id: 'art-4',
  categoriaId: 'pedidos-envios',
  titulo: 'Gestión de pedidos con tablero Kanban',
  resumen: 'Monitorea el flujo de pedidos desde solicitud, preparación, reparto hasta entrega final.',
  contenidoMarkdown: `
# Flujo de Pedidos en Tablero Kanban

Organiza los pedidos entrantes mediante columnas de estado interactivas.

## Estados del Pedido

1. **Nuevo / Pendiente**: Pedido registrado por el cliente o vendedor.
2. **En Preparación**: El personal de almacén empaqueta los productos.
3. **En Ruta / Asignado**: Asignado a un repartidor con su comprobante de envío.
4. **Entregado**: El cliente ha recibido el paquete satisfactoriamente.

> **Nota:** Al cambiar un pedido a estado *Entregado*, la venta se concluye automáticamente en el registro contable.
`,
  tags: ['pedidos', 'kanban', 'reparto', 'envios', 'logistica'],
  ultimaActualizacion: '2026-09-08',
};
