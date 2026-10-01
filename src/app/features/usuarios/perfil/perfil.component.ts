import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUser,
  lucideMail,
  lucideShield,
  lucideBuilding,
  lucideClock,
  lucideKey,
  lucideCheckCircle2,
  lucideSun,
  lucideMoon,
  lucideSparkles,
  lucideCalendar,
  lucideIdCard,
} from '@ng-icons/lucide';

import { AuthService } from '@/core/auth/api/auth.service';
import { ThemeService } from '@/core/theme/theme.service';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardImports } from '@/shared/components/card/card.imports';
import { ZardSeparatorComponent } from '@/shared/components/separator/separator.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    NgIcon,
    ZardAvatarComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ...ZardCardImports,
    ZardSeparatorComponent,
  ],
  providers: [
    provideIcons({
      lucideUser,
      lucideMail,
      lucideShield,
      lucideBuilding,
      lucideClock,
      lucideKey,
      lucideCheckCircle2,
      lucideSun,
      lucideMoon,
      lucideSparkles,
      lucideCalendar,
      lucideIdCard,
    }),
  ],
  template: `
    <div class="w-full space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Encabezado Estándar del Sistema POS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl text-foreground font-display">Perfil de usuario</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Información de la cuenta, sucursal asignada y permisos del sistema.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button z-button zType="outline" zSize="sm" class="gap-2" (click)="toggleTheme()">
            @if (isDarkTheme()) {
              <ng-icon name="lucideSun" class="size-4" />
              Modo Claro
            } @else {
              <ng-icon name="lucideMoon" class="size-4" />
              Modo Oscuro
            }
          </button>
        </div>
      </div>

      <!-- Tarjeta de Identidad del Usuario -->
      <z-card>
        <z-card-content class="p-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <z-avatar
              class="size-20  shrink-0"
              [zSrc]="userAvatar()"
              [zAlt]="userName()"
              zFallback="POS"
            />
            <div class="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <div class="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h2 class="text-xl font-bold tracking-tight text-foreground">{{ userName() }}</h2>
                <z-badge [zType]="user()?.activo ? 'default' : 'destructive'" class="text-xs">
                  {{ user()?.activo ? 'Cuenta Activa' : 'Inactiva' }}
                </z-badge>
              </div>
              <p class="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                <ng-icon name="lucideMail" class="size-4 text-muted-foreground" />
                {{ userEmail() }}
              </p>
              <div class="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-muted-foreground flex-wrap">
                <span class="flex items-center gap-1">
                  <ng-icon name="lucideShield" class="size-3.5 text-primary" />
                  <strong>Rol:</strong> {{ userRole() }}
                </span>
                <span class="flex items-center gap-1">
                  <ng-icon name="lucideBuilding" class="size-3.5 text-primary" />
                  <strong>Sucursal:</strong> {{ userSucursal() }}
                </span>
              </div>
            </div>
          </div>
        </z-card-content>
      </z-card>

      <!-- Detalle de Información y Permisos -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Columna Izquierda: Detalles de Cuenta -->
        <z-card class="lg:col-span-1">
          <z-card-header class="border-b border-border/50 pb-4">
            <z-card-title zTitle="Detalles de la Cuenta" class="text-base font-semibold" />
            <z-card-description zDescription="Información de acceso e identificación" class="text-xs text-muted-foreground" />
          </z-card-header>
          <z-card-content class="pt-4 space-y-4 text-sm">
            <div class="space-y-1">
              <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID de Usuario</span>
              <p class="font-mono text-xs text-foreground truncate bg-muted/30 p-2 rounded-md border border-border/50">
                {{ user()?.id || '—' }}
              </p>
            </div>

            <z-separator />

            <div class="space-y-1">
              <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rol Principal</span>
              <p class="font-medium text-foreground flex items-center gap-2">
                <ng-icon name="lucideShield" class="size-4 text-muted-foreground" />
                {{ userRole() }}
              </p>
            </div>

            <z-separator />

            <div class="space-y-1">
              <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sucursal Asignada</span>
              <p class="font-medium text-foreground flex items-center gap-2">
                <ng-icon name="lucideBuilding" class="size-4 text-muted-foreground" />
                {{ userSucursal() }}
              </p>
            </div>

            <z-separator />

            <div class="space-y-1">
              <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Último Inicio de Sesión</span>
              <p class="font-medium text-foreground flex items-center gap-2 text-xs">
                <ng-icon name="lucideClock" class="size-4 text-muted-foreground" />
                @if (user()?.last_login_at) {
                  {{ user()?.last_login_at | date:'dd/MM/yyyy HH:mm' }}
                } @else {
                  Sin registro reciente
                }
              </p>
            </div>
          </z-card-content>
        </z-card>

        <!-- Columna Derecha: Permisos Asignados -->
        <z-card class="lg:col-span-2">
          <z-card-header class="border-b border-border/50 pb-4">
            <div class="flex items-center justify-between">
              <div>
                <z-card-title zTitle="Permisos Asignados" class="text-base font-semibold" />
                <z-card-description zDescription="Privilegios activos según el rol asignado" class="text-xs text-muted-foreground" />
              </div>
              <z-badge zType="outline" class="font-mono text-xs">
                {{ permisosList().length }} permisos
              </z-badge>
            </div>
          </z-card-header>
          <z-card-content class="pt-4">
            @if (permisosList().length === 0) {
              <p class="text-xs text-muted-foreground italic py-6 text-center">
                No tienes permisos especiales asociados a tu rol.
              </p>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                @for (permiso of permisosList(); track permiso.id) {
                  <div class="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <ng-icon name="lucideCheckCircle2" class="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div class="space-y-0.5 min-w-0">
                      <p class="font-medium text-foreground truncate">{{ permiso.descripcion || permiso.codigo }}</p>
                      <p class="font-mono text-[10px] text-muted-foreground truncate">{{ permiso.codigo }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </z-card-content>
        </z-card>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  readonly user = this.authService.currentUser;
  readonly userName = computed(() => this.user()?.nombre ?? 'Usuario POS');
  readonly userEmail = computed(() => this.user()?.email ?? 'usuario@sistema.local');
  readonly userRole = computed(() => this.user()?.rol?.nombre ?? 'Sin Rol');
  readonly userSucursal = computed(() => this.user()?.sucursal?.nombre ?? 'Sucursal Global / Central');
  readonly userAvatar = computed(() => 'https://api.dicebear.com/7.x/initials/svg?seed=' + this.userName());

  readonly permisosList = computed(() => this.user()?.rol?.permisos ?? []);

  readonly isDarkTheme = computed(() => this.themeService.currentTheme() === 'dark');

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
