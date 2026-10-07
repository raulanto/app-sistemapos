import { Injectable, signal, effect, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'zinc' | 'blue' | 'emerald' | 'violet' | 'rose' | 'amber' | 'cyan' | 'orange';
export type ThemeRadius = 'sm' | 'md' | 'lg' | 'xl';

// Retrocompatibilidad con componentes existentes
export type Theme = 'dark' | 'light';

export interface ThemeColorOption {
  id: ThemeColor;
  name: string;
  description: string;
  badgeHex: string;
  classBg: string;
}

export interface ThemeRadiusOption {
  id: ThemeRadius;
  name: string;
  value: string;
  sublabel: string;
}

export const THEME_COLORS: ThemeColorOption[] = [
  {
    id: 'zinc',
    name: 'Zinc / Grafito',
    description: 'Minimalista y monocromático',
    badgeHex: '#18181b',
    classBg: 'bg-zinc-900 dark:bg-zinc-100',
  },
  {
    id: 'blue',
    name: 'Azul Océano',
    description: 'Corporativo, profesional y confiable',
    badgeHex: '#2563eb',
    classBg: 'bg-blue-600',
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    description: 'Fresco y dinámico para punto de venta',
    badgeHex: '#059669',
    classBg: 'bg-emerald-600',
  },
  {
    id: 'violet',
    name: 'Violeta / Púrpura',
    description: 'Moderno, elegante e innovador',
    badgeHex: '#7c3aed',
    classBg: 'bg-violet-600',
  },
  {
    id: 'rose',
    name: 'Rosa Carmesí',
    description: 'Vibrante, distinguido y expresivo',
    badgeHex: '#e11d48',
    classBg: 'bg-rose-600',
  },
  {
    id: 'amber',
    name: 'Ámbar Dorado',
    description: 'Cálido, enérgico y acogedor',
    badgeHex: '#d97706',
    classBg: 'bg-amber-600',
  },
  {
    id: 'cyan',
    name: 'Cian Turquesa',
    description: 'Tecnológico, nítido y refrescante',
    badgeHex: '#0891b2',
    classBg: 'bg-cyan-600',
  },
  {
    id: 'orange',
    name: 'Naranja Coral',
    description: 'Entusiasta, dinámico y veloz',
    badgeHex: '#ea580c',
    classBg: 'bg-orange-600',
  },
];

export const THEME_RADIUSES: ThemeRadiusOption[] = [
  { id: 'sm', name: 'Recto', value: '0.375rem', sublabel: '6px' },
  { id: 'md', name: 'Equilibrado', value: '0.625rem', sublabel: '10px' },
  { id: 'lg', name: 'Redondeado', value: '1rem', sublabel: '16px' },
  { id: 'xl', name: 'Amplio', value: '1.25rem', sublabel: '20px' },
];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.getInitialMode());
  readonly color = signal<ThemeColor>(this.getInitialColor());
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

  readonly currentColorOption = computed<ThemeColorOption>(
    () => THEME_COLORS.find(c => c.id === this.color()) ?? THEME_COLORS[0]
  );

  readonly currentRadiusOption = computed<ThemeRadiusOption>(
    () => THEME_RADIUSES.find(r => r.id === this.radius()) ?? THEME_RADIUSES[2]
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

    // Efecto reactivo para aplicar estilos y persistir
    effect(() => {
      const mode = this.mode();
      const color = this.color();
      const radius = this.radius();
      const dark = this.isDark();

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ui-theme-mode', mode);
        localStorage.setItem('ui-theme-color', color);
        localStorage.setItem('ui-theme-radius', radius);
        // Persistencia para compatibilidad
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

        // Atributos de color y radio
        root.setAttribute('data-theme-color', color);
        root.setAttribute('data-theme-radius', radius);
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

  private getInitialColor(): ThemeColor {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('ui-theme-color') as ThemeColor | null;
      if (saved && THEME_COLORS.some(c => c.id === saved)) {
        return saved;
      }
    }
    return 'zinc';
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

  setColor(color: ThemeColor): void {
    this.color.set(color);
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
    this.color.set('zinc');
    this.radius.set('lg');
  }
}
