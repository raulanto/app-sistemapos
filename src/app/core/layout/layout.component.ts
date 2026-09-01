import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ZardBreadcrumbImports } from '../../shared/components/breadcrumb/breadcrumb.imports';
import { ZardSeparatorComponent } from '../../shared/components/separator/separator.component';
import { ZardSidebarImports } from '../../shared/components/sidebar/sidebar.imports';

import { AppSidebarComponent } from './app-sidebar/app-sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    ...ZardSidebarImports, 
    ...ZardBreadcrumbImports, 
    ZardSeparatorComponent, 
    AppSidebarComponent
  ],
  template: `
    <z-sidebar-provider>
      <app-sidebar />

      <main z-sidebar-inset>
        <header
          class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        >
          <div class="flex items-center gap-2 px-4">
            <button z-sidebar-trigger class="-ml-1" aria-label="Toggle Sidebar"></button>

            <z-separator
              zOrientation="vertical"
              class="mr-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
            />

            <z-breadcrumb>
              <z-breadcrumb-item class="hidden md:block">
                <a z-breadcrumb-link href="#">Sistema POS</a>
              </z-breadcrumb-item>
              <!-- Breadcrumbs can be dynamic based on current route later -->
            </z-breadcrumb>
          </div>
        </header>

        <div class="flex flex-1 flex-col p-4 md:p-6 pt-0 bg-muted/20 relative">
          <router-outlet></router-outlet>
        </div>
      </main>
    </z-sidebar-provider>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {}
