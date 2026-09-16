import { WritableSignal } from '@angular/core';
import { form, email, required } from '@angular/forms/signals';

export function createLoginForm(model: WritableSignal<{ email: string; password: string }>) {
  return form(model, path => {
    required(path.email, { message: 'Por favor ingresa un correo válido.' });
    email(path.email, { message: 'Por favor ingresa un correo válido.' });
    required(path.password, { message: 'La contraseña es requerida.' });
  });
}
