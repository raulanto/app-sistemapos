import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from '@ng-icons/lucide';
import {
  ThemeService,
  THEME_COLORS,
  THEME_RADIUSES,
  type ThemeColor,
  type ThemeMode,
  type ThemeRadius,
} from '../theme.service';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardSeparatorComponent } from '../../../shared/components/separator/separator.component';

@Component({
  selector: 'app-theme-customizer',
  imports: [
    CommonModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardSeparatorComponent,
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
    }),
  ],
  template: `
    <div class="w-full space-y-5 text-foreground">
      <!-- Encabezado con Reset -->
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <h3 class="text-sm font-semibold tracking-tight flex items-center gap-1.5">
            <ng-icon name="lucidePalette" class="size-4 text-primary" />
            Personalización de Apariencia
          </h3>
          <p class="text-xs text-muted-foreground">
            Ajusta los colores y estilo visual del sistema POS.
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

      <!-- SECCIÓN 1: MODO DE APARIENCIA -->
      <div class="space-y-2">
        <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Modo de Color
        </label>
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

      <!-- SECCIÓN 2: PALETA DE COLOR DE ÉNFASIS -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Color de Énfasis
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
              <!-- Círculo de color con indicador -->
              <span
                class="size-4 rounded-full shrink-0 flex items-center justify-center shadow-xs ring-1 ring-black/10 dark:ring-white/20"
                [style.background-color]="c.badgeHex"
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
      </div>

      <!-- SECCIÓN 3: RADIO DE ESQUINAS (BORDER RADIUS) -->
      <div class="space-y-2">
        <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Radio de Bordes
        </label>
        <div class="grid grid-cols-4 gap-2">
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

      <!-- SECCIÓN 4: VISTA PREVIA EN VIVO -->
      <div class="space-y-2 pt-1">
        <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <ng-icon name="lucideEye" class="size-3.5" />
          Vista Previa en Vivo
        </label>
        <div class="p-3.5 rounded-lg border border-border bg-card shadow-xs space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-foreground flex items-center gap-1.5">
              <ng-icon name="lucideSparkles" class="size-3.5 text-primary" />
              Botones y componentes activos
            </span>
            <z-badge zType="default" class="text-[10px]">
              Tema Activo
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
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ThemeCustomizerComponent {
  readonly themeService = inject(ThemeService);

  readonly colorThemes = THEME_COLORS;
  readonly radiusOptions = THEME_RADIUSES;

  setMode(mode: ThemeMode): void {
    this.themeService.setMode(mode);
  }

  setColor(color: ThemeColor): void {
    this.themeService.setColor(color);
  }

  setRadius(radius: ThemeRadius): void {
    this.themeService.setRadius(radius);
  }

  resetDefaults(): void {
    this.themeService.resetToDefaults();
  }
}
