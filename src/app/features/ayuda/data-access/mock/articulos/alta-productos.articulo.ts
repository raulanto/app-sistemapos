import { AyudaArticulo } from '../../ayuda.models';

export const ALTA_PRODUCTOS_ARTICULO: AyudaArticulo = {
  id: 'art-6',
  categoriaId: 'inventario-productos',
  titulo: 'Guía completa: Cómo dar de alta un producto y entender cada campo',
  resumen: 'Aprende a registrar productos simples, por peso, combos y servicios. Conoce qué significa cada apartado del formulario y cómo cargar stock inicial.',
  contenidoMarkdown: `
# Guía Completa de Alta y Registro de Productos

Registrar un producto en el sistema es el primer paso para poder venderlo en el Punto de Venta (POS) y llevar un control exacto del inventario y las ganancias.

En esta guía aprenderás **qué es un producto**, **sus 4 tipos**, y **qué significa cada apartado del formulario** que completas en pantalla.

---

## 1. La Idea Principal y Alcance del Producto

Un **producto** es cualquier artículo, insumo o servicio que tu negocio comercializa o guarda en almacén.

Antes de poner a la venta un producto, la aplicación te guía en 5 pasos clave:
1. Definir qué tipo de producto es (pieza entera, por peso, combo o servicio).
2. Asignar su precio de venta al público y su costo de compra.
3. Crear formas de venta adicionales (ejemplo: la lata suelta vs. la caja/reja completa).
4. Subir la fotografía principal para que los cajeros lo identifiquen visualmente.
5. Cargar la existencia inicial (stock) en las sucursales donde estará disponible.

> **Importante:** El stock siempre se contabiliza en la **unidad base** (la unidad más pequeña en la que mides el producto, como 1 lata o 1 kilo). Las cajas o Six-Packs son solo formas de vender esa misma unidad.

---

## 2. Los 4 Tipos de Producto (¿Cuál debo elegir?)

Al iniciar la carga, el sistema te pedirá seleccionar el **Tipo de Producto**:

- **Simple (Pieza Entera)**:
  - *Cuándo usarlo:* Se vende por piezas completas (es el 90% de los productos).
  - *Ejemplos:* Un shampoo, una playera, un refresco en lata.
- **Fraccionable (Por Peso / Volumen / Metro)**:
  - *Cuándo usarlo:* Se vende en fracciones o decimales (kilos, gramos, litros, metros).
  - *Ejemplos:* Jamón a granel, tela por metro, queso por gramaje.
- **Kit / Combo**:
  - *Cuándo usarlo:* Es una agrupación de otros productos del catálogo. No tiene stock propio; al venderlo, descuenta existencias de sus componentes.
  - *Ejemplos:* "Combo Desayuno" (1 café + 2 medialunas).
- **Servicio**:
  - *Cuándo usarlo:* Concepto intangible que no requiere stock ni almacén físico.
  - *Ejemplos:* Flete a domicilio, instalación, mano de obra.

> **Regla rápida:** ¿El cliente puede pedirte "medio"? Si la respuesta es sí, elige **Fraccionable**. Si no requiere inventario, elige **Servicio**.

[IMAGEN: Selección del tipo de producto y unidad de medida]

---

## 3. Explicación Detallada del Formulario

A continuación se explica el significado y la utilidad de cada sección al crear o editar un producto:

### Sección A — Información General
- **Nombre del Producto**: Nombre comercial claro con el que aparecerá en el ticket y en las búsquedas del POS.
- **SKU (Código Interno)**: Clave o código propio que asignas para identificarlo en tu negocio.
- **Código de Barras**: Número escaneable del producto (EAN/UPC). Permite agregar el producto al carrito de venta escaneándolo directamente.
- **Categoría**: Clasificación temática (ej. Bebidas, Farmacia, Abarrotes). Ayuda a filtrar reportes y organizar el catálogo.
- **Unidad de Medida**: Indica cómo se contabiliza el producto (Pieza, Kilo, Litro, Caja). Define cuántos decimales acepta la pantalla.
- **Descripción**: Notas adicionales sobre el producto, uso o especificaciones técnicas.

[IMAGEN: Formulario de datos generales del producto]

---

### Sección B — Precios, Costos e Impuestos
- **Precio de Venta**: Precio final o base cobrado al cliente por 1 unidad.
- **Costo de Compra**: Lo que le cuesta a tu negocio adquirir 1 unidad del proveedor (sirve para calcular el margen de utilidad).
- **Tasa de Impuesto (%)**: Porcentaje de IVA o impuestos aplicables (0% si está exento).
- **Precio Incluye Impuesto**: Marca esta casilla si el *Precio de Venta* que escribiste ya contempla el IVA.
- **Precio Mayoreo y Cantidad Mínima**: Si el cliente compra una cantidad igual o mayor a la mínima (ej. 12 piezas), el sistema aplicará automáticamente el precio preferencial de mayoreo.

[IMAGEN: Configuración de precios, costos y mayoreo]

---

### Sección C — Controles Especiales y Lotes
- **Permitir Venta en Negativo**: Permite seguir vendiendo en caja aunque el stock llegue a 0.
- **Requiere Lote y Caducidad**: Obligatorio para medicamentos, lácteos o perecederos. Cada carga de stock solicitará un código de lote y su fecha de vencimiento. El sistema descontará automáticamente los lotes que vencen primero (**FEFO**).
- **Venta Fraccionada / Incremento Mínimo**: En productos fraccionables, define el salto mínimo de venta (ej. \`0.05\` para vender de 50g en 50g).

[IMAGEN: Opciones de control por lote y caducidad]

---

### Sección D — Presentaciones (Formas de venta adicionales)
Si vendes un mismo producto suelto y en paquete, aquí agregas las presentaciones:
- **Nombre de la Presentación**: Ej. "Caja con 24 latas" o "Six-Pack".
- **Factor de Conversión**: Cuántas unidades base equivalen a esta presentación (ej. 24).
- **Código de Barras Propio**: Al escanear el código de la caja en caja, se cobrará el precio de la caja y se descontarán 24 unidades del stock total.

[IMAGEN: Lista y creación de presentaciones de venta]

---

### Sección E — Galería e Imagen Principal
- Sube una o varias fotografías del producto (Formatos JPG, PNG o WebP de hasta 5 MB).
- Selecciona una como **Imagen Principal (Portada)**. Esta miniatura aparecerá en los botones táctiles del punto de venta.

[IMAGEN: Carga y selección de imagen de portada]

---

### Sección F — Stock Inicial por Sucursal
- Indica las existencias con las que inicia el producto en cada una de tus tiendas.
- **Stock Mínimo de Alerta**: Define el umbral crítico para que el sistema te notifique cuándo reabastecer antes de quedarte sin mercancía.
- Si el producto es por **Lote**, deberás ingresar el código de lote y la fecha de caducidad para esa entrada inicial.

[IMAGEN: Registro de existencias iniciales por sucursal]

---

## 4. Resumen de Buenas Prácticas

1. **Revisa la Unidad Base**: Asegúrate de que la unidad principal sea la más pequeña.
2. **Escanea los Códigos**: Comprueba que el código de barras no esté duplicado con otro producto.
3. **Mantén los Costos Actualizados**: Actualiza el costo al ingresar compras de proveedores para que tus reportes de utilidad sean exactos.
`,
  tags: ['productos', 'inventario', 'alta', 'lotes', 'presentaciones', 'stock'],
  ultimaActualizacion: '2026-09-16',
};
