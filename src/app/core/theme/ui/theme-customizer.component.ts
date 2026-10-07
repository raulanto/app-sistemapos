import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSun,
  lucideMoon,
  lucideMonitor,
  lucideCheck,
  lucideRotateCcw,
  lucideSparkles,
  lucidePalette,
  lucideSlidersHorizontal,
  lucideEye,
  lucideLayers,
  lucidePanelLeft,
  lucideContrast,
  lucidePipette,
  lucideShieldAlert,
} from '@ng-icons/lucide';
import {
  ThemeService,
  THEME_BASE_TONES,
  THEME_COLORS,
  THEME_SIDEBAR_STYLES,
  THEME_CONTRASTS,
  THEME_RADIUSES,
  type ThemeBaseTone,
  type ThemeColor,
  type ThemeMode,
  type ThemeSidebarStyle,
  type ThemeContrast,
  type ThemeRadius,
} from '../theme.service';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardSeparatorComponent } from '../../../shared/components/separator/separator.component';
import { ZardSwitchComponent } from '../../../shared/components/switch/switch.component';

@Component({
  selector: 'app-theme-customizer',
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardSeparatorComponent,
    ZardSwitchComponent,
  ],
  providers: [
    provideIcons({
      lucideSun,
      lucideMoon,
      lucideMonitor,
      lucideCheck,
      lucideRotateCcw,
      lucideSparkles,
      lucidePalette,
      lucideSlidersHorizontal,
      lucideEye,
      lucideLayers,
      lucidePanelLeft,
      lucideContrast,
      lucidePipette,
      lucideShieldAlert,
    }),
  ],
  template: `
    <div class="w-full space-y-6 text-foreground">
      <!-- Encabezado con Reset -->
      <div class="flex items-center justify-between pb-1">
        <div class="space-y-0.5">
          <h3 class="text-sm font-semibold tracking-tight flex items-center gap-1.5">
            <ng-icon name="lucidePalette" class="size-4 text-primary" />
            Personalización de Apariencia y Colores
          </h3>
          <p class="text-xs text-muted-foreground">
            Ajusta los fondos, tonos de contraste, barra lateral y acentos de color del sistema.
          </p>
        </div>
        <button
          z-button
          zType="ghost"
          zSize="sm"
          class="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          (click)="resetDefaults()"
          title="Restablecer valores predeterminados"
        >
          <ng-icon name="lucideRotateCcw" class="size-3" />
          Restablecer
        </button>
      </div>

      <z-separator />

      <!-- SECCIÓN 1: MODO DE COLOR -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ng-icon name="lucideSun" class="size-3.5" />
            Modo de Luz
          </label>
          <span class="text-xs font-medium text-foreground capitalize">
            {{ themeService.mode() === 'system' ? 'Automático (Sistema)' : themeService.mode() === 'dark' ? 'Modo Oscuro' : 'Modo Claro' }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <!-- Modo Claro -->
          <button
            type="button"
            class="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer"
            [class.border-primary]="themeService.mode() === 'light'"
            [class.bg-primary/10]="themeService.mode() === 'light'"
            [class.text-primary]="themeService.mode() === 'light'"
            [class.border-border]="themeService.mode() !== 'light'"
            [class.hover:bg-muted/50]="themeService.mode() !== 'light'"
            [attr.aria-pressed]="themeService.mode() === 'light'"
            (click)="setMode('light')"
          >
            <ng-icon name="lucideSun" class="size-4" />
            <span>Claro</span>
          </button>

          <!-- Modo Oscuro -->
          <button
            type="button"
            class="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer"
            [class.border-primary]="themeService.mode() === 'dark'"
            [class.bg-primary/10]="themeService.mode() === 'dark'"
            [class.text-primary]="themeService.mode() === 'dark'"
            [class.border-border]="themeService.mode() !== 'dark'"
            [class.hover:bg-muted/50]="themeService.mode() !== 'dark'"
            [attr.aria-pressed]="themeService.mode() === 'dark'"
            (click)="setMode('dark')"
          >
            <ng-icon name="lucideMoon" class="size-4" />
            <span>Oscuro</span>
          </button>

          <!-- Modo Sistema -->
          <button
            type="button"
            class="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer"
            [class.border-primary]="themeService.mode() === 'system'"
            [class.bg-primary/10]="themeService.mode() === 'system'"
            [class.text-primary]="themeService.mode() === 'system'"
            [class.border-border]="themeService.mode() !== 'system'"
            [class.hover:bg-muted/50]="themeService.mode() !== 'system'"
            [attr.aria-pressed]="themeService.mode() === 'system'"
            (click)="setMode('system')"
          >
            <ng-icon name="lucideMonitor" class="size-4" />
            <span>Sistema</span>
          </button>
        </div>
      </div>

      <!-- SECCIÓN 2: ESCALA DE FONDO Y GRISES BASE -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ng-icon name="lucideLayers" class="size-3.5" />
            Tono Base de Fondo y Grises
          </label>
          <span class="text-xs font-medium text-foreground">
            {{ themeService.currentBaseToneOption().name }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          @for (b of baseTones; track b.id) {
            <button
              type="button"
              class="relative flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer group"
              [class.border-primary]="themeService.baseTone() === b.id"
              [class.bg-primary/5]="themeService.baseTone() === b.id"
              [class.ring-2]="themeService.baseTone() === b.id"
              [class.ring-primary/30]="themeService.baseTone() === b.id"
              [class.border-border]="themeService.baseTone() !== b.id"
              [class.hover:border-foreground/30]="themeService.baseTone() !== b.id"
              [class.hover:bg-muted/40]="themeService.baseTone() !== b.id"
              [attr.aria-pressed]="themeService.baseTone() === b.id"
              (click)="setBaseTone(b.id)"
              [title]="b.description"
            >
              <span
                class="size-4 rounded-full shrink-0 flex items-center justify-center shadow-xs ring-1 ring-black/10 dark:ring-white/20"
                [style.background-color]="b.badgeHex"
              >
                @if (themeService.baseTone() === b.id) {
                  <ng-icon name="lucideCheck" class="size-2.5 text-white" />
                }
              </span>

              <div class="truncate">
                <div class="font-medium text-xs text-foreground truncate">
                  {{ b.name }}
                </div>
                @if (b.onlyDark) {
                  <div class="text-[10px] text-muted-foreground">Solo oscuro</div>
                }
              </div>
            </button>
          }
        </div>
      </div>

      <!-- SECCIÓN 3: COLOR DE ÉNFASIS Y MARCA -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ng-icon name="lucidePalette" class="size-3.5" />
            Color de Énfasis (Primario)
          </label>
          <span class="text-xs font-medium text-foreground">
            {{ themeService.currentColorOption().name }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          @for (c of colorThemes; track c.id) {
            <button
              type="button"
              class="relative flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all cursor-pointer group"
              [class.border-primary]="themeService.color() === c.id"
              [class.bg-primary/5]="themeService.color() === c.id"
              [class.ring-2]="themeService.color() === c.id"
              [class.ring-primary/30]="themeService.color() === c.id"
              [class.border-border]="themeService.color() !== c.id"
              [class.hover:border-foreground/30]="themeService.color() !== c.id"
              [class.hover:bg-muted/40]="themeService.color() !== c.id"
              [attr.aria-pressed]="themeService.color() === c.id"
              (click)="setColor(c.id)"
              [title]="c.description"
            >
              <span
                class="size-4 rounded-full shrink-0 flex items-center justify-center shadow-xs ring-1 ring-black/10 dark:ring-white/20"
                [style.background-color]="c.id === 'custom' ? themeService.customHex() : c.badgeHex"
              >
                @if (themeService.color() === c.id) {
                  <ng-icon name="lucideCheck" class="size-2.5 text-white" />
                }
              </span>

              <span class="font-medium text-xs text-foreground truncate">
                {{ c.name.split('/')[0].trim() }}
              </span>
            </button>
          }
        </div>

        <!-- Selector personalizado si está activo -->
        @if (themeService.color() === 'custom') {
          <div class="flex items-center gap-3 p-3 rounded-lg border border-primary/40 bg-primary/5 mt-2 transition-all">
            <div class="relative flex items-center justify-center">
              <input
                type="color"
                [ngModel]="themeService.customHex()"
                (ngModelChange)="onCustomColorChange($event)"
                class="size-8 cursor-pointer rounded-md border-0 p-0 bg-transparent"
                title="Elegir color exacto"
              />
            </div>
            <div class="flex-1 space-y-0.5">
              <span class="text-xs font-medium text-foreground">Color de Marca Personalizado</span>
              <p class="text-[11px] text-muted-foreground font-mono">
                {{ themeService.customHex() }} (Cálculo OKLCH en tiempo real)
              </p>
            </div>
            <input
              type="text"
              [ngModel]="themeService.customHex()"
              (ngModelChange)="onCustomColorChange($event)"
              placeholder="#3b82f6"
              maxlength="7"
              class="w-24 h-8 px-2 text-xs font-mono rounded-md border border-input bg-background text-foreground uppercase text-center focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>
        }
      </div>

      <!-- SECCIÓN 4: ESTILOS DE BARRA LATERAL -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ng-icon name="lucidePanelLeft" class="size-3.5" />
            Estilo de Barra Lateral
          </label>
          <span class="text-xs font-medium text-foreground">
            {{ themeService.currentSidebarStyleOption().name }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          @for (s of sidebarStyles; track s.id) {
            <button
              type="button"
              class="flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center"
              [class.border-primary]="themeService.sidebarStyle() === s.id"
              [class.bg-primary/10]="themeService.sidebarStyle() === s.id"
              [class.text-primary]="themeService.sidebarStyle() === s.id"
              [class.border-border]="themeService.sidebarStyle() !== s.id"
              [class.hover:bg-muted/50]="themeService.sidebarStyle() !== s.id"
              [attr.aria-pressed]="themeService.sidebarStyle() === s.id"
              (click)="setSidebarStyle(s.id)"
              [title]="s.description"
            >
              <span>{{ s.name }}</span>
            </button>
          }
        </div>
      </div>

      <!-- SECCIÓN 5: CONTRASTE DE SUPERFICIE -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ng-icon name="lucideContrast" class="size-3.5" />
            Contraste de Superficies y Bordes
          </label>
          <span class="text-xs font-medium text-foreground">
            {{ themeService.currentContrastOption().name }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          @for (ct of contrastOptions; track ct.id) {
            <button
              type="button"
              class="flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center"
              [class.border-primary]="themeService.contrast() === ct.id"
              [class.bg-primary/10]="themeService.contrast() === ct.id"
              [class.text-primary]="themeService.contrast() === ct.id"
              [class.border-border]="themeService.contrast() !== ct.id"
              [class.hover:bg-muted/50]="themeService.contrast() !== ct.id"
              [attr.aria-pressed]="themeService.contrast() === ct.id"
              (click)="setContrast(ct.id)"
              [title]="ct.description"
            >
              <span>{{ ct.name }}</span>
            </button>
          }
        </div>
      </div>

      <!-- SECCIÓN 6: RADIO DE ESQUINAS -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ng-icon name="lucideSlidersHorizontal" class="size-3.5" />
            Radio de Bordes
          </label>
          <span class="text-xs font-medium text-foreground">
            {{ themeService.currentRadiusOption().name }} ({{ themeService.currentRadiusOption().sublabel }})
          </span>
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
          @for (r of radiusOptions; track r.id) {
            <button
              type="button"
              class="flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer"
              [class.border-primary]="themeService.radius() === r.id"
              [class.bg-primary/10]="themeService.radius() === r.id"
              [class.text-primary]="themeService.radius() === r.id"
              [class.border-border]="themeService.radius() !== r.id"
              [class.hover:bg-muted/50]="themeService.radius() !== r.id"
              [attr.aria-pressed]="themeService.radius() === r.id"
              (click)="setRadius(r.id)"
            >
              <span>{{ r.name }}</span>
              <span class="text-[10px] text-muted-foreground font-mono">{{ r.sublabel }}</span>
            </button>
          }
        </div>
      </div>

      <!-- SECCIÓN 7: VISTA PREVIA EN VIVO -->
      <div class="space-y-2 pt-1">
        <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <ng-icon name="lucideEye" class="size-3.5" />
          Vista Previa en Vivo de Componentes
        </label>
        <div class="p-4 rounded-lg border border-border bg-card shadow-xs space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ng-icon name="lucideSparkles" class="size-3.5 text-primary" />
              Superficie Activa: {{ themeService.currentBaseToneOption().name }}
            </span>
            <z-badge zType="default" class="text-[10px]">
              {{ themeService.currentColorOption().name.split('/')[0].trim() }}
            </z-badge>
          </div>

          <div class="flex items-center gap-2 pt-1 flex-wrap">
            <button z-button zType="default" zSize="sm" class="text-xs h-7">
              Botón Primario
            </button>
            <button z-button zType="outline" zSize="sm" class="text-xs h-7">
              Secundario
            </button>
            <button z-button zType="ghost" zSize="sm" class="text-xs h-7">
              Sutil
            </button>
            <button z-button zType="destructive" zSize="sm" class="text-xs h-7">
              Alerta
            </button>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-border/60">
            <span class="text-xs text-muted-foreground">Interruptor de prueba</span>
            <z-switch [zChecked]="true" />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ThemeCustomizerComponent {
  readonly themeService = inject(ThemeService);

  readonly baseTones = THEME_BASE_TONES;
  readonly colorThemes = THEME_COLORS;
  readonly sidebarStyles = THEME_SIDEBAR_STYLES;
  readonly contrastOptions = THEME_CONTRASTS;
  readonly radiusOptions = THEME_RADIUSES;

  setMode(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }

  setBaseTone(base: ThemeBaseTone): void {
    this.themeService.setBaseTone(base);
  }

  setColor(color: ThemeColor): void {
    this.themeService.setColor(color);
  }

  onCustomColorChange(hex: string): void {
    this.themeService.setCustomHex(hex);
  }

  setSidebarStyle(style: ThemeSidebarStyle): void {
    this.themeService.setSidebarStyle(style);
  }

  setContrast(contrast: ThemeContrast): void {
    this.themeService.setContrast(contrast);
  }

  setRadius(radius: ThemeRadius): void {
    this.themeService.setRadius(radius);
  }

  resetDefaults(): void {
    this.themeService.resetToDefaults();
  }
}
