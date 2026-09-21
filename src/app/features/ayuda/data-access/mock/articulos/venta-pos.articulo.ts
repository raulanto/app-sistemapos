import { AyudaArticulo } from '../../ayuda.models';

export const VENTA_POS_ARTICULO: AyudaArticulo = {
  id: 'art-1',
  categoriaId: 'ventas-caja',
  titulo: 'Cómo realizar una venta en el Punto de Venta (POS)',
  resumen: 'Paso a paso para buscar productos, aplicar descuentos, seleccionar método de pago y cerrar el ticket.',
  contenidoMarkdown: `
# Guía: Cómo realizar una venta en el Punto de Venta

El sistema POS permite registrar ventas de forma rápida mediante código de barras o búsqueda manual.

## Pasos para registrar una venta

1. **Selecciona o busca los productos**:
   - Escanea el código de barras con el lector.
   - O utiliza la barra de búsqueda superior por nombre o SKU.
2. **Ajusta cantidades y descuentos**:
   - Incrementa o disminuye unidades directamente en el carrito.
   - Si tienes permisos, aplica un *descuento manual* o selecciona una *promoción activa*.
3. **Selecciona el cliente (Opcional)**:
   - Asigna un cliente registrado para acumular puntos en su **monedero electrónico** o para venta a **crédito**.
4. **Procesa el Pago**:
   - Elige el método de pago: *Efectivo, Tarjeta, Transferencia o Monedero*.
   - Ingresa el monto recibido para calcular el cambio automáticamente.
5. **Cierre de Ticket**:
   - Haz clic en **Completar Venta** para imprimir el comprobante o enviarlo por correo.

> **Tip:** Puedes presionar la tecla \`F2\` o \`Ctrl + K\` para buscar productos rápidamente sin soltar el teclado.
`,
  tags: ['ventas', 'pos', 'cobro', 'ticket', 'descuentos'],
  ultimaActualizacion: '2026-09-10',
};
