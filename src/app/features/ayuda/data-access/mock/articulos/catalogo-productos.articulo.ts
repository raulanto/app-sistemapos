import { AyudaArticulo } from '../../ayuda.models';

export const CATALOGO_PRODUCTOS_ARTICULO: AyudaArticulo = {
  id: 'art-3',
  categoriaId: 'inventario-productos',
  titulo: 'Creación y actualización de catálogo de productos',
  resumen: 'Cómo dar de alta productos simples, con variantes (tallas/colores), precios e imágenes.',
  contenidoMarkdown: `
# Administración del Catálogo de Productos

El módulo de inventario te permite gestionar todo el catálogo de existencias de tu negocio.

## Campos Obligatorios al Crear un Producto

- **Nombre del Producto**: Nombre comercial claro.
- **Código de Barras / SKU**: Identificador único para escáner.
- **Categoría**: Clasificación para reportes y filtros.
- **Precio de Costo y Precio de Venta**: Para cálculo automático de márgenes de ganancia.
- **Stock Mínimo de Alerta**: Notificación automática cuando las existencias estén por agotarse.

---

### Carga Masiva de Productos
Puedes importar listas masivas en formato **CSV o Excel** desde la opción *Inventario > Productos > Importar*.
`,
  tags: ['inventario', 'productos', 'catalogo', 'sku', 'stock'],
  ultimaActualizacion: '2026-09-15',
};
