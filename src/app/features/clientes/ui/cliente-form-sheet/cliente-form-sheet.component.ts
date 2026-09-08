import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent],
  templateUrl: './cliente-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'clienteFormSheet',
  host: { style: 'display: contents' },
})
export class ClienteFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);

  public sheetData = injectSheetData<ClienteSheetData | undefined>();
  isEditing = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', Validators.email],
    telefono: [''],
    rfc_identificacion: [''],
    limite_credito: [0, [Validators.min(0)]],
  });

  ngOnInit() {
    const c = this.sheetData?.cliente;
    this.isEditing = !!c;
    if (!c) return;

    // En edición el límite de crédito se cambia desde su acción propia.
    this.form.controls.limite_credito.disable();
    this.form.patchValue({
      nombre: c.nombre,
      email: c.email ?? '',
      telefono: c.telefono ?? '',
      rfc_identificacion: c.rfc_identificacion ?? '',
    });
  }

  save(): Observable<ClienteResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const d = this.form.getRawValue();
    const email = d.email?.trim() || null;
    const telefono = d.telefono?.trim() || null;
    const rfc = d.rfc_identificacion?.trim() || null;

    if (this.isEditing && this.sheetData?.cliente) {
      const payload: ActualizarClienteRequest = {
        nombre: d.nombre!.trim(),
        telefono,
        rfc_identificacion: rfc,
        // `email` sólo se envía si el usuario lo tocó (permite limpiarlo).
        ...(this.form.controls.email.dirty ? { email, cambiar_email: true } : {}),
      };
      return this.clienteService.actualizar(this.sheetData.cliente.id, payload);
    }

    const payload: CrearClienteRequest = {
      nombre: d.nombre!.trim(),
      email,
      telefono,
      rfc_identificacion: rfc,
      limite_credito: Number(d.limite_credito) || 0,
    };
    return this.clienteService.crear(payload);
  }
}
