import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { form, FormField, email, minLength, required } from '@angular/forms/signals';
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
  lucideSave,
  lucideLock,
  lucideLoader2,
  lucideSparkles,
  lucideAlertTriangle,
  lucideCheck,
  lucideShieldCheck,
  lucideUserCheck,
  lucidePalette,
} from '@ng-icons/lucide';

import { AuthService } from '@/core/auth/api/auth.service';
import { ThemeService } from '@/core/theme/theme.service';
import { UsuarioAdminService } from '../data-access/usuario-admin.service';
import { SucursalService } from '@/core/sucursal/sucursal.service';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardCardImports } from '@/shared/components/card/card.imports';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSeparatorComponent } from '@/shared/components/separator/separator.component';
import { ZardFieldImports } from '@/shared/components/field/field.imports';
import { ZardInputComponent } from '@/shared/components/input/input.component';
import { ZardSelectImports } from '@/shared/components/select/select.imports';
import { ZardTabsImports } from '@/shared/components/tabs/tabs.imports';
import { ZardAlertComponent } from '@/shared/components/alert/alert.component';
import { ZardSonnerService } from '@/shared/components/sonner/sonner.service';
import { ThemeCustomizerComponent } from '@/core/theme/ui/theme-customizer.component';
import { ThemeCustomizerPopoverComponent } from '@/core/theme/ui/theme-customizer-popover.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormField,
    NgIcon,
    ZardAvatarComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ...ZardCardImports,
    ZardEmptyComponent,
    ZardSeparatorComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ...ZardTabsImports,
    ZardAlertComponent,
    ThemeCustomizerComponent,
    ThemeCustomizerPopoverComponent,
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
      lucideSave,
      lucideLock,
      lucideLoader2,
      lucideSparkles,
      lucideAlertTriangle,
      lucideCheck,
      lucideShieldCheck,
      lucideUserCheck,
      lucidePalette,
    }),
  ],
  template: `
    <div class="w-full space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <!-- Encabezado del Perfil -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 class="text-2xl font-bold tracking-tight sm:text-3xl text-foreground font-display">Mi Perfil y Configuración</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Administra tus credenciales personales, sucursal activa, apariencia, seguridad y privilegios en el sistema.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <app-theme-customizer-popover />
        </div>
      </div>

      <!-- Tarjeta Resumen del Usuario -->
      <z-card class="bg-card border border-border/80 shadow-xs">
        <z-card-content class="p-6">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <z-avatar
              class="size-20 shrink-0 border-2 border-primary/20"
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
                <span class="flex items-center gap-1 font-medium">
                  <ng-icon name="lucideShield" class="size-3.5 text-primary" />
                  <strong>Rol:</strong> {{ userRole() }}
                </span>
                <span class="flex items-center gap-1 font-medium">
                  <ng-icon name="lucideBuilding" class="size-3.5 text-primary" />
                  <strong>Sucursal:</strong> {{ userSucursal() }}
                </span>
              </div>
            </div>
          </div>
        </z-card-content>
      </z-card>

      <!-- Tabs Horizontales de Configuración -->
      <z-tab-group class="space-y-6">
        <!-- TAB 1: DATOS PERSONALES -->
        <z-tab label="Información Personal" zIcon="lucideUser">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            <!-- Formulario Principal -->
            <z-card class="lg:col-span-2">
              <z-card-header class="border-b border-border/50 pb-4">
                <div class="flex items-center gap-2">
                  <ng-icon name="lucideUserCheck" class="size-5 text-primary" />
                  <div>
                    <z-card-title zTitle="Datos Personales y de Cuenta" class="text-base font-semibold" />
                    <z-card-description zDescription="Modifica tu nombre de usuario, correo y asignación de sucursal" class="text-xs text-muted-foreground" />
                  </div>
                </div>
              </z-card-header>
              <z-card-content class="pt-5 space-y-5">
                @if (perfilError()) {
                  <z-alert zType="destructive" [zTitle]="'Error al actualizar'" [zDescription]="perfilError()!" />
                }

                @if (perfilSuccess()) {
                  <z-alert zType="default" class="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" [zTitle]="'¡Guardado!'" [zDescription]="'Tus datos de perfil se actualizaron correctamente.'" />
                }

                @let fNombre = perfilForm.nombre();
                @let nombreInvalid = fNombre.invalid() && fNombre.touched();
                <div z-field [attr.data-invalid]="nombreInvalid || null">
                  <label z-field-label for="nombre">Nombre completo *</label>
                  <input
                    z-input
                    id="nombre"
                    type="text"
                    placeholder="Tu nombre completo"
                    [formField]="perfilForm.nombre"
                    [attr.aria-invalid]="nombreInvalid || null"
                  />
                  @if (nombreInvalid) {
                    <z-field-error [zErrors]="fNombre.errors()" />
                  }
                </div>

                @let fEmail = perfilForm.email();
                @let emailInvalid = fEmail.invalid() && fEmail.touched();
                <div z-field [attr.data-invalid]="emailInvalid || null">
                  <label z-field-label for="email">Correo electrónico *</label>
                  <input
                    z-input
                    id="email"
                    type="email"
                    placeholder="ejemplo@dominio.com"
                    [formField]="perfilForm.email"
                    [attr.aria-invalid]="emailInvalid || null"
                  />
                  @if (emailInvalid) {
                    <z-field-error [zErrors]="fEmail.errors()" />
                  }
                </div>

                <div z-field>
                  <label z-field-label>Sucursal asignada</label>
                  <z-select
                    [formField]="perfilForm.sucursal_id"
                    zPlaceholder="Seleccionar sucursal"
                  >
                    <z-select-item zValue="">Global / Sin sucursal fija</z-select-item>
                    @for (s of sucursalService.sucursales(); track s.id) {
                      <z-select-item [zValue]="s.id">{{ s.nombre }}</z-select-item>
                    }
                  </z-select>
                  <p z-field-description>Si perteneces a una sucursal específica, selecciona la caja u oficina correspondiente.</p>
                </div>
              </z-card-content>
              <z-card-footer class="border-t border-border/50 pt-4 flex justify-end">
                <button
                  z-button
                  zType="default"
                  zSize="sm"
                  class="gap-2"
                  [disabled]="savingPerfil()"
                  (click)="guardarPerfil()"
                >
                  @if (savingPerfil()) {
                    <ng-icon name="lucideLoader2" class="size-4 animate-spin" />
                    Guardando...
                  } @else {
                    <ng-icon name="lucideSave" class="size-4" />
                    Guardar cambios
                  }
                </button>
              </z-card-footer>
            </z-card>

            <!-- Panel Informativo Lateral -->
            <z-card class="lg:col-span-1">
              <z-card-header class="border-b border-border/50 pb-4">
                <z-card-title zTitle="Detalles de Acceso" class="text-base font-semibold" />
                <z-card-description zDescription="Información del sistema e identificador de cuenta" class="text-xs text-muted-foreground" />
              </z-card-header>
              <z-card-content class="pt-4 space-y-4 text-sm">
                <div class="space-y-1">
                  <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">ID Único de Usuario</span>
                  <p class="font-mono text-xs text-foreground truncate bg-muted/40 p-2 rounded-md border border-border/50 select-all">
                    {{ user()?.id || '—' }}
                  </p>
                </div>

                <z-separator />

                <div class="space-y-1">
                  <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rol Asignado</span>
                  <p class="font-medium text-foreground flex items-center gap-2">
                    <ng-icon name="lucideShield" class="size-4 text-primary" />
                    {{ userRole() }}
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
          </div>
        </z-tab>

        <!-- TAB 2: SEGURIDAD Y CONTRASEÑA -->
        <z-tab label="Seguridad y Clave" zIcon="lucideLock">
          <div class="max-w-2xl mx-auto pt-4">
            <z-card>
              <z-card-header class="border-b border-border/50 pb-4">
                <div class="flex items-center gap-2">
                  <ng-icon name="lucideKey" class="size-5 text-primary" />
                  <div>
                    <z-card-title zTitle="Cambio de Contraseña" class="text-base font-semibold" />
                    <z-card-description zDescription="Actualiza tu contraseña de acceso para mantener segura tu cuenta" class="text-xs text-muted-foreground" />
                  </div>
                </div>
              </z-card-header>
              <z-card-content class="pt-5 space-y-5">
                @if (passwordError()) {
                  <z-alert zType="destructive" [zTitle]="'Error al actualizar clave'" [zDescription]="passwordError()!" />
                }

                @if (passwordSuccess()) {
                  <z-alert zType="default" class="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" [zTitle]="'¡Contraseña actualizada!'" [zDescription]="'Tu nueva clave de acceso ha sido guardada exitosamente.'" />
                }

                @let fPassAct = passwordForm.password_actual();
                @let passActInvalid = fPassAct.invalid() && fPassAct.touched();
                <div z-field [attr.data-invalid]="passActInvalid || null">
                  <label z-field-label for="password_actual">Contraseña actual *</label>
                  <input
                    z-input
                    id="password_actual"
                    type="password"
                    placeholder="Tu contraseña actual"
                    [formField]="passwordForm.password_actual"
                    [attr.aria-invalid]="passActInvalid || null"
                  />
                  @if (passActInvalid) {
                    <z-field-error [zErrors]="fPassAct.errors()" />
                  }
                </div>

                @let fPassNua = passwordForm.password_nueva();
                @let passNuaInvalid = fPassNua.invalid() && fPassNua.touched();
                <div z-field [attr.data-invalid]="passNuaInvalid || null">
                  <label z-field-label for="password_nueva">Nueva contraseña *</label>
                  <input
                    z-input
                    id="password_nueva"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    [formField]="passwordForm.password_nueva"
                    [attr.aria-invalid]="passNuaInvalid || null"
                  />
                  @if (passNuaInvalid) {
                    <z-field-error [zErrors]="fPassNua.errors()" />
                  }
                </div>

                @let fPassConf = passwordForm.password_confirmacion();
                @let passConfInvalid = fPassConf.invalid() && fPassConf.touched();
                <div z-field [attr.data-invalid]="passConfInvalid || null">
                  <label z-field-label for="password_confirmacion">Confirmar nueva contraseña *</label>
                  <input
                    z-input
                    id="password_confirmacion"
                    type="password"
                    placeholder="Repite la nueva contraseña"
                    [formField]="passwordForm.password_confirmacion"
                    [attr.aria-invalid]="passConfInvalid || null"
                  />
                  @if (passConfInvalid) {
                    <z-field-error [zErrors]="fPassConf.errors()" />
                  }
                </div>
              </z-card-content>
              <z-card-footer class="border-t border-border/50 pt-4 flex justify-end">
                <button
                  z-button
                  zType="default"
                  zSize="sm"
                  class="gap-2"
                  [disabled]="savingPassword()"
                  (click)="guardarPassword()"
                >
                  @if (savingPassword()) {
                    <ng-icon name="lucideLoader2" class="size-4 animate-spin" />
                    Actualizando...
                  } @else {
                    <ng-icon name="lucideKey" class="size-4" />
                    Actualizar contraseña
                  }
                </button>
              </z-card-footer>
            </z-card>
          </div>
        </z-tab>

        <!-- TAB 3: PERMISOS Y PRIVILEGIOS -->
        <z-tab label="Permisos del Rol" zIcon="lucideShieldCheck">
          <div class="pt-4">
            <z-card>
              <z-card-header class="border-b border-border/50 pb-4">
                <div class="flex items-center justify-between">
                  <div>
                    <z-card-title zTitle="Permisos del Rol" class="text-base font-semibold" />
                    <z-card-description zDescription="Acciones y módulos habilitados para tu rol actual" class="text-xs text-muted-foreground" />
                  </div>
                  <z-badge zType="outline" class="font-mono text-xs">
                    {{ permisosList().length }} permisos habilitados
                  </z-badge>
                </div>
              </z-card-header>
              <z-card-content class="pt-5">
                @if (permisosList().length === 0) {
                  <z-empty
                    zIcon="lucideShield"
                    zTitle="Sin permisos especiales"
                    zDescription="No tienes permisos asignados a tu usuario."
                    class="py-8"
                  />
                } @else {
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
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
        </z-tab>

        <!-- TAB 4: APARIENCIA Y TEMA -->
        <z-tab label="Apariencia y Tema" zIcon="lucidePalette">
          <div class="max-w-3xl mx-auto pt-4">
            <z-card>
              <z-card-header class="border-b border-border/50 pb-4">
                <div class="flex items-center gap-2">
                  <ng-icon name="lucidePalette" class="size-5 text-primary" />
                  <div>
                    <z-card-title zTitle="Personalización de Tema y Colores" class="text-base font-semibold" />
                    <z-card-description zDescription="Personaliza el modo de color, la paleta de acentos y los bordes para toda la interfaz" class="text-xs text-muted-foreground" />
                  </div>
                </div>
              </z-card-header>
              <z-card-content class="pt-5">
                <app-theme-customizer />
              </z-card-content>
            </z-card>
          </div>
        </z-tab>
      </z-tab-group>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private usuarioAdminService = inject(UsuarioAdminService);
  public sucursalService = inject(SucursalService);
  private sonner = inject(ZardSonnerService);

  readonly user = this.authService.currentUser;
  readonly userName = computed(() => this.user()?.nombre ?? 'Usuario POS');
  readonly userEmail = computed(() => this.user()?.email ?? 'usuario@sistema.local');
  readonly userRole = computed(() => this.user()?.rol?.nombre ?? 'Sin Rol');
  readonly userSucursal = computed(() => this.user()?.sucursal?.nombre ?? 'Sucursal Global / Central');
  readonly userAvatar = computed(() => 'https://api.dicebear.com/7.x/initials/svg?seed=' + this.userName());

  readonly permisosList = computed(() => this.user()?.rol?.permisos ?? []);
  readonly isDarkTheme = computed(() => this.themeService.currentTheme() === 'dark');

  readonly savingPerfil = signal(false);
  readonly savingPassword = signal(false);

  readonly perfilError = signal<string | null>(null);
  readonly perfilSuccess = signal(false);

  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal(false);

  // Modelos Signal Forms para actualización de perfil y contraseña
  private readonly perfilModel = signal({
    nombre: '',
    email: '',
    sucursal_id: '',
  });

  private readonly passwordModel = signal({
    password_actual: '',
    password_nueva: '',
    password_confirmacion: '',
  });

  protected readonly perfilForm = form(this.perfilModel, path => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    required(path.email, { message: 'El correo electrónico es obligatorio.' });
    email(path.email, { message: 'Ingresa un correo electrónico válido.' });
  });

  protected readonly passwordForm = form(this.passwordModel, path => {
    required(path.password_actual, { message: 'Ingresa tu contraseña actual.' });
    required(path.password_nueva, { message: 'Ingresa la nueva contraseña.' });
    minLength(path.password_nueva, 8, { message: 'La contraseña debe tener al menos 8 caracteres.' });
    required(path.password_confirmacion, { message: 'Confirma la nueva contraseña.' });
  });

  constructor() {
    effect(() => {
      const u = this.user();
      if (u) {
        this.perfilModel.set({
          nombre: u.nombre ?? '',
          email: u.email ?? '',
          sucursal_id: u.sucursal_id ?? '',
        });
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  guardarPerfil(): void {
    const u = this.user();
    if (!u) return;

    this.perfilError.set(null);
    this.perfilSuccess.set(false);

    const root = this.perfilForm();
    if (!root.valid()) {
      root.markAsTouched();
      this.perfilError.set('Por favor completa los campos requeridos correctamente.');
      return;
    }

    const { nombre, email, sucursal_id } = this.perfilModel();
    this.savingPerfil.set(true);

    this.usuarioAdminService
      .actualizarPerfilPropio(u.id, {
        nombre,
        email,
        sucursal_id: sucursal_id || null,
      })
      .subscribe({
        next: () => {
          this.savingPerfil.set(false);
          this.perfilSuccess.set(true);
          this.sonner.success('Perfil actualizado correctamente');
          this.authService.loadCurrentUser().subscribe();
        },
        error: err => {
          this.savingPerfil.set(false);
          console.error('Error al actualizar el perfil:', err);
          const msg = err?.error?.error?.message ?? 'No se pudo actualizar el perfil. Inténtalo de nuevo.';
          this.perfilError.set(msg);
          this.sonner.error(msg);
        },
      });
  }

  guardarPassword(): void {
    const u = this.user();
    if (!u) return;

    this.passwordError.set(null);
    this.passwordSuccess.set(false);

    const root = this.passwordForm();
    if (!root.valid()) {
      root.markAsTouched();
      this.passwordError.set('Por favor completa todos los campos de contraseña correctamente.');
      return;
    }

    const { password_actual, password_nueva, password_confirmacion } = this.passwordModel();

    if (password_nueva !== password_confirmacion) {
      const msg = 'La confirmación de la contraseña no coincide con la nueva contraseña.';
      this.passwordError.set(msg);
      this.sonner.error(msg);
      return;
    }

    this.savingPassword.set(true);

    this.usuarioAdminService
      .cambiarPasswordPropia(u.id, password_actual, password_nueva)
      .subscribe({
        next: () => {
          this.savingPassword.set(false);
          this.passwordSuccess.set(true);
          this.sonner.success('Contraseña actualizada con éxito');
          this.passwordModel.set({
            password_actual: '',
            password_nueva: '',
            password_confirmacion: '',
          });
        },
        error: err => {
          this.savingPassword.set(false);
          console.error('Error al cambiar contraseña:', err);
          const msg = err?.error?.error?.message ?? 'La contraseña actual ingresada es incorrecta o no cumple con las reglas de seguridad.';
          this.passwordError.set(msg);
          this.sonner.error(msg);
        },
      });
  }
}
