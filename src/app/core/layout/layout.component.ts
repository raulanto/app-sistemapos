import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZardBreadcrumbImports } from '../../shared/components/breadcrumb/breadcrumb.imports';
import { ZardSeparatorComponent } from '../../shared/components/separator/separator.component';
import { ZardSidebarImports } from '../../shared/components/sidebar/sidebar.imports';
import { AppSidebarComponent } from './app-sidebar/app-sidebar.component';
import { NotificacionesPopoverComponent } from '../notificaciones/ui/notificaciones-popover.component';
import { ThemeCustomizerPopoverComponent } from '../theme/ui/theme-customizer-popover.component';
import { LayoutConfigService } from './config/layout-config.service';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    ...ZardSidebarImports,
    ...ZardBreadcrumbImports,
    ZardSeparatorComponent,
    AppSidebarComponent,
    NotificacionesPopoverComponent,
    ThemeCustomizerPopoverComponent,
  ],
  template: `
    <z-sidebar-provider>
      <app-sidebar />

      <main z-sidebar-inset>
        @if (headerConfig().showSidebarTrigger || headerConfig().showBreadcrumb || headerConfig().showNotifications || headerConfig().showThemeCustomizer) {
          <header
            class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border/40"
            [class.sticky]="headerConfig().sticky"
            [class.top-0]="headerConfig().sticky"
            [class.z-20]="headerConfig().sticky"
            [class.bg-background/80]="headerConfig().sticky"
            [class.backdrop-blur-md]="headerConfig().sticky"
          >
            <div class="flex items-center w-full gap-2 px-4">
              @if (headerConfig().showSidebarTrigger) {
                <button z-sidebar-trigger class="-ml-1" aria-label="Alternar barra lateral"></button>

                @if (headerConfig().showBreadcrumb) {
                  <z-separator
                    zOrientation="vertical"
                    class="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
                  />
                }
              }

              @if (headerConfig().showBreadcrumb) {
                <z-breadcrumb>
                  <z-breadcrumb-item class="hidden md:block">
                    <a z-breadcrumb-link href="#">Sistema POS</a>
                  </z-breadcrumb-item>
                </z-breadcrumb>
              }

              <div class="ml-auto flex items-center gap-1.5">
                @if (headerConfig().showNotifications) {
                  <app-notificaciones-popover />
                }
                @if (headerConfig().showThemeCustomizer) {
                  <app-theme-customizer-popover />
                }
              </div>
            </div>
          </header>
        }

        <div
          class="flex flex-1 flex-col bg-muted/20 relative"
          [class.w-full]="contentConfig().containerWidth === 'fluid'"
          [class.max-w-7xl]="contentConfig().containerWidth === 'contained'"
          [class.max-w-5xl]="contentConfig().containerWidth === 'narrow'"
          [class.mx-auto]="contentConfig().containerWidth !== 'fluid'"
        >
          <router-outlet></router-outlet>
        </div>
      </main>
    </z-sidebar-provider>
  `,
})
export class LayoutComponent {
  private readonly layoutConfigService = inject(LayoutConfigService);

  readonly headerConfig = this.layoutConfigService.header;
  readonly contentConfig = this.layoutConfigService.content;
}
