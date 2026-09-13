import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ProveedorService } from '../../data-access/proveedor.service';
import { CONDICIONES_PAGO, ProveedorResponse, TIPOS_PERSONA } from '../../data-access/proveedores.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';

export interface ProveedorSheetData {
  proveedor?: ProveedorResponse;
}

@Component({
  selector: 'app-proveedor-form-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports, ZardTextareaComponent],
  templateUrl: './proveedor-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'proveedorFormSheet',
  host: { style: 'display: contents' },
})
export class ProveedorFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  readonly sheetData = injectSheetData<ProveedorSheetData | undefined>();

  readonly tiposPersona = TIPOS_PERSONA;
  readonly condicionesPago = CONDICIONES_PAGO;

  readonly isEditing = !!this.sheetData?.proveedor;

  readonly form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(30)]],
    razon_social: ['', [Validators.required, Validators.maxLength(200)]],
    tipo_persona: ['moral' as 'fisica' | 'moral', Validators.required],
    condiciones_pago: ['contado' as 'contado' | 'credito', Validators.required],
    dias_credito: [null as number | null],
    moneda: ['MXN', [Validators.maxLength(3)]],
    nombre_comercial: ['', [Validators.maxLength(200)]],
    rfc: ['', [Validators.maxLength(20)]],
    contacto_principal: ['', [Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(30)]],
    email: ['', [Validators.maxLength(150)]],
    direccion_calle: [''],
    direccion_numero: [''],
    direccion_colonia: [''],
    direccion_ciudad: [''],
    direccion_estado: [''],
    direccion_codigo_postal: [''],
    notas: [''],
  });

  readonly esCredito = signal(false);
  readonly faltaDiasCredito = computed(
    () => this.esCredito() && !(Number(this.form.get('dias_credito')?.value) > 0),
  );

  ngOnInit() {
    const p = this.sheetData?.proveedor;
    if (p) {
      this.form.patchValue({
        codigo: p.codigo,
        razon_social: p.razon_social,
        tipo_persona: p.tipo_persona,
        condiciones_pago: p.condiciones_pago,
        dias_credito: p.dias_credito,
        moneda: p.moneda,
        nombre_comercial: p.nombre_comercial ?? '',
        rfc: p.rfc ?? '',
        contacto_principal: p.contacto_principal ?? '',
        telefono: p.telefono ?? '',
        email: p.email ?? '',
        direccion_calle: p.direccion_calle ?? '',
        direccion_numero: p.direccion_numero ?? '',
        direccion_colonia: p.direccion_colonia ?? '',
        direccion_ciudad: p.direccion_ciudad ?? '',
        direccion_estado: p.direccion_estado ?? '',
        direccion_codigo_postal: p.direccion_codigo_postal ?? '',
        notas: p.notas ?? '',
      });
      // El código no se puede renombrar desde aquí: PATCH /proveedores/{id} no lo acepta.
      this.form.get('codigo')?.disable();
    }
    this.esCredito.set(this.form.get('condiciones_pago')?.value === 'credito');
    this.form.get('condiciones_pago')?.valueChanges.subscribe(v => this.esCredito.set(v === 'credito'));
  }

  save(): Observable<ProveedorResponse> | void {
    if (this.form.invalid || this.faltaDiasCredito()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const diasCredito = v.condiciones_pago === 'credito' ? Number(v.dias_credito) || null : null;

    if (this.isEditing && this.sheetData?.proveedor) {
      return this.proveedorService.actualizar(this.sheetData.proveedor.id, {
        razon_social: v.razon_social!,
        tipo_persona: v.tipo_persona!,
        condiciones_pago: v.condiciones_pago!,
        dias_credito: diasCredito,
        cambiar_dias_credito: this.form.get('dias_credito')!.dirty || this.form.get('condiciones_pago')!.dirty,
        moneda: v.moneda || 'MXN',
        nombre_comercial: v.nombre_comercial?.trim() || null,
        cambiar_nombre_comercial: this.form.get('nombre_comercial')!.dirty,
        rfc: v.rfc?.trim() || null,
        cambiar_rfc: this.form.get('rfc')!.dirty,
        contacto_principal: v.contacto_principal?.trim() || null,
        cambiar_contacto_principal: this.form.get('contacto_principal')!.dirty,
        telefono: v.telefono?.trim() || null,
        cambiar_telefono: this.form.get('telefono')!.dirty,
        email: v.email?.trim() || null,
        cambiar_email: this.form.get('email')!.dirty,
        notas: v.notas?.trim() || null,
        cambiar_notas: this.form.get('notas')!.dirty,
        direccion_calle: v.direccion_calle?.trim() || null,
        direccion_numero: v.direccion_numero?.trim() || null,
        direccion_colonia: v.direccion_colonia?.trim() || null,
        direccion_ciudad: v.direccion_ciudad?.trim() || null,
        direccion_estado: v.direccion_estado?.trim() || null,
        direccion_codigo_postal: v.direccion_codigo_postal?.trim() || null,
      });
    }

    return this.proveedorService.crear({
      codigo: v.codigo!.trim(),
      razon_social: v.razon_social!.trim(),
      tipo_persona: v.tipo_persona!,
      condiciones_pago: v.condiciones_pago!,
      dias_credito: diasCredito,
      moneda: v.moneda?.trim() || 'MXN',
      nombre_comercial: v.nombre_comercial?.trim() || null,
      rfc: v.rfc?.trim() || null,
      contacto_principal: v.contacto_principal?.trim() || null,
      telefono: v.telefono?.trim() || null,
      email: v.email?.trim() || null,
      direccion_calle: v.direccion_calle?.trim() || null,
      direccion_numero: v.direccion_numero?.trim() || null,
      direccion_colonia: v.direccion_colonia?.trim() || null,
      direccion_ciudad: v.direccion_ciudad?.trim() || null,
      direccion_estado: v.direccion_estado?.trim() || null,
      direccion_codigo_postal: v.direccion_codigo_postal?.trim() || null,
      notas: v.notas?.trim() || null,
    });
  }
}
