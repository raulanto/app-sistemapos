---
name: Sistema POS
description: Sistema de punto de venta e inventarios de alta velocidad operativa y diseño moderno
colors:
  primary: "oklch(0.21 0.006 285.885)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.967 0.001 286.375)"
  muted: "oklch(0.967 0.001 286.375)"
  muted-foreground: "oklch(0.552 0.016 285.938)"
  destructive: "oklch(0.577 0.245 27.325)"
  neutral-bg: "oklch(1 0 0)"
  neutral-fg: "oklch(0.141 0 0)"
  border: "oklch(0.92 0.004 286.32)"
typography:
  display:
    fontFamily: "'Google Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "'Geist Mono Variable', monospace"
rounded:
  sm: "calc(1rem - 4px)"
  md: "calc(1rem - 2px)"
  lg: "1rem"
  xl: "calc(1rem + 4px)"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.neutral-fg}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: Sistema POS

## Overview

**Creative North Star: "Precision Control Desk"**

El sistema visual de `app-sistemapos` está concebido para ofrecer alta densidad informativa sin saturación visual, garantizando operaciones rápidas y eficientes en caja y almacén. Prioriza la legibilidad inmediata, el contraste limpio en modos claro y oscuro, y un estilo contemporáneo sustentado en Zard UI y Tailwind CSS v4.

**Key Characteristics:**
- **Claridad de alto contraste:** Jerarquía clara con tipografía Geist y Google Sans.
- **Densidad eficiente:** Espaciados controlados para vistas operativas multitarea.
- **Bordes suaves y superficies pulidas:** Radio base de 16px (`1rem`) adaptable para tarjetas y controles modal.

## Colors

El sistema utiliza colores OKLCH definidos en variables CSS con soporte nativo para temas claro y oscuro (`.dark`).

### Primary
- **Deep Slate/Charcoal** (`oklch(0.21 0.006 285.885)` / `.dark`: `oklch(0.92 0.004 286.32)`): Utilizado en botones de acción principal, encabezados fuertes e indicadores clave.

### Neutral
- **Clean Surface Background** (`oklch(1 0 0)` / `.dark`: `oklch(0.141 0 0)`): Fondo principal limpio para máxima legibilidad.
- **Foreground Text** (`oklch(0.141 0 0)` / `.dark`: `oklch(0.985 0 0)`): Texto primario de alto contraste.
- **Muted Surface** (`oklch(0.967 0.001 286.375)`): Fondos secundarios para filtros, campos de entrada deshabilitados o badges.
- **Border & Divider** (`oklch(0.92 0.004 286.32)`): Delimitadores sutiles entre secciones y celdas de tabla.

### Destructive
- **Vibrant Alert Red** (`oklch(0.577 0.245 27.325)`): Acciones de eliminación, estados de error y alertas críticas de stock.

### Named Rules
**The Single Focus Rule.** El color primario se reserva exclusivamente para acciones principales y estados activos de alta prioridad para guiar la vista del operador.

## Typography

**Display Font:** Google Sans (con fallbacks ui-sans-serif, system-ui)
**Body Font:** Geist Variable (sans-serif)
**Mono Font:** Geist Mono Variable (monospace, para montos, SKU y códigos de barras)

### Hierarchy
- **Display** (700, 1.875rem, 1.25): Títulos principales de sección y resúmenes de tablero.
- **Headline** (600, 1.25rem, 1.35): Títulos de tablas, encabezados de modales y filtros.
- **Title** (600, 1rem, 1.4): Subtítulos y nombres de productos.
- **Body** (400, 0.875rem, 1.5): Texto general, celdas de datos, etiquetas informativas.
- **Label / Mono** (500, 0.75rem-0.875rem, 1.4): Precios, montos de venta, SKUs y folios.

## Layout

- **Modelo espacial:** Grid flexible y Flexbox responsivo optimizados para escritorios de punto de venta y pantallas táctiles.
- **Densidad:** Alta en tablas e inventarios; espaciamiento equilibrado (8px / 16px / 24px).
- **Contenedores:** Anchos adaptativos con tarjetas y paneles laterales flotantes (`sidebar`).

## Elevation & Depth

Superficies mayormente planas con sutil elevación mediante bordes pulidos y sombras tenues en modales/popovers.

### Named Rules
**The Flat Surface Rule.** Las tarjetas y elementos de tabla descansan planos. Las sombras únicamente se activan en elementos superpuestos (dialogs, dropdowns, tooltips).

## Shapes

- **Radio base (`--radius`):** `1rem` (16px).
- **Escala de bordes:**
  - `sm`: `12px` (`calc(var(--radius) - 4px)`) para badges y chips.
  - `md`: `14px` (`calc(var(--radius) - 2px)`) para botones e inputs.
  - `lg`: `16px` para tarjetas y diálogos.

## Components

### Buttons
- **Shape:** Radio medio (14px)
- **Primary:** Fondo primario con texto de alto contraste, relleno `px-4 py-2`.
- **Secondary / Ghost:** Fondo transparente o `muted` con borde sutil.

### Inputs / Fields
- **Style:** Fondo transparente/card, borde `border-border`, radio `rounded-md`.
- **Focus:** Anillo de enfoque con transparencia (`outline-ring/50`).

### Cards & Tables
- **Cards:** Fondo `bg-card`, texto `text-card-foreground`, borde `border-border`, radio `rounded-lg`.
- **Tables:** Cabecera `bg-muted/50` con texto neutro en mayúsculas pequeñas; filas con hover interactivo.

## Do's and Don'ts

### Do:
- **Do** usar tipografía mono (`Geist Mono`) para precios, SKUs, códigos de barras y cantidades numéricas.
- **Do** mantener el diseño adaptable a temas claro/oscuro usando las variables semánticas (`bg-background`, `text-foreground`).
- **Do** usar componentes reusables de Zard UI para consistencia.

### Don't:
- **Don't** inventar colores fuera del esquema de variables OKLCH del proyecto.
- **Don't** aplicar sombreados pesados en elementos planos de la tabla o listas de inventario.
