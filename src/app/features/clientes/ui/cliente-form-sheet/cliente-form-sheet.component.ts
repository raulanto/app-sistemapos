import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { disabled, email, form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { ClienteService } from '../../data-access/cliente.service';
import {
  ActualizarClienteRequest,
  ClienteResponse,
  CrearClienteRequest,
} from '../../data-access/clientes.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface ClienteSheetData {
  cliente?: ClienteResponse;
}

@Component({
  selector: 'app-cliente-form-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ZardInputComponent],
  templateUrl: './cliente-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'clienteFormSheet',
  host: { style: 'display: contents' },
})
export class ClienteFormSheetComponent implements OnInit {
  private clienteService = inject(ClienteService);

  public sheetData = injectSheetData<ClienteSheetData | undefined>();
  isEditing = false;

  private readonly model = signal({
    nombre: '',
    email: '',
    telefono: '',
    rfc_identificacion: '',
    limite_credito: 0,
  });

  protected readonly clienteForm = form(this.model, path => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 150, { message: 'Máximo 150 caracteres.' });
    email(path.email, { message: 'Ingresa un correo válido.' });
    min(path.limite_credito, 0, { message: 'No puede ser negativo.' });
    // En edición el límite de crédito se cambia desde su acción propia.
    disabled(path.limite_credito, () => !!this.sheetData?.cliente);
  });

  ngOnInit() {
    const c = this.sheetData?.cliente;
    this.isEditing = !!c;
    if (!c) return;

    this.model.set({
      nombre: c.nombre,
      email: c.email ?? '',
      telefono: c.telefono ?? '',
      rfc_identificacion: c.rfc_identificacion ?? '',
      limite_credito: 0,
    });
  }

  save(): Observable<ClienteResponse> | void {
    const root = this.clienteForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }
    const d = this.model();
    const email = d.email.trim() || null;
    const telefono = d.telefono.trim() || null;
    const rfc = d.rfc_identificacion.trim() || null;

    if (this.isEditing && this.sheetData?.cliente) {
      const payload: ActualizarClienteRequest = {
        nombre: d.nombre.trim(),
        telefono,
        rfc_identificacion: rfc,
        // `email` sólo se envía si el usuario lo tocó (permite limpiarlo).
        ...(this.clienteForm.email().dirty() ? { email, cambiar_email: true } : {}),
      };
      return this.clienteService.actualizar(this.sheetData.cliente.id, payload);
    }

    const payload: CrearClienteRequest = {
      nombre: d.nombre.trim(),
      email,
      telefono,
      rfc_identificacion: rfc,
      limite_credito: Number(d.limite_credito) || 0,
    };
    return this.clienteService.crear(payload);
  }
}
