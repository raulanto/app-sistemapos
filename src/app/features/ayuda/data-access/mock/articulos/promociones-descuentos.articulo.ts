import { AyudaArticulo } from '../../ayuda.models';

export const PROMOCIONES_DESCUENTOS_ARTICULO: AyudaArticulo = {
  id: 'art-11',
  categoriaId: 'ventas-caja',
  titulo: 'Guía de Promociones: Creación de 2x1, Descuentos, Cupones y Descuento Manual',
  resumen: 'Aprende a configurar promociones tipo 2x1 (NxM), porcentaje de descuento, cupones con código y políticas para aplicar descuentos manuales en el POS.',
  contenidoMarkdown: `
# Guía de Promociones, Cupones y Descuento Manual

El módulo de **Promociones** permite crear estrategias comerciales atractivas para tus clientes sin necesidad de alterar los precios base del catálogo.

En esta guía comprenderás las modalidades de promoción, el uso de cupones y los permisos para aplicar descuentos manuales en caja.

---

## 1. Tipos de Promociones Soportados

Las promociones se aplican automáticamente en el Punto de Venta según el catálogo objetivo:

1. **Modalidad NxM (Ej. 2x1, 3x2)**:
   - Compra N unidades y paga M (ej. *Lleva 2 y paga 1*). Ideal para liquidación de inventario.
2. **Porcentaje de Descuento (%)**:
   - Aplica un % de descuento sobre el precio de lista (ej. *20% de descuento en categoría Bebidas*).
3. **Precio Fijo / Mayoreo por Presentación**:
   - Forzar un precio unitario especial al comprar un volumen mínimo (ej. *Caja de cerveza a $280 llevando 3 o más*).

[IMAGEN: Formulario de creación de promociones 2x1 y porcentaje]

---

## 2. Configuración de Cupones con Código

Si deseas crear promociones exclusivas para campañas digitales o cupones impresos:
1. En el formulario de promoción, activa la casilla **Requiere Código de Cupón**.
2. Define el código alfanumérico (ej. \`DESCUENTO10\` o \`VERANO2026\`).
3. **Límites de Uso**: Configura cuántas veces en total se puede redimir el cupón y el límite por cliente.
4. En el POS, el cajero escribirá el código de cupón antes de cobrar para activar el descuento.

[IMAGEN: Configuración de código de cupón alfanumérico y límites de uso]

---

## 3. Descuentos Manuales en el Punto de Venta (POS)

El **Descuento Manual** permite a un cajero o gerente aplicar una rebaja directa a un producto o al total de la venta en casos excepcionales.

### Reglas de Seguridad y Auditoría:
- **Permiso Requerido**: El usuario requiere el permiso \`ventas.descuento_manual\`.
- **Límite Máximo por Rol**: Se establece un % tope máximo de descuento según el nivel del usuario (ej. Cajero máx 10%, Gerente sin límite).
- **Motivo Obligatorio**: Al aplicar un descuento manual, la pantalla solicitará seleccionar o escribir el motivo (ej. *Empaque dañado, Cliente VIP, Promoción verbal*).
- **Registro en Auditoría**: Todos los descuentos manuales quedan guardados en los reportes de auditoría contable.

[IMAGEN: Modal de aplicación de descuento manual con justificación en el POS]
`,
  tags: ['promociones', 'descuentos', 'cupones', 'pos', '2x1', 'mayoreo'],
  ultimaActualizacion: '2026-09-16',
};
