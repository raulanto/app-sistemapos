# Sistema POS — Frontend

Aplicación web de **Punto de Venta (POS)** construida con **Angular 22** y **Tailwind CSS 4**. Consume una API REST (Laravel) y cubre todo el ciclo operativo de un negocio: ventas, inventario, clientes, cajas, promociones, reportes y auditoría.

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Angular (standalone, signals, zoneless) | 22.1 |
| Lenguaje | TypeScript | 6.0 |
| Estilos | Tailwind CSS | 4.1 |
| UI Kit | Zard UI (filosofía shadcn para Angular) | — |
| Iconos | ng-icons + Lucide | 35.x |
| Gráficos | ECharts vía ngx-echarts | 22.x |
| Mapas | Leaflet | 1.9 |
| Notificaciones | ngx-sonner | 3.x |
| Testing | Vitest | 4.x |
| Runtime | Node.js | 22.x |
| Package Manager | npm | 10.x |

## Requisitos previos

- **Node.js** ≥ 22
- **npm** ≥ 10
- **Angular CLI** — se usa vía `npx`, no es necesario instalarlo globalmente
- **Backend API** corriendo en `http://localhost:8000/api/v1` (o la URL configurada en los archivos de entorno)

## Instalación y arranque

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd app-sistemapos

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm start
# equivale a: ng serve
```

La app estará disponible en **http://localhost:4200**. Se recarga automáticamente con cada cambio en el código fuente.

## Configuración de entorno

Los archivos de entorno viven en `src/environments/`:

| Archivo | Uso |
|---|---|
| `environment.development.ts` | Desarrollo local (`ng serve`) |
| `environment.ts` | Build de producción (`ng build`) |

Ambos exponen la variable `apiUrl` que apunta al backend:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1'
};
```

> Para apuntar a otro backend, edita `apiUrl` en el archivo de entorno correspondiente.

## Módulos funcionales (features)

Cada feature se carga de forma **lazy** y es independiente. Un cajero que solo usa ventas no descarga el bundle de auditoría.

| Feature | Ruta | Descripción |
|---|---|---|
| **Auth** | `/auth` | Login, registro, refresh token. Sin layout. |
| **Ventas** | `/ventas` | POS (punto de venta), listado de ventas, detalle, historial de turnos. |
| **Inventario** | `/inventario` | Catálogo de productos (CRUD, imágenes, presentaciones, kits), categorías, unidades de medida, movimientos de stock, transferencias entre sucursales. |
| **Clientes** | `/clientes` | Gestión de clientes, crédito y monedero (cashback). |
| **Cajas** | `/cajas` | Terminales, apertura/cierre de turnos, arqueo, movimientos de efectivo. |
| **Promociones** | `/promociones` | Creación y gestión de promociones aplicables a ventas. |
| **Reportes** | `/reportes` | Dashboards y reportes con gráficos (ECharts). |
| **Auditoría** | `/auditoria` | Bitácora de acciones del sistema. |
| **Usuarios** | `/usuarios` | CRUD de usuarios y gestión de roles/permisos. |
| **Sucursales** | `/sucursales` | Administración de sucursales (datos, imagen, ubicación). |

La ruta raíz (`/`) redirige a `/ventas`.

## Arquitectura del proyecto

```
src/app/
├── core/                         # Singletons: auth, layout, theme, sucursal activa
│   ├── auth/                     # Guards, interceptors, servicio de autenticación
│   │   ├── api/                  # AuthService (login, refresh, permisos)
│   │   ├── guards/               # authGuard (protege rutas)
│   │   ├── interceptors/         # authInterceptor (inyecta token en cada request)
│   │   ├── models/               # Tipos de auth (LoginRequest, etc.)
│   │   └── permissions.ts        # Catálogo de permisos por módulo
│   ├── layout/                   # Shell principal (sidebar + header + router-outlet)
│   ├── theme/                    # Servicio de tema claro/oscuro
│   └── sucursal/                 # Sucursal activa en sesión
│
├── shared/                       # Reutilizable, SIN lógica de negocio
│   ├── components/               # Zard UI: 44 componentes (button, table, dialog, etc.)
│   ├── core/                     # Providers de Zard
│   ├── services/                 # Servicios compartidos
│   └── utils/                    # Utilidades (formateo, validaciones comunes)
│
├── features/                     # Un folder por dominio de negocio
│   └── <feature>/
│       ├── data-access/          # Services HTTP, modelos/tipos
│       │   └── models/           # Tipos agrupados por entidad (*.model.ts + barrel index)
│       ├── feature-*/            # Componentes "smart" (páginas conectadas a rutas)
│       ├── ui/                   # Componentes "dumb" (solo input/output, sin servicios)
│       └── <feature>.routes.ts   # Rutas lazy del feature
│
├── app.routes.ts                 # Rutas raíz con lazy loading por feature
├── app.config.ts                 # Providers globales (router, HTTP, auth, Zard)
└── app.ts                        # Componente raíz
```

### Convenciones clave

- **Standalone components** — no se usan NgModules.
- **Signals** para estado reactivo (`signal()`, `computed()`, `input()`, `output()`).
- **Smart vs Dumb** — los componentes `feature-*` inyectan servicios y se conectan a rutas; los `ui/` solo reciben `input()` y emiten `output()`.
- **Lazy loading** en todas las rutas — cada feature tiene su propio chunk de build.
- **Zard UI** — librería de componentes tipo shadcn adaptada para Angular con Tailwind CSS.

## Sistema de permisos

El catálogo de permisos (`core/auth/permissions.ts`) define acciones por módulo:

| Módulo | Acciones |
|---|---|
| Usuarios | crear, leer, editar, desactivar |
| Roles | gestionar |
| Inventario | crear, editar, leer, movimiento |
| Clientes | crear, leer, editar, eliminar, crédito |
| Monedero | ajustar |
| Ventas | crear, leer, anular, devolver, descuento manual |
| Caja | operar, administrar, forzar cierre, autorizar diferencia, ver histórico |
| Promociones | crear, editar, leer |
| Reportes | leer |
| Auditoría | leer |

Los guards y componentes validan permisos contra los roles del usuario autenticado.

## Scripts disponibles

```bash
npm start         # Servidor de desarrollo (localhost:4200)
npm run build     # Build de producción → dist/app-sistemapos/
npm run watch     # Build en modo watch (development)
npm test          # Tests unitarios con Vitest
```

## Build de producción

```bash
npm run build
```

Los artefactos se generan en `dist/app-sistemapos/`. El build aplica optimizaciones automáticas: tree-shaking, minificación y code-splitting por lazy routes.

## Testing

```bash
npm test
```

Usa **Vitest** como test runner. Los tests de servicios HTTP usan `HttpTestingController` para mockear el backend.

## Docker

El proyecto incluye un **Dockerfile multi-stage** (Node 22 Alpine → Nginx Alpine) que genera una imagen de producción liviana (~40 MB).

### Construir la imagen

```bash
docker build -t sistemapos .
```

### Levantar el contenedor

```bash
docker run -d -p 8080:80 --name sistemapos sistemapos
```

La app queda disponible en **http://localhost:8080**.

### Apuntar a otro backend (API)

Por defecto la app usa la `apiUrl` compilada en los archivos de entorno. Si necesitas cambiarla sin recompilar, edita `src/environments/environment.ts` antes del build:

```bash
# Ejemplo: apuntar al backend de staging
sed -i "s|http://localhost:8000/api/v1|https://api.staging.example.com/api/v1|" src/environments/environment.ts
docker build -t sistemapos:staging .
```

### Archivos Docker

| Archivo | Propósito |
|---|---|
| `Dockerfile` | Build multi-stage: compila con Node → sirve con Nginx |
| `nginx.conf` | Config de Nginx optimizada para SPA (gzip, cache, fallback a `index.html`) |
| `.dockerignore` | Excluye `node_modules`, `.angular`, `.git`, etc. del contexto de build |

---

## Estructura de un feature (ejemplo: Inventario)

```
features/inventario/
├── data-access/
│   ├── models/                       # Tipos agrupados por entidad
│   │   ├── producto.model.ts         # ProductoResponse, CrearProductoRequest, etc.
│   │   ├── imagen.model.ts           # ImagenResponse, constantes de validación
│   │   ├── componente.model.ts       # Kit: ComponenteResponse, receta
│   │   ├── unidad.model.ts           # Presentaciones (reja, botella, etc.)
│   │   ├── unidad-medida.model.ts    # Catálogo: kg, ml, pza, etc.
│   │   ├── categoria.model.ts        # Categorías de producto
│   │   ├── existencia.model.ts       # Stock y desglose por sucursal
│   │   ├── movimiento.model.ts       # Entradas, salidas, transferencias
│   │   └── index.ts                  # Barrel (re-exporta todo)
│   ├── producto.service.ts           # CRUD productos + imágenes + componentes
│   ├── categoria.service.ts          # CRUD categorías
│   ├── movimiento.service.ts         # Movimientos de inventario
│   └── unidad-medida.service.ts      # Catálogo de unidades de medida
├── feature-producto-list/            # Smart: listado con filtros y KPIs
├── feature-producto-create/          # Smart: formulario de alta
├── feature-producto-detail/          # Smart: detalle, stock, galería, kits
├── feature-categoria-list/           # Smart: listado de categorías
├── ui/                               # Dumb components
│   ├── producto-form-sheet/          # Formulario de producto (sheet lateral)
│   ├── producto-table/               # Tabla de productos
│   ├── producto-filtros/             # Filtros de búsqueda
│   ├── imagen-galeria/               # Galería de imágenes con upload
│   ├── componente-form-sheet/        # Formulario de kit/receta
│   ├── unidad-form-sheet/            # Formulario de presentaciones
│   ├── unidad-medida-form-sheet/     # Formulario de catálogo de medidas
│   ├── movimiento-form-sheet/        # Formulario de movimientos de stock
│   ├── transferencia-form-sheet/     # Formulario de transferencias
│   └── categoria-form-sheet/         # Formulario de categorías
└── inventario.routes.ts              # Rutas lazy del módulo
```
