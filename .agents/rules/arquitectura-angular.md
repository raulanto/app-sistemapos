---
trigger: always_on
---

# Reglas de Arquitectura Angular — `app-sistemapos`

Documento vivo de convenciones obligatorias para este proyecto. Cualquier PR o generación de código (humano o IA) debe respetarlas. Pensado para vivir en la raíz del repo y ser leído por Claude Code / Copilot como contexto de arquitectura.

---

## 1. Estructura de carpetas — Package by Feature

```
src/app/
├── core/       # singletons: auth, interceptors, guards, layout raíz
├── shared/     # UI/pipes/directivas SIN lógica de negocio, reusables
└── features/   # un folder por dominio de negocio (1:1 con módulos del backend)
    └── <feature>/
        ├── data-access/     # services HTTP, resources, modelos/tipos
        ├── feature-*/       # componentes "smart" = páginas, conectadas a rutas
        ├── ui/              # componentes "dumb" propios del feature
        └── <feature>.routes.ts
```

**Regla:** ningún archivo vive suelto en `app/` fuera de `app.routes.ts`, `app.config.ts`, `app.component.ts`. Si algo no encaja en `core`, `shared` o `features`, es señal de que falta definir el feature al que pertenece.

**Regla:** `core` se importa una sola vez, en el bootstrap. Si un feature necesita algo de otro feature, la comunicación pasa por `data-access` (servicios), nunca importando componentes de un feature dentro de otro.

---

## 2. Dirección de dependencias (espejo del backend)

```
route → smart component (feature-*) → data-access (service) → HttpClient
```

- Un componente **nunca** llama `HttpClient` directo — siempre a través de un service en `data-access`.
- Un componente `ui/` (dumb) **nunca** inyecta servicios ni hace llamadas HTTP — solo recibe `input()` y emite `output()`.
- `shared/` no puede importar nada de `features/`. La flecha de dependencia es de una sola vía: `features → shared`, jamás al revés.

---

## 3. Standalone + Signals por defecto

- **Prohibido** `NgModule` para código nuevo. Todo componente/directiva/pipe es `standalone` (default en Angular 22, ni siquiera hay que declararlo).
- Estado de componente: `signal()`, `computed()`, `effect()`. Evitar `BehaviorSubject` para estado simple — solo usar RxJS cuando el flujo es genuinamente asíncrono/eventos (websockets, debounce de búsqueda, etc.).
- Inputs/outputs con la API de signals: `input()`, `input.required()`, `output()` — no decoradores `@Input()`/`@Output()` en código nuevo.
- Detección de cambios: `OnPush` implícito por zoneless. No usar `ChangeDetectorRef.detectChanges()` como parche — si hace falta, es señal de un signal mal diseñado.

---

## 4. Componentes: Smart vs Dumb (contenedor vs presentación)

| | Smart (`feature-*`) | Dumb (`ui/`) |
|---|---|---|
| Inyecta servicios | ✅ | ❌ |
| Conoce el dominio de negocio | ✅ | ❌ |
| Se referencia desde rutas | ✅ | ❌ |
| Recibe datos por `input()` | opcional | ✅ siempre |
| Emite eventos por `output()` | — | ✅ siempre |
| Reusable fuera del feature | ❌ | ✅ (candidato a `shared/ui`) |

**Regla:** si un componente `ui/` se repite en 2+ features, se promueve a `shared/ui`.

---

## 5. Rutas: lazy siempre, sin excepción

```ts
// app.routes.ts
{
  path: 'ventas',
  loadChildren: () => import('./features/ventas/ventas.routes'),
  canActivate: [authGuard],
}
```

- Cada feature expone sus propias rutas en `<feature>.routes.ts` con `loadComponent` para cada página.
- **Regla:** un cajero que solo usa `ventas` no debe descargar el bundle de `auditoria`. Verificar con `ng build --stats-json` + `webpack-bundle-analyzer` que no hay fugas de un feature a otro en el chunk inicial.
- Guards y resolvers son funciones (`CanActivateFn`, `ResolveFn`), nunca clases con `implements CanActivate`.

---

## 6. Data access: un service por agregado, tipado desde el backend

- Un service en `data-access/` por entidad/agregado (`usuario.service.ts`, `venta.service.ts`), no un mega-service por feature.
- Los tipos (`interface`/`type`) reflejan **exactamente** los schemas del `openapi.json` del backend — no se inventan campos ni se asume forma de respuesta.
- Preferir `httpResource()` sobre `HttpClient` + `subscribe()` manual cuando el caso es "cargar datos y mostrarlos" (listas, detalle). Reservar `subscribe()` explícito para mutaciones (crear, actualizar, eliminar) donde se necesita manejar el resultado con lógica.

---

## 7. Manejo de estado

- **Estado de servidor** (listas, entidades): vive en el `data-access` service del feature correspondiente, vía signals o `httpResource()`. No se duplica en cada componente.
- **Estado de sesión/global** (usuario autenticado, permisos, tema): vive en `core/`, expuesto como signals de solo lectura (`computed()`) hacia afuera.
- **Estado de UI efímero** (un modal abierto, un tab seleccionado): vive local en el componente, nunca sube a un store global.
- **Regla:** no se introduce NgRx/Signal Store hasta que un feature demuestre necesitarlo (estado compartido complejo entre 3+ componentes no relacionados por jerarquía). Empezar simple; escalar solo cuando duela.

---

## 8. Naming conventions

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente | `<nombre>.component.ts`, clase `PascalCase` + sufijo `Component` | `venta-list.component.ts` → `VentaListComponent` |
| Service | `<nombre>.service.ts` | `venta.service.ts` → `VentaService` |
| Guard | `<nombre>.guard.ts`, función `camelCase` + sufijo `Guard` | `auth.guard.ts` → `authGuard` |
| Interceptor | `<nombre>.interceptor.ts` | `auth.interceptor.ts` → `authInterceptor` |
| Modelo/tipo | `<nombre>.model.ts` | `venta.model.ts` |
| Rutas de feature | `<feature>.routes.ts` | `ventas.routes.ts` |
| Selector de componente | prefijo del proyecto, kebab-case | `app-venta-list` |

---

## 9. Formularios

- **Signal Forms** (estable en Angular 22) para formularios nuevos — evitar mezclar Reactive Forms clásico y Signal Forms en el mismo feature.
- Validaciones de negocio compartidas (ej. formato de folio, RFC, etc.) viven en `shared/validators/`, no repetidas por feature.

---

## 10. UI Kit

- Todo componente visual reusable (botón, input, tabla, modal, badge, alert) usa **Zard UI**, no se construyen versiones propias desde cero ni se mezclan con otra librería de componentes.
- Componentes de Zard UI se tratan como código propio una vez copiados (filosofía shadcn) — se pueden modificar, pero los cambios se documentan en el propio archivo si divergen mucho del original.

---

## 11. Testing

- Todo `data-access` service lleva test unitario con `HttpTestingController` (mock del backend, nunca llamadas reales).
- Todo componente `ui/` lleva al menos un test de render con sus `input()` mockeados.
- Los smart components se testean con foco en la orquestación (llama al service correcto, navega correcto), no en re-testear la lógica que ya cubre el service.

---

## 12. Qué NO hacer (anti-patrones prohibidos)

- ❌ `any` como tipo — si el tipo real del backend no se conoce, se marca `TODO` y se pregunta, no se usa `any` para silenciar el compilador.
- ❌ Lógica de negocio dentro de un componente `ui/`.
- ❌ Importar un componente de `features/ventas` dentro de `features/inventario` (o cualquier cruce directo entre features).
- ❌ `localStorage`/`sessionStorage` para tokens de sesión (ver plan de auth).
- ❌ Suscripciones manuales sin `takeUntilDestroyed()` o uso de signals/`toSignal()` — fugas de memoria en componentes long-lived (el shell del POS vive toda la jornada).
- ❌ `NgModule` nuevo, `@Input()`/`@Output()` decorador, `ChangeDetectorRef` manual.
- ❌ Endpoints o campos de API inventados sin verificar contra `openapi.json`.

---

## 13. Checklist antes de mergear un feature nuevo

- [ ] Rutas cargadas de forma lazy (`loadComponent`/`loadChildren`)
- [ ] Servicios tipados desde `openapi.json`, sin `any`
- [ ] Separación smart/dumb respetada
- [ ] Sin imports cruzados entre `features/*`
- [ ] Componentes de UI reusados desde Zard UI o `shared/ui`, no reinventados
- [ ] Tests del `data-access` service con `HttpTestingController`
- [ ] Guard de permisos aplicado si el módulo lo requiere (`modulo.accion`)