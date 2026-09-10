import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
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

import { ZardAvatarComponent } from '../../../shared/components/avatar/avatar.component';
import type { ZardDropdownSide } from '../../../shared/components/dropdown/dropdown-positions';
import { ZardDropdownImports } from '../../../shared/components/dropdown/dropdown.imports';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';
import { ZardSidebarService } from '../../../shared/components/sidebar/sidebar.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { CajaService } from '../../../features/ventas/data-access/caja.service';
import { AuthService } from '../../auth/api/auth.service';
import { ThemeService } from '../../theme/theme.service';

@Component({
  selector: 'lib-sidebar-07-nav-user',
  standalone: true,
  imports: [...ZardSidebarImports, ...ZardDropdownImports, ZardAvatarComponent, NgIcon],
  viewProviders: [
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
    <ul z-sidebar-menu>
      <li z-sidebar-menu-item>
        <button
          z-sidebar-menu-button
          zSize="lg"
          z-dropdown
          [zDropdownMenu]="userMenu"
          class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <z-avatar class="size-8 rounded-lg" [zSrc]="userAvatar()" [zAlt]="userName()" zFallback="ZU" />

          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{{ userName() }}</span>
            <span class="truncate text-xs">{{ userEmail() }}</span>
          </div>

          <ng-icon name="lucideChevronsUpDown" class="ml-auto size-4" />
        </button>

        <z-dropdown-menu-content
          #userMenu="zDropdownMenuContent"
          class="w-(--z-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          [zSide]="menuSide()"
          zAlign="end"
        >
          <z-dropdown-menu-label class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <z-avatar class="size-8 rounded-lg" [zSrc]="userAvatar()" [zAlt]="userName()" zFallback="ZU" />

              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{{ userName() }}</span>
                <span class="truncate text-xs">{{ userEmail() }}</span>
              </div>
              
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
          </z-dropdown-menu-label>

          <z-dropdown-menu-separator />

          <z-dropdown-menu-group>
            <z-dropdown-menu-item>
              <ng-icon name="lucideBadgeCheck" />
              Cuenta
            </z-dropdown-menu-item>
            <z-dropdown-menu-item>
              <ng-icon name="lucideCreditCard" />
              Suscripción
            </z-dropdown-menu-item>
            <z-dropdown-menu-item>
              <ng-icon name="lucideBell" />
              Notificaciones
            </z-dropdown-menu-item>
          </z-dropdown-menu-group>

          <z-dropdown-menu-separator />

          <z-dropdown-menu-item (click)="logout()">
            <ng-icon name="lucideLogOut" />
            Cerrar Sesión
          </z-dropdown-menu-item>
        </z-dropdown-menu-content>
      </li>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavUserComponent {
  private readonly sidebar = inject(ZardSidebarService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private alertDialog = inject(ZardAlertDialogService);
  private sonner = inject(ZardSonnerService);
  private cajaService = inject(CajaService);
  
  protected readonly menuSide = computed<ZardDropdownSide>(() => (this.sidebar.isMobile() ? 'bottom' : 'right'));

  readonly userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.nombre}` : 'Usuario POS';
  });
  
  readonly userEmail = computed(() => this.authService.currentUser()?.email ?? 'usuario@sistema.local');
  readonly userAvatar = computed(() => 'https://api.dicebear.com/7.x/initials/svg?seed=' + this.userName());
  
  readonly isDarkTheme = computed(() => this.themeService.currentTheme() === 'dark');

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.alertDialog.confirm({
      zTitle: 'Cerrar sesión',
      zDescription: '¿Estás seguro de que deseas cerrar tu sesión en el sistema?',
      zOkText: 'Cerrar sesión',
      zCancelText: 'Cancelar',
      zOkDestructive: true,
      zOnOk: () => {
        // No se permite cerrar sesión con un turno de caja abierto: hay que cerrarlo primero.
        this.cajaService.actual().subscribe({
          next: (turno) => {
            if (turno) {
              this.sonner.error('Tienes un turno de caja abierto. Ciérralo antes de cerrar sesión.');
              return;
            }
            this.doLogout();
          },
          // Si no se pudo consultar el turno (permisos, red), no bloqueamos el cierre de sesión.
          error: () => this.doLogout(),
        });
      }
    });
  }

  private doLogout() {
    this.authService.logoutRemote().subscribe({
      error: (err) => {
        this.sonner.error(err?.error?.error?.message ?? 'No se pudo cerrar sesión. Inténtalo de nuevo.');
      },
    });
  }
}
