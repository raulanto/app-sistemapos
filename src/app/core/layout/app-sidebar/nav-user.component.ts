import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBadgeCheck,
  lucideBell,
  lucideChevronsUpDown,
  lucideCreditCard,
  lucideLogOut,
  lucideSparkles,
} from '@ng-icons/lucide';

import { ZardAvatarComponent } from '../../../shared/components/avatar/avatar.component';
import type { ZardDropdownSide } from '../../../shared/components/dropdown/dropdown-positions';
import { ZardDropdownImports } from '../../../shared/components/dropdown/dropdown.imports';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';
import { ZardSidebarService } from '../../../shared/components/sidebar/sidebar.service';
import { AuthService } from '../../auth/auth.service';

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
  
  protected readonly menuSide = computed<ZardDropdownSide>(() => (this.sidebar.isMobile() ? 'bottom' : 'right'));

  readonly userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.nombre}` : 'Usuario POS';
  });
  
  readonly userEmail = computed(() => this.authService.currentUser()?.email ?? 'usuario@sistema.local');
  readonly userAvatar = computed(() => 'https://api.dicebear.com/7.x/initials/svg?seed=' + this.userName());

  logout() {
    this.authService.logoutRemote().subscribe();
  }
}
