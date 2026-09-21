import { AyudaArticulo } from '../../ayuda.models';

export const MONEDERO_CLIENTES_ARTICULO: AyudaArticulo = {
  id: 'art-5',
  categoriaId: 'clientes-monedero',
  titulo: 'Programa de lealtad y monedero electrónico',
  resumen: 'Configura la acumulación de puntos por cada compra y aprende a canjear saldos a favor.',
  contenidoMarkdown: `
# Monedero Electrónico y Fidelización

Incentiva las compras recurrentes recompensando a tus clientes.

## ¿Cómo funciona?

- Cada vez que un cliente realiza una compra identificada, acumula un **% configurable** del total en saldo a favor.
- El saldo acumulado se puede utilizar como método de pago parcial o total en sus siguientes compras.
- Los saldos y movimientos del monedero son visibles en el expediente del cliente (*Clientes > Monedero*).
`,
  tags: ['clientes', 'monedero', 'puntos', 'fidelizacion', 'descuento'],
  ultimaActualizacion: '2026-09-01',
};
