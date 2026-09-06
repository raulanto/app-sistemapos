import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { RouterOutlet } from '@angular/router';
import { ZardBreadcrumbImports } from '../../shared/components/breadcrumb/breadcrumb.imports';
import { ZardSeparatorComponent } from '../../shared/components/separator/separator.component';
import { ZardSidebarImports } from '../../shared/components/sidebar/sidebar.imports';
import { AppSidebarComponent } from './app-sidebar/app-sidebar.component';
import {
  lucideBadgeCheck,
  lucideBell,
  lucideChevronsUpDown,
  lucideCreditCard,
  lucideLogOut,
  lucideSparkles,
  lucideSun,
  lucideMoon,
} from '@ng-icons/lucide';
import { ThemeService } from '../theme/theme.service';
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    ...ZardSidebarImports,
    ...ZardBreadcrumbImports,
    ZardSeparatorComponent,
    NgIcon,
    AppSidebarComponent,
  ],
  providers: [
    provideIcons({
      lucideBadgeCheck,
      lucideBell,
      lucideChevronsUpDown,
      lucideCreditCard,
      lucideLogOut,
      lucideSparkles,
      lucideSun,
      lucideMoon,
    }),
  ],
  template: `
    <z-sidebar-provider>
      <app-sidebar />

      <main z-sidebar-inset>
        <header
          class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        >
          <div class="flex items-center w-full gap-2 px-4">
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
            <button
              class="ml-auto flex items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
              (click)="toggleTheme()"
              title="Cambiar tema"
            >
              @if (isDarkTheme()) {
                <ng-icon name="lucideSun" class="size-4" />
              } @else {
                <ng-icon name="lucideMoon" class="size-4" />
              }
            </button>
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
export class LayoutComponent {
  readonly isDarkTheme = computed(() => this.themeService.currentTheme() === 'dark');
  private themeService = inject(ThemeService);
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
