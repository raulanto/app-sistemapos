import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';
import { ZardDropdownImports } from '../../../shared/components/dropdown/dropdown.imports';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun, lucideUser, lucideLogOut } from '@ng-icons/lucide';
import { ThemeService } from '../../theme/theme.service';
import { AuthService } from '../../auth/auth.service';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-header',
  imports: [
    NgIcon,
    ZardButtonComponent,
    ...ZardSidebarImports,
    ...ZardDropdownImports
  ],
  viewProviders: [
    provideIcons({ lucideMoon, lucideSun, lucideUser, lucideLogOut })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-10 flex h-14 bg-background items-center justify-between border-b px-4 lg:px-6">
      <div class="flex items-center gap-2">
        <button z-sidebar-trigger></button>
        <span class="font-semibold lg:hidden">Sistema POS</span>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Theme Toggle -->
        <button z-button zType="ghost" zSize="icon" (click)="themeService.toggleTheme()" aria-label="Cambiar tema">
          @if (themeService.currentTheme() === 'dark') {
            <ng-icon name="lucideSun" class="size-5"></ng-icon>
          } @else {
            <ng-icon name="lucideMoon" class="size-5"></ng-icon>
          }
        </button>

        <!-- User Dropdown -->
        <z-dropdown-menu>
          <button z-button zType="outline" dropdown-trigger class="gap-2 px-2 lg:px-4">
            <ng-icon name="lucideUser" class="size-4"></ng-icon>
            <span class="hidden lg:inline-flex max-w-32 truncate">
              {{ userName() }}
            </span>
          </button>
          
          <ng-template #dropdownTemplate>
            <z-dropdown-menu-label>Mi Cuenta</z-dropdown-menu-label>
            <z-dropdown-menu-separator></z-dropdown-menu-separator>
            <z-dropdown-menu-item (click)="authService.logout()">
              <ng-icon name="lucideLogOut" class="mr-2 size-4"></ng-icon>
              <span>Cerrar Sesión</span>
            </z-dropdown-menu-item>
          </ng-template>
        </z-dropdown-menu>
      </div>
    </header>
  `
})
export class AppHeaderComponent {
  themeService = inject(ThemeService);
  authService = inject(AuthService);

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? user.nombre : 'Usuario';
  });
}
