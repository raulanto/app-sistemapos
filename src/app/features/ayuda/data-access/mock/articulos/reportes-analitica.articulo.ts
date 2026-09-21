import { AyudaArticulo } from '../../ayuda.models';

export const REPORTES_ANALITICA_ARTICULO: AyudaArticulo = {
  id: 'art-12',
  categoriaId: 'reportes-analitica',
  titulo: 'Guía de Reportes: Dashboard Analítico, Cortes de Caja y Exportación',
  resumen: 'Aprende a consultar indicadores clave (KPIs), analizar ventas por producto o vendedor, realizar cortes de caja y exportar reportes en Excel o PDF.',
  contenidoMarkdown: `
# Guía del Módulo de Reportes y Analítica de Negocio

Tomar decisiones basadas en datos reales es clave para hacer crecer tu negocio. El módulo de **Reportes** ofrece una visión panorámica de ventas, márgenes, inventario y clientes.

En esta guía aprenderás cómo interpretar el Dashboard principal, analizar las ventas por periodo y exportar información contable.

---

## 1. El Dashboard Analítico Principal

Al ingresar a **Reportes > Dashboard**, visualizarás los indicadores clave de rendimiento (KPIs) en tiempo real:

- **Venta Total del Día / Mes**: Suma acumulada de ingresos brutos y netos.
- **Ticket Promedio**: Monto promedio gastado por cada cliente por transacción.
- **Top Productos Más Vendidos**: Lista de los artículos con mayor rotación de inventario.
- **Ventas por Método de Pago**: Desglose gráfico de ingresos recopilados en *Efectivo, Tarjeta, Transferencia y Monedero*.

[IMAGEN: Dashboard analítico con gráficas e indicadores KPI]

---

## 2. Tipos de Reportes Disponibles

1. **Reporte de Ventas por Período**:
   - Filtra ventas por rango de fechas (hoy, esta semana, este mes o rango personalizado).
   - Compara ingresos contra costos para calcular el **margen de utilidad bruta**.
2. **Reporte por Vendedor**:
   - Monitorea el rendimiento individual de cada cajero o empleado.
3. **Corte de Caja (Auditoría de Turnos)**:
   - Consulta el historial de turnos de caja cerrados, montos calculados vs. contados y diferencias registradas.
4. **Valoración de Inventario y Mermas**:
   - Consulta el valor total del stock almacenado a precio de costo y precio de venta.
5. **Clientes con Saldo a Crédito**:
   - Listado de clientes con cuentas por cobrar y fechas de vencimiento.

[IMAGEN: Selector de filtros por rango de fecha y sucursal en reportes]

---

## 3. Exportación de Reportes a Excel, PDF y CSV

Si cuentas con el permiso de exportación (\`reportes.exportar\`):
1. Aplica los filtros deseados (rango de fecha, sucursal, categoría).
2. Haz clic en el botón **Exportar** ubicado en la esquina superior derecha.
3. Selecciona el formato de descarga deseado:
   - **Excel (.xlsx)**: Ideal para análisis detallados en hojas de cálculo.
   - **PDF**: Formato listo para imprimir con logotipo corporativo.
   - **CSV**: Datos planos para integración con sistemas contables externos.

[IMAGEN: Menú desplegable para exportar reportes a Excel o PDF]
`,
  tags: ['reportes', 'analitica', 'kpi', 'exportar', 'corte', 'excel', 'pdf'],
  ultimaActualizacion: '2026-09-16',
};
