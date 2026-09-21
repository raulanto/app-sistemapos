import { AyudaArticulo } from '../../ayuda.models';

export const VENTAS_Y_CAJA_ARTICULO: AyudaArticulo = {
  id: 'art-7',
  categoriaId: 'ventas-caja',
  titulo: 'Guía del Cajero: Apertura de turno, cobranza en POS y arqueo de caja',
  resumen: 'Aprende a abrir turnos con fondo inicial, registrar ventas con múltiples métodos de pago, aplicar promociones y realizar arqueos de cierre.',
  contenidoMarkdown: `
# Guía Operativa de Ventas y Administración de Caja

La cobranza eficiente en el Punto de Venta (POS) y el control riguroso de caja son fundamentales para garantizar cero descuadres al final del día.

En esta guía paso a paso aprenderás cómo operar desde la apertura del turno hasta el cierre y arqueo de efectivo.

---

## 1. Reglas Principales de Operación

- **Turno Activo Obligatorio**: No se puede registrar ninguna venta sin antes abrir un turno de caja con su fondo inicial.
- **Transacción Segura**: Si una venta se interrumpe o falla por falta de crédito, el sistema cancela la operación automáticamente sin alterar el inventario.
- **Inalterabilidad de Registro**: Las ventas concluidas **no se eliminan ni se editan**. Si hubo un error se realiza una *Anulación*, y si el cliente regresa producto se procesa una *Devolución*.

---

## 2. Apertura y Control del Turno de Caja

### Paso 1 — Apertura de Turno
Al llegar al turno de trabajo:
1. Dirígete a **Punto de Venta** o **Turnos de Caja**.
2. Selecciona la terminal de cobranza asignada (ej. *Caja 1*).
3. Ingresa el **Fondo Inicial de Efectivo** (dinero en morralla/cambio para iniciar el día).

[IMAGEN: Pantalla de apertura de turno de caja y fondo inicial]

### Paso 2 — Movimientos de Efectivo durante la Jornada
Durante el día puedes registrar entradas o salidas del cajón de dinero:
- **Retiro**: Traslado de efectivo sobrante a la caja fuerte o depósito bancario.
- **Ingreso**: Refuerzo de efectivo enviado por gerencia para cambio.
- **Gasto de Caja**: Pago menor en efectivo autorizado (ej. garrafón de agua o insumo de limpieza).

[IMAGEN: Registro de movimiento de retiro o gasto de caja]

---

## 3. Proceso de Cobro en el Punto de Venta (POS)

1. **Escaneo / Búsqueda de Productos**:
   - Escanea el código de barras o presiona \`Ctrl + K\` para buscar por nombre.
   - Para productos por kilo/peso, el sistema solicitará ingresar el peso exacto de la báscula.
2. **Selección de Cliente y Monedero**:
   - Asigna al cliente para acumular saldo en su **monedero electrónico** o para venta a **crédito/fiado**.
3. **Formas de Pago Soportadas**:
   - **Efectivo**: Calcula el cambio de inmediato.
   - **Tarjeta Débito/Crédito**: Registra el código de referencia de la terminal bancaria.
   - **Transferencia**: Verifica el comprobante SPEI.
   - **Monedero Electrónico**: Aplica puntos acumulados del cliente.
   - **Pagos Mixtos**: Combina (ej. $100 en efectivo + $150 en tarjeta).

[IMAGEN: Pantalla principal del POS con carrito y modal de cobro]

---

## 4. Arqueo y Cierre de Caja

Al finalizar el turno:
1. Ingresa a **Turnos de Caja > Cerrar Turno**.
2. Realiza el **conteo físico por billetes y monedas** e ingresa los montos en pantalla.
3. El sistema calculará automáticamente el *Efectivo Esperado vs. Efectivo Contado*:
   - **Cuadrado**: El conteo coincide exacto con las ventas registradas.
   - **Diferencia (Sobrante/Faltante)**: Si excede el margen permitido, el turno requerirá conciliación de gerencia.

[IMAGEN: Modal de arqueo de caja por denominaciones de billetes]
`,
  tags: ['ventas', 'pos', 'caja', 'arqueo', 'cierre', 'cobro'],
  ultimaActualizacion: '2026-09-16',
};
