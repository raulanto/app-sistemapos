import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGalleryVerticalEnd } from '@ng-icons/lucide';

import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardFieldImports } from '../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardAlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthService } from '@/core/auth/api/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    ZardButtonComponent,
    ZardInputComponent,
    ZardAlertComponent,
    ...ZardFieldImports
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideGalleryVerticalEnd })],
  template: `
    <div class="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div class="w-full max-w-sm">
        <div class="flex flex-col gap-6">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div z-field-group>
              <div class="flex flex-col items-center gap-2 text-center">
                <a href="#" class="flex flex-col items-center gap-2 font-medium">
                  <div class="flex size-8 items-center justify-center rounded-md">
                    <ng-icon name="lucideGalleryVerticalEnd" class="size-6" />
                  </div>
                  <span class="sr-only">Sistema POS</span>
                </a>
                <h1 class="text-xl font-bold">Bienvenido al Sistema</h1>
                <p z-field-description>
                  Ingresa tus credenciales para continuar
                </p>
              </div>

              @if (errorMessage()) {
                <z-alert zType="destructive" zTitle="Error" [zDescription]="errorMessage() || ''" />
              }

              <div z-field>
                <label z-field-label for="email">Correo electrónico</label>
                <input z-input id="email" type="email" placeholder="ejemplo@empresa.com" formControlName="email" required />
                @if (loginForm.controls.email.invalid && loginForm.controls.email.touched) {
                  <z-field-error>Por favor ingresa un correo válido.</z-field-error>
                }
              </div>

              <div z-field>
                <div class="flex items-center">
                  <label z-field-label for="password">Contraseña</label>
                </div>
                <input z-input id="password" type="password" placeholder="Tu contraseña" formControlName="password" required />
                @if (loginForm.controls.password.invalid && loginForm.controls.password.touched) {
                  <z-field-error>La contraseña es requerida.</z-field-error>
                }
              </div>

              <div z-field>
                <button z-button type="submit" class="w-full" [zLoading]="isLoading()" [zDisabled]="loginForm.invalid || isLoading()">
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </form>
          
          <p z-field-description class="px-6 text-center">
            Al continuar, aceptas nuestros <a href="#" class="underline underline-offset-4 hover:text-primary">Términos de Servicio</a> y <a href="#" class="underline underline-offset-4 hover:text-primary">Políticas de Privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.detail) {
           this.errorMessage.set(typeof err.error.detail === 'string' ? err.error.detail : 'Credenciales inválidas');
        } else {
           this.errorMessage.set('Ha ocurrido un error al iniciar sesión. Intenta nuevamente.');
        }
      }
    });
  }
}
