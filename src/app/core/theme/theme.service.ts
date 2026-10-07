import { Injectable, signal, effect, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeBaseTone = 'zinc' | 'slate' | 'stone' | 'neutral' | 'mauve' | 'oled';
export type ThemeColor =
  | 'zinc'
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'amber'
  | 'cyan'
  | 'orange'
  | 'indigo'
  | 'teal'
  | 'ruby'
  | 'custom';
export type ThemeSidebarStyle = 'default' | 'contrast' | 'accent-tinted';
export type ThemeContrast = 'subtle' | 'default' | 'high';
export type ThemeRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Retrocompatibilidad con componentes existentes
export type Theme = 'dark' | 'light';

export interface ThemeBaseToneOption {
  id: ThemeBaseTone;
  name: string;
  description: string;
  badgeHex: string;
  onlyDark?: boolean;
}

export interface ThemeColorOption {
  id: ThemeColor;
  name: string;
  description: string;
  badgeHex: string;
  classBg?: string;
  isCustom?: boolean;
}

export interface ThemeSidebarStyleOption {
  id: ThemeSidebarStyle;
  name: string;
  description: string;
}

export interface ThemeContrastOption {
  id: ThemeContrast;
  name: string;
  description: string;
}

export interface ThemeRadiusOption {
  id: ThemeRadius;
  name: string;
  value: string;
  sublabel: string;
}

export const THEME_BASE_TONES: ThemeBaseToneOption[] = [
  {
    id: 'zinc',
    name: 'Zinc Moderno',
    description: 'Minimalista y equilibrado con sutil matiz frío',
    badgeHex: '#27272a',
  },
  {
    id: 'slate',
    name: 'Pizarra Azulada',
    description: 'Toque técnico y fresco de azul pizarra',
    badgeHex: '#334155',
  },
  {
    id: 'stone',
    name: 'Piedra Cálida',
    description: 'Sensación orgánica, terrenal y acogedora',
    badgeHex: '#44403c',
  },
  {
    id: 'neutral',
    name: 'Gris Neutro Puro',
    description: 'Monocromático absoluto sin tinte de color',
    badgeHex: '#262626',
  },
  {
    id: 'mauve',
    name: 'Lavanda / Malva',
    description: 'Sutil y refinado tinte violáceo',
    badgeHex: '#3b2d42',
  },
  {
    id: 'oled',
    name: 'Negro Puro OLED',
    description: 'Negro absoluto (#000000) y máximo contraste en modo oscuro',
    badgeHex: '#000000',
    onlyDark: true,
  },
];

export const THEME_COLORS: ThemeColorOption[] = [
  {
    id: 'zinc',
    name: 'Zinc / Grafito',
    description: 'Minimalista y monocromático',
    badgeHex: '#18181b',
  },
  {
    id: 'blue',
    name: 'Azul Océano',
    description: 'Corporativo, profesional y confiable',
    badgeHex: '#2563eb',
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    description: 'Fresco y dinámico para transacciones',
    badgeHex: '#059669',
  },
  {
    id: 'violet',
    name: 'Violeta / Púrpura',
    description: 'Moderno, elegante e innovador',
    badgeHex: '#7c3aed',
  },
  {
    id: 'rose',
    name: 'Rosa Carmesí',
    description: 'Vibrante, distinguido y expresivo',
    badgeHex: '#e11d48',
  },
  {
    id: 'amber',
    name: 'Ámbar Dorado',
    description: 'Cálido, enérgico y acogedor',
    badgeHex: '#d97706',
  },
  {
    id: 'cyan',
    name: 'Cian Turquesa',
    description: 'Tecnológico, nítido y refrescante',
    badgeHex: '#0891b2',
  },
  {
    id: 'orange',
    name: 'Naranja Coral',
    description: 'Entusiasta, dinámico y veloz',
    badgeHex: '#ea580c',
  },
  {
    id: 'indigo',
    name: 'Índigo Profundo',
    description: 'Elegante, sobrio y distintivo',
    badgeHex: '#4f46e5',
  },
  {
    id: 'teal',
    name: 'Verde Menta / Teal',
    description: 'Equilibrio perfecto entre verde y azul',
    badgeHex: '#0d9488',
  },
  {
    id: 'ruby',
    name: 'Rubí Borgoña',
    description: 'Intenso, refinado y exclusivo',
    badgeHex: '#be123c',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Elige cualquier color personalizado para tu marca',
    badgeHex: '#6366f1',
    isCustom: true,
  },
];

export const THEME_SIDEBAR_STYLES: ThemeSidebarStyleOption[] = [
  {
    id: 'default',
    name: 'Integrado',
    description: 'Fondo suave acorde a la paleta base del sistema',
  },
  {
    id: 'contrast',
    name: 'Alto Contraste',
    description: 'Sidebar oscura en modo claro y fondo profundo destacado',
  },
  {
    id: 'accent-tinted',
    name: 'Tintado de Acento',
    description: 'Matiz sutil del color de énfasis en el fondo lateral',
  },
];

export const THEME_CONTRASTS: ThemeContrastOption[] = [
  {
    id: 'subtle',
    name: 'Sutil',
    description: 'Bordes tenues y transiciones muy suaves',
  },
  {
    id: 'default',
    name: 'Equilibrado',
    description: 'Contraste estándar y balance visual óptimo',
  },
  {
    id: 'high',
    name: 'Alto Contraste',
    description: 'Bordes nítidos y marcada separación de tarjetas',
  },
];

export const THEME_RADIUSES: ThemeRadiusOption[] = [
  { id: 'none', name: 'Cuadrado', value: '0px', sublabel: '0px' },
  { id: 'sm', name: 'Recto', value: '0.375rem', sublabel: '6px' },
  { id: 'md', name: 'Equilibrado', value: '0.625rem', sublabel: '10px' },
  { id: 'lg', name: 'Redondeado', value: '1rem', sublabel: '16px' },
  { id: 'xl', name: 'Amplio', value: '1.25rem', sublabel: '20px' },
];

/**
 * Conversión robusta de sRGB HEX a OKLCH para colores personalizados dinámicos
 */
function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
  const num = parseInt(full, 16);
  if (isNaN(num)) return { l: 0.55, c: 0.18, h: 255 };

  const rSrgb = ((num >> 16) & 255) / 255;
  const gSrgb = ((num >> 8) & 255) / 255;
  const bSrgb = (num & 255) / 255;

  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lr = toLinear(rSrgb);
  const lg = toLinear(gSrgb);
  const lb = toLinear(bSrgb);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bVal = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(a * a + bVal * bVal);
  let H = (Math.atan2(bVal, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L, c: C, h: H };
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.getInitialMode());
  readonly baseTone = signal<ThemeBaseTone>(this.getInitialBaseTone());
  readonly color = signal<ThemeColor>(this.getInitialColor());
  readonly customHex = signal<string>(this.getInitialCustomHex());
  readonly sidebarStyle = signal<ThemeSidebarStyle>(this.getInitialSidebarStyle());
  readonly contrast = signal<ThemeContrast>(this.getInitialContrast());
  readonly radius = signal<ThemeRadius>(this.getInitialRadius());

  private readonly systemPrefersDark = signal<boolean>(this.getSystemDarkPreference());

  // Modo resuelto (true = dark, false = light)
  readonly isDark = computed<boolean>(() => {
    const currentMode = this.mode();
    if (currentMode === 'system') {
      return this.systemPrefersDark();
    }
    return currentMode === 'dark';
  });

  // Retrocompatibilidad con componentes que consumen currentTheme()
  readonly currentTheme = computed<Theme>(() => (this.isDark() ? 'dark' : 'light'));

  readonly currentBaseToneOption = computed<ThemeBaseToneOption>(
    () => THEME_BASE_TONES.find(b => b.id === this.baseTone()) ?? THEME_BASE_TONES[0]
  );

  readonly currentColorOption = computed<ThemeColorOption>(() => {
    const col = this.color();
    if (col === 'custom') {
      return {
        id: 'custom',
        name: 'Personalizado',
        description: `Color de marca: ${this.customHex()}`,
        badgeHex: this.customHex(),
        isCustom: true,
      };
    }
    return THEME_COLORS.find(c => c.id === col) ?? THEME_COLORS[0];
  });

  readonly currentSidebarStyleOption = computed<ThemeSidebarStyleOption>(
    () => THEME_SIDEBAR_STYLES.find(s => s.id === this.sidebarStyle()) ?? THEME_SIDEBAR_STYLES[0]
  );

  readonly currentContrastOption = computed<ThemeContrastOption>(
    () => THEME_CONTRASTS.find(c => c.id === this.contrast()) ?? THEME_CONTRASTS[1]
  );

  readonly currentRadiusOption = computed<ThemeRadiusOption>(
    () => THEME_RADIUSES.find(r => r.id === this.radius()) ?? THEME_RADIUSES[3]
  );

  constructor() {
    // Escucha cambios del sistema en tiempo real
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        this.systemPrefersDark.set(e.matches);
      };
      mediaQuery.addEventListener('change', listener);
    }

    // Efecto reactivo para aplicar estilos en el DOM y persistir en localStorage
    effect(() => {
      const mode = this.mode();
      const baseTone = this.baseTone();
      const color = this.color();
      const customHex = this.customHex();
      const sidebarStyle = this.sidebarStyle();
      const contrast = this.contrast();
      const radius = this.radius();
      const dark = this.isDark();

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ui-theme-mode', mode);
        localStorage.setItem('ui-theme-base', baseTone);
        localStorage.setItem('ui-theme-color', color);
        localStorage.setItem('ui-theme-custom-hex', customHex);
        localStorage.setItem('ui-theme-sidebar', sidebarStyle);
        localStorage.setItem('ui-theme-contrast', contrast);
        localStorage.setItem('ui-theme-radius', radius);
        localStorage.setItem('ui-theme', dark ? 'dark' : 'light');
      }

      if (typeof document !== 'undefined') {
        const root = document.documentElement;

        // Clase dark
        if (dark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }

        // Atributos de configuración
        root.setAttribute('data-theme-base', baseTone);
        root.setAttribute('data-theme-color', color);
        root.setAttribute('data-theme-sidebar', sidebarStyle);
        root.setAttribute('data-theme-contrast', contrast);
        root.setAttribute('data-theme-radius', radius);

        // Si es color personalizado, inyectar variables calculadas
        if (color === 'custom') {
          const { l, c, h } = hexToOklch(customHex);
          if (dark) {
            const darkL = Math.min(0.80, Math.max(0.66, l + 0.15));
            const darkC = Math.min(0.24, Math.max(0.12, c));
            root.style.setProperty('--primary', `oklch(${darkL.toFixed(3)} ${darkC.toFixed(3)} ${h.toFixed(1)})`);
            root.style.setProperty('--primary-foreground', `oklch(0.14 0.02 ${h.toFixed(1)})`);
            root.style.setProperty('--ring', `oklch(${darkL.toFixed(3)} ${darkC.toFixed(3)} ${h.toFixed(1)})`);
            root.style.setProperty('--sidebar-primary', `oklch(${darkL.toFixed(3)} ${darkC.toFixed(3)} ${h.toFixed(1)})`);
            root.style.setProperty('--sidebar-primary-foreground', `oklch(0.14 0.02 ${h.toFixed(1)})`);
            root.style.setProperty('--sidebar-ring', `oklch(${darkL.toFixed(3)} ${darkC.toFixed(3)} ${h.toFixed(1)})`);
            root.style.setProperty('--chart-1', `oklch(${darkL.toFixed(3)} ${darkC.toFixed(3)} ${h.toFixed(1)})`);
          } else {
            const lightL = Math.min(0.56, Math.max(0.42, l));
            const lightC = Math.min(0.26, Math.max(0.12, c));
            const fgL = l > 0.65 ? '0.15 0.02' : '0.99 0';
            root.style.setProperty('--primary', `oklch(${lightL.toFixed(3)} ${lightC.toFixed(3)} ${h.toFixed(1)})`);
            root.style.setProperty('--primary-foreground', `oklch(${fgL} ${h.toFixed(1)})`);
            root.style.setProperty('--ring', `oklch(${lightL.toFixed(3)} ${lightC.toFixed(3)} ${h.toFixed(1)})`);
            root.style.setProperty('--sidebar-primary', `oklch(${lightL.toFixed(3)} ${lightC.toFixed(3)} ${h.toFixed(1)})`);
            root.style.setProperty('--sidebar-primary-foreground', `oklch(${fgL} ${h.toFixed(1)})`);
            root.style.setProperty('--sidebar-ring', `oklch(${lightL.toFixed(3)} ${lightC.toFixed(3)} ${h.toFixed(1)})`);
            root.style.setProperty('--chart-1', `oklch(${lightL.toFixed(3)} ${lightC.toFixed(3)} ${h.toFixed(1)})`);
          }
        } else {
          // Limpiar estilos inline para que prevalezcan las clases de stylesheet
          root.style.removeProperty('--primary');
          root.style.removeProperty('--primary-foreground');
          root.style.removeProperty('--ring');
          root.style.removeProperty('--sidebar-primary');
          root.style.removeProperty('--sidebar-primary-foreground');
          root.style.removeProperty('--sidebar-ring');
          root.style.removeProperty('--chart-1');
        }
      }
    });
  }

  private getInitialMode(): ThemeMode {
    if (typeof localStorage !== 'undefined') {
      const savedMode = localStorage.getItem('ui-theme-mode') as ThemeMode | null;
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        return savedMode;
      }
      const legacyTheme = localStorage.getItem('ui-theme') as Theme | null;
      if (legacyTheme === 'light' || legacyTheme === 'dark') {
        return legacyTheme;
      }
    }
    return 'system';
  }

  private getInitialBaseTone(): ThemeBaseTone {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ui-theme-base') as ThemeBaseTone | null;
      if (saved && THEME_BASE_TONES.some(b => b.id === saved)) {
        return saved;
      }
    }
    return 'zinc';
  }

  private getInitialColor(): ThemeColor {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ui-theme-color') as ThemeColor | null;
      if (saved && (saved === 'custom' || THEME_COLORS.some(c => c.id === saved))) {
        return saved;
      }
    }
    return 'zinc';
  }

  private getInitialCustomHex(): string {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ui-theme-custom-hex');
      if (saved && /^#[0-9a-fA-F]{6}$/.test(saved)) {
        return saved;
      }
    }
    return '#3b82f6';
  }

  private getInitialSidebarStyle(): ThemeSidebarStyle {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ui-theme-sidebar') as ThemeSidebarStyle | null;
      if (saved && THEME_SIDEBAR_STYLES.some(s => s.id === saved)) {
        return saved;
      }
    }
    return 'default';
  }

  private getInitialContrast(): ThemeContrast {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ui-theme-contrast') as ThemeContrast | null;
      if (saved && THEME_CONTRASTS.some(c => c.id === saved)) {
        return saved;
      }
    }
    return 'default';
  }

  private getInitialRadius(): ThemeRadius {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ui-theme-radius') as ThemeRadius | null;
      if (saved && THEME_RADIUSES.some(r => r.id === saved)) {
        return saved;
      }
    }
    return 'lg';
  }

  private getSystemDarkPreference(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  setBaseTone(base: ThemeBaseTone): void {
    this.baseTone.set(base);
  }

  setColor(color: ThemeColor): void {
    this.color.set(color);
  }

  setCustomHex(hex: string): void {
    if (/^#[0-9a-fA-F]{6}$/.test(hex) || /^#[0-9a-fA-F]{3}$/.test(hex)) {
      this.customHex.set(hex);
      if (this.color() !== 'custom') {
        this.color.set('custom');
      }
    }
  }

  setSidebarStyle(style: ThemeSidebarStyle): void {
    this.sidebarStyle.set(style);
  }

  setContrast(contrast: ThemeContrast): void {
    this.contrast.set(contrast);
  }

  setRadius(radius: ThemeRadius): void {
    this.radius.set(radius);
  }

  toggleTheme(): void {
    const isCurrentlyDark = this.isDark();
    this.setMode(isCurrentlyDark ? 'light' : 'dark');
  }

  resetToDefaults(): void {
    this.mode.set('system');
    this.baseTone.set('zinc');
    this.color.set('zinc');
    this.customHex.set('#3b82f6');
    this.sidebarStyle.set('default');
    this.contrast.set('default');
    this.radius.set('lg');
  }
}
