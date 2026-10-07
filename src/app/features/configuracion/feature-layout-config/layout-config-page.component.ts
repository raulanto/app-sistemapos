import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowUp,
  lucideArrowDown,
  lucideEye,
  lucideEyeOff,
  lucideRotateCcw,
  lucideDownload,
  lucideUpload,
  lucideCopy,
  lucideCheck,
  lucidePalette,
  lucideSparkles,
  lucideSlidersHorizontal,
  lucideGrid,
  lucideLayers,
  lucideCheckCircle2,
  lucideAlertTriangle,
  lucideShield,
} from '@ng-icons/lucide';

import { LayoutConfigService } from '@/core/layout/config/layout-config.service';
import {
  SidebarCollapsibleMode,
  ContentContainerWidth,
  LayoutDensity,
} from '@/core/layout/config/layout-config.model';
import { ThemeCustomizerComponent } from '@/core/theme/ui/theme-customizer.component';

import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardCardImports } from '@/shared/components/card/card.imports';
import { ZardSeparatorComponent } from '@/shared/components/separator/separator.component';
import { ZardSwitchComponent } from '@/shared/components/switch/switch.component';
import { ZardTabsImports } from '@/shared/components/tabs/tabs.imports';
import { ZardInputComponent } from '@/shared/components/input/input.component';
import { ZardSonnerService } from '@/shared/components/sonner/sonner.service';

@Component({
  selector: 'app-layout-config-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ...ZardCardImports,
    ZardSeparatorComponent,
    ZardSwitchComponent,
    ...ZardTabsImports,
    ZardInputComponent,
    ThemeCustomizerComponent,
  ],
  providers: [
    provideIcons({
      lucideArrowUp,
      lucideArrowDown,
      lucideEye,
      lucideEyeOff,
      lucideRotateCcw,
      lucideDownload,
      lucideUpload,
      lucideCopy,
      lucideCheck,
      lucidePalette,
      lucideSparkles,
      lucideSlidersHorizontal,
      lucideGrid,
      lucideLayers,
      lucideCheckCircle2,
      lucideAlertTriangle,
      lucideShield,
    }),
  ],
  template: `
    <div class="w-full space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Encabezado de la Vista -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl text-foreground font-display flex items-center gap-2.5">
            <ng-icon name="lucideSlidersHorizontal" class="size-7 text-primary" />
            Configuración del Layout y Sistema
          </h1>
          <p class="text-sm text-muted-foreground mt-1">
            Personaliza el orden de los módulos, menú lateral, cabecera, disposición del espacio de trabajo y temas visuales.
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            z-button
            zType="outline"
            zSize="sm"
            class="gap-1.5"
            (click)="resetDefaults()"
            title="Restablecer a valores iniciales"
          >
            <ng-icon name="lucideRotateCcw" class="size-4" />
            Restablecer
          </button>

          <button
            z-button
            zType="default"
            zSize="sm"
            class="gap-1.5"
            (click)="exportJson()"
          >
            <ng-icon name="lucideCopy" class="size-4" />
            Copiar JSON
          </button>
        </div>
      </div>

      <!-- Pestañas de Configuración por Apartado -->
      <z-tab-group class="space-y-6">
        <!-- TAB 1: MENÚ LATERAL Y MÓDULOS -->
        <z-tab label="Menú y Módulos" zIcon="lucideGrid">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            <!-- Columna Principal: Reordenamiento y Visibilidad de Módulos -->
            <z-card class="lg:col-span-2">
              <z-card-header class="border-b border-border/50 pb-4">
                <div class="flex items-center justify-between">
                  <div>
                    <z-card-title zTitle="Módulos de la Barra Lateral" class="text-base font-semibold" />
                    <z-card-description
                      zDescription="Mueve el orden de los módulos hacia arriba o abajo y activa/desactiva su visibilidad"
                      class="text-xs text-muted-foreground"
                    />
                  </div>
                  <z-badge zType="outline" class="text-xs font-mono">
                    {{ visibleModulesCount() }} / {{ itemsOrder().length }} activos
                  </z-badge>
                </div>
              </z-card-header>

              <z-card-content class="pt-4 space-y-2">
                @for (item of itemsOrder(); track item.id; let idx = $index; let first = $first; let last = $last) {
                  <div
                    class="flex items-center justify-between gap-3 p-3 rounded-lg border transition-all"
                    [class.border-border]="item.visible"
                    [class.bg-card]="item.visible"
                    [class.border-border/40]="!item.visible"
                    [class.bg-muted/30]="!item.visible"
                    [class.opacity-60]="!item.visible"
                  >
                    <!-- Indicador y Título del Módulo -->
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-mono font-semibold text-muted-foreground shrink-0">
                        {{ idx + 1 }}
                      </span>
                      <div class="space-y-0.5 min-w-0">
                        <p class="text-sm font-medium text-foreground truncate">
                          {{ item.title }}
                        </p>
                        @if (item.category) {
                          <span class="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {{ item.category }}
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Controles: Mover Arriba/Abajo + Switch Visibilidad -->
                    <div class="flex items-center gap-2 shrink-0">
                      <!-- Mover Arriba -->
                      <button
                        type="button"
                        class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        [disabled]="first"
                        (click)="moveUp(item.id)"
                        title="Mover arriba"
                        aria-label="Mover arriba"
                      >
                        <ng-icon name="lucideArrowUp" class="size-4" />
                      </button>

                      <!-- Mover Abajo -->
                      <button
                        type="button"
                        class="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        [disabled]="last"
                        (click)="moveDown(item.id)"
                        title="Mover abajo"
                        aria-label="Mover abajo"
                      >
                        <ng-icon name="lucideArrowDown" class="size-4" />
                      </button>

                      <!-- Switch de Visibilidad -->
                      <z-switch
                        [zChecked]="item.visible"
                        (click)="toggleVisibility(item.id)"
                        [title]="item.visible ? 'Ocultar del menú' : 'Mostrar en menú'"
                      />
                    </div>
                  </div>
                }
              </z-card-content>
            </z-card>

            <!-- Columna Lateral: Opciones de Estructura de la Barra Lateral -->
            <z-card class="lg:col-span-1 space-y-4">
              <z-card-header class="border-b border-border/50 pb-4">
                <z-card-title zTitle="Comportamiento del Sidebar" class="text-base font-semibold" />
                <z-card-description zDescription="Modo de colapso y componentes visibles" class="text-xs text-muted-foreground" />
              </z-card-header>

              <z-card-content class="space-y-4 text-sm">
                <!-- Modo de Colapso -->
                <div class="space-y-2">
                  <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Modo al Colapsar
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      class="p-2.5 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer"
                      [class.border-primary]="sidebarConfig().collapsible === 'icon'"
                      [class.bg-primary/10]="sidebarConfig().collapsible === 'icon'"
                      [class.text-primary]="sidebarConfig().collapsible === 'icon'"
                      [class.border-border]="sidebarConfig().collapsible !== 'icon'"
                      (click)="setSidebarCollapsible('icon')"
                    >
                      Iconos Compactos
                    </button>
                    <button
                      type="button"
                      class="p-2.5 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer"
                      [class.border-primary]="sidebarConfig().collapsible === 'offcanvas'"
                      [class.bg-primary/10]="sidebarConfig().collapsible === 'offcanvas'"
                      [class.text-primary]="sidebarConfig().collapsible === 'offcanvas'"
                      [class.border-border]="sidebarConfig().collapsible !== 'offcanvas'"
                      (click)="setSidebarCollapsible('offcanvas')"
                    >
                      Ocultar Completo
                    </button>
                  </div>
                </div>

                <z-separator />

                <!-- Título del Grupo -->
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Etiqueta de Sección
                  </label>
                  <input
                    z-input
                    type="text"
                    [ngModel]="sidebarConfig().groupLabel"
                    (ngModelChange)="updateGroupLabel($event)"
                    placeholder="Ej. Plataforma, Módulos..."
                  />
                </div>

                <z-separator />

                <!-- Toggles de Elementos del Sidebar -->
                <div class="space-y-3 pt-1">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-xs text-foreground">Selector de Sucursal</p>
                      <p class="text-[11px] text-muted-foreground">Cabecera de empresa/sucursal</p>
                    </div>
                    <z-switch
                      [zChecked]="sidebarConfig().showTeamSwitcher"
                      (zCheckedChange)="updateSidebarParam('showTeamSwitcher', $event)"
                    />
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-xs text-foreground">Buscador Rápido (Ctrl+K)</p>
                      <p class="text-[11px] text-muted-foreground">Barra de búsqueda en menú</p>
                    </div>
                    <z-switch
                      [zChecked]="sidebarConfig().showSearch"
                      (zCheckedChange)="updateSidebarParam('showSearch', $event)"
                    />
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-xs text-foreground">Menú Secundario</p>
                      <p class="text-[11px] text-muted-foreground">Accesos directos de ayuda</p>
                    </div>
                    <z-switch
                      [zChecked]="sidebarConfig().showSecondaryNav"
                      (zCheckedChange)="updateSidebarParam('showSecondaryNav', $event)"
                    />
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-xs text-foreground">Menú de Usuario</p>
                      <p class="text-[11px] text-muted-foreground">Tarjeta de sesión en el pie</p>
                    </div>
                    <z-switch
                      [zChecked]="sidebarConfig().showUserMenu"
                      (zCheckedChange)="updateSidebarParam('showUserMenu', $event)"
                    />
                  </div>
                </div>
              </z-card-content>
            </z-card>
          </div>
        </z-tab>

        <!-- TAB 2: CABECERA / HEADER -->
        <z-tab label="Cabecera Superior" zIcon="lucideSlidersHorizontal">
          <div class="max-w-3xl mx-auto pt-4">
            <z-card>
              <z-card-header class="border-b border-border/50 pb-4">
                <z-card-title zTitle="Opciones de la Barra Superior" class="text-base font-semibold" />
                <z-card-description zDescription="Controla qué elementos se muestran en la cabecera del layout" class="text-xs text-muted-foreground" />
              </z-card-header>

              <z-card-content class="pt-5 space-y-4">
                <div class="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <p class="font-medium text-sm text-foreground">Cabecera Fija (Sticky Header)</p>
                    <p class="text-xs text-muted-foreground">Permanece fija en la parte superior con efecto de desenfoque al hacer scroll</p>
                  </div>
                  <z-switch
                    [zChecked]="headerConfig().sticky"
                    (zCheckedChange)="updateHeaderParam('sticky', $event)"
                  />
                </div>

                <div class="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <p class="font-medium text-sm text-foreground">Botón de Barra Lateral</p>
                    <p class="text-xs text-muted-foreground">Botón de colapso y despliegue rápido del sidebar</p>
                  </div>
                  <z-switch
                    [zChecked]="headerConfig().showSidebarTrigger"
                    (zCheckedChange)="updateHeaderParam('showSidebarTrigger', $event)"
                  />
                </div>

                <div class="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <p class="font-medium text-sm text-foreground">Migas de Pan (Breadcrumbs)</p>
                    <p class="text-xs text-muted-foreground">Ruta de navegación jerárquica en la barra superior</p>
                  </div>
                  <z-switch
                    [zChecked]="headerConfig().showBreadcrumb"
                    (zCheckedChange)="updateHeaderParam('showBreadcrumb', $event)"
                  />
                </div>

                <div class="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <p class="font-medium text-sm text-foreground">Campana de Notificaciones</p>
                    <p class="text-xs text-muted-foreground">Popover con avisos de pedidos, citas y alertas</p>
                  </div>
                  <z-switch
                    [zChecked]="headerConfig().showNotifications"
                    (zCheckedChange)="updateHeaderParam('showNotifications', $event)"
                  />
                </div>

                <div class="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <p class="font-medium text-sm text-foreground">Personalizador de Tema y Colores</p>
                    <p class="text-xs text-muted-foreground">Acceso rápido para alternar modo claro/oscuro y paletas de color</p>
                  </div>
                  <z-switch
                    [zChecked]="headerConfig().showThemeCustomizer"
                    (zCheckedChange)="updateHeaderParam('showThemeCustomizer', $event)"
                  />
                </div>
              </z-card-content>
            </z-card>
          </div>
        </z-tab>

        <!-- TAB 3: ESPACIO DE TRABAJO Y LIENZO -->
        <z-tab label="Espacio de Trabajo" zIcon="lucideLayers">
          <div class="max-w-3xl mx-auto pt-4 space-y-6">
            <z-card>
              <z-card-header class="border-b border-border/50 pb-4">
                <z-card-title zTitle="Ancho del Contenedor" class="text-base font-semibold" />
                <z-card-description zDescription="Selecciona cómo se adapta el contenido en pantallas grandes" class="text-xs text-muted-foreground" />
              </z-card-header>

              <z-card-content class="pt-5 space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <!-- Fluido -->
                  <button
                    type="button"
                    class="p-4 rounded-lg border text-left transition-all cursor-pointer space-y-1.5"
                    [class.border-primary]="contentConfig().containerWidth === 'fluid'"
                    [class.bg-primary/5]="contentConfig().containerWidth === 'fluid'"
                    [class.ring-2]="contentConfig().containerWidth === 'fluid'"
                    [class.ring-primary/30]="contentConfig().containerWidth === 'fluid'"
                    [class.border-border]="contentConfig().containerWidth !== 'fluid'"
                    (click)="setContainerWidth('fluid')"
                  >
                    <span class="font-semibold text-xs text-foreground block">100% Fluido</span>
                    <span class="text-[11px] text-muted-foreground block">Ocupa todo el ancho, ideal para POS, tablas y catálogos.</span>
                  </button>

                  <!-- En Caja -->
                  <button
                    type="button"
                    class="p-4 rounded-lg border text-left transition-all cursor-pointer space-y-1.5"
                    [class.border-primary]="contentConfig().containerWidth === 'contained'"
                    [class.bg-primary/5]="contentConfig().containerWidth === 'contained'"
                    [class.ring-2]="contentConfig().containerWidth === 'contained'"
                    [class.ring-primary/30]="contentConfig().containerWidth === 'contained'"
                    [class.border-border]="contentConfig().containerWidth !== 'contained'"
                    (click)="setContainerWidth('contained')"
                  >
                    <span class="font-semibold text-xs text-foreground block">En Caja (1280px)</span>
                    <span class="text-[11px] text-muted-foreground block">Centrado balanceado, ideal para formularios y dashboards.</span>
                  </button>

                  <!-- Compacto -->
                  <button
                    type="button"
                    class="p-4 rounded-lg border text-left transition-all cursor-pointer space-y-1.5"
                    [class.border-primary]="contentConfig().containerWidth === 'narrow'"
                    [class.bg-primary/5]="contentConfig().containerWidth === 'narrow'"
                    [class.ring-2]="contentConfig().containerWidth === 'narrow'"
                    [class.ring-primary/30]="contentConfig().containerWidth === 'narrow'"
                    [class.border-border]="contentConfig().containerWidth !== 'narrow'"
                    (click)="setContainerWidth('narrow')"
                  >
                    <span class="font-semibold text-xs text-foreground block">Estrecho (1024px)</span>
                    <span class="text-[11px] text-muted-foreground block">Enfoque concentrado para lectura y reportes detallados.</span>
                  </button>
                </div>
              </z-card-content>
            </z-card>
          </div>
        </z-tab>

        <!-- TAB 4: APARIENCIA Y PALETAS -->
        <z-tab label="Apariencia y Colores" zIcon="lucidePalette">
          <div class="max-w-3xl mx-auto pt-4">
            <z-card>
              <z-card-header class="border-b border-border/50 pb-4">
                <z-card-title zTitle="Personalización de Tema Visual" class="text-base font-semibold" />
                <z-card-description zDescription="Modos de luz/oscuridad, 8 paletas de color OKLCH y radios de esquinas" class="text-xs text-muted-foreground" />
              </z-card-header>
              <z-card-content class="pt-5">
                <app-theme-customizer />
              </z-card-content>
            </z-card>
          </div>
        </z-tab>

        <!-- TAB 5: RESPALDO JSON & API READY -->
        <z-tab label="Exportar / Importar (JSON)" zIcon="lucideDownload">
          <div class="max-w-3xl mx-auto pt-4 space-y-6">
            <z-card>
              <z-card-header class="border-b border-border/50 pb-4">
                <div class="flex items-center justify-between">
                  <div>
                    <z-card-title zTitle="Estructura JSON del Layout" class="text-base font-semibold" />
                    <z-card-description
                      zDescription="Visualiza y copia la configuración activa preparada para sincronizarse con la API del backend"
                      class="text-xs text-muted-foreground"
                    />
                  </div>
                  <button z-button zType="outline" zSize="sm" class="gap-1.5" (click)="exportJson()">
                    <ng-icon name="lucideCopy" class="size-4" />
                    Copiar JSON
                  </button>
                </div>
              </z-card-header>

              <z-card-content class="pt-5 space-y-4">
                <div class="rounded-lg bg-muted/60 p-4 border border-border/60">
                  <pre class="font-mono text-xs text-foreground overflow-x-auto max-h-72 select-all leading-relaxed">{{ currentJson() }}</pre>
                </div>

                <z-separator />

                <!-- Importador de JSON -->
                <div class="space-y-3">
                  <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Importar o Restaurar Configuración desde JSON
                  </label>
                  <textarea
                    class="w-full h-28 rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Pega aquí el JSON de configuración para cargarlo..."
                    [(ngModel)]="importJsonText"
                  ></textarea>

                  <div class="flex justify-end gap-2">
                    <button
                      z-button
                      zType="default"
                      zSize="sm"
                      class="gap-1.5"
                      [disabled]="!importJsonText.trim()"
                      (click)="importJson()"
                    >
                      <ng-icon name="lucideUpload" class="size-4" />
                      Aplicar Configuración
                    </button>
                  </div>
                </div>
              </z-card-content>
            </z-card>
          </div>
        </z-tab>
      </z-tab-group>
    </div>
  `,
})
export class LayoutConfigPageComponent {
  private readonly layoutConfigService = inject(LayoutConfigService);
  private readonly sonner = inject(ZardSonnerService);

  readonly sidebarConfig = this.layoutConfigService.sidebar;
  readonly headerConfig = this.layoutConfigService.header;
  readonly contentConfig = this.layoutConfigService.content;
  readonly itemsOrder = this.layoutConfigService.itemsOrder;

  readonly visibleModulesCount = computed(() => this.itemsOrder().filter((item) => item.visible).length);
  readonly currentJson = computed(() => this.layoutConfigService.exportAsJson());

  importJsonText = '';

  moveUp(id: string): void {
    this.layoutConfigService.moveSidebarItemUp(id);
  }

  moveDown(id: string): void {
    this.layoutConfigService.moveSidebarItemDown(id);
  }

  toggleVisibility(id: string): void {
    this.layoutConfigService.toggleSidebarItemVisibility(id);
  }

  setSidebarCollapsible(mode: SidebarCollapsibleMode): void {
    this.layoutConfigService.updateSidebar({ collapsible: mode });
  }

  updateSidebarParam<K extends keyof ReturnType<typeof this.sidebarConfig>>(key: K, val: any): void {
    this.layoutConfigService.updateSidebar({ [key]: val });
  }

  updateHeaderParam<K extends keyof ReturnType<typeof this.headerConfig>>(key: K, val: any): void {
    this.layoutConfigService.updateHeader({ [key]: val });
  }

  updateGroupLabel(label: string): void {
    this.layoutConfigService.updateSidebar({ groupLabel: label });
  }

  setContainerWidth(width: ContentContainerWidth): void {
    this.layoutConfigService.updateContent({ containerWidth: width });
  }

  setDensity(density: LayoutDensity): void {
    this.layoutConfigService.updateContent({ density });
  }

  resetDefaults(): void {
    this.layoutConfigService.resetToDefaults();
    this.sonner.success('Configuración del layout restaurada a valores predeterminados');
  }

  exportJson(): void {
    const json = this.layoutConfigService.exportAsJson();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        this.sonner.success('Configuración JSON copiada al portapapeles');
      });
    }
  }

  importJson(): void {
    if (!this.importJsonText.trim()) return;

    const ok = this.layoutConfigService.importFromJson(this.importJsonText);
    if (ok) {
      this.sonner.success('Configuración importada y aplicada exitosamente');
      this.importJsonText = '';
    } else {
      this.sonner.error('Error al importar JSON. Asegúrate de que el formato sea válido.');
    }
  }
}
