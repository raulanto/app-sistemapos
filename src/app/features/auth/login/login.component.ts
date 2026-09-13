import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGalleryVerticalEnd } from '@ng-icons/lucide';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardFieldImports } from '../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardAlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthService } from '@/core/auth/api/auth.service';
import { createLoginForm } from './login.form';

@Component({
  selector: 'app-login',
  imports: [
    FormField,
    NgIcon,
    ZardButtonComponent,
    ZardInputComponent,
    ZardAlertComponent,
    ...ZardFieldImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideGalleryVerticalEnd })],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  private readonly model = signal({ email: '', password: '' });

  protected readonly loginForm = createLoginForm(this.model);

  onSubmit(event: Event) {
    event.preventDefault();

    const root = this.loginForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.model()).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.detail) {
          this.errorMessage.set(
            typeof err.error.detail === 'string' ? err.error.detail : 'Credenciales inválidas',
          );
        } else {
          this.errorMessage.set('Ha ocurrido un error al iniciar sesión. Intenta nuevamente.');
        }
      },
    });
  }
}
