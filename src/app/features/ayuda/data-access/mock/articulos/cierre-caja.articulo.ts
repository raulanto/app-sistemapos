import { AyudaArticulo } from '../../ayuda.models';

export const CIERRE_CAJA_ARTICULO: AyudaArticulo = {
  id: 'art-2',
  categoriaId: 'ventas-caja',
  titulo: 'Apertura, arqueo y cierre de turno de caja',
  resumen: 'Aprende a registrar el fondo inicial, realizar conteos parciales y enviar el corte de caja.',
  contenidoMarkdown: `
# Arqueo y Cierre de Turnos de Caja

Llevar un control riguroso del flujo de efectivo previene descuadres y simplifica las auditorías.

## Flujo de Trabajo del Cajero

- **Apertura de Caja**:
  - Al ingresar al sistema por la mañana, indica el **monto inicial de fondo** en la caja.
- **Movimientos de Efectivo**:
  - Si realizas retiros parciales (para depósito o pago de servicios) o ingresos extraordinarios, regístralos en el módulo **Turnos de Caja > Nuevo Movimiento**.
- **Cierre de Turno**:
  - Conteo del dinero físico acumulado por denominaciones.
  - El sistema comparará el efectivo teórico vs. el conteo real y generará el reporte de **Diferencia**.
`,
  tags: ['caja', 'cierre', 'arqueo', 'turno', 'efectivo'],
  ultimaActualizacion: '2026-09-12',
};
