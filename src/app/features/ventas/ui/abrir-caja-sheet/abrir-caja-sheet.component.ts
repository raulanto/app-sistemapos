import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { CajaService } from '../../data-access/caja.service';
import { CajaResponse, CajaTurnoResponse } from '../../data-access/ventas.models';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

@Component({
  selector: 'app-abrir-caja-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  template: `
    <form [formGroup]="form" class="grid min-h-0 flex-1 auto-rows-min gap-6 px-4 pb-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        Elegí la terminal y declará el efectivo con el que arranca el cajón. La sucursal se toma de tu usuario.
      </p>

      <div z-field>
        <label z-field-label>Terminal *</label>
        <z-select formControlName="caja_id" placeholder="Selecciona la caja">
          @for (c of cajas(); track c.id) {
            <z-select-item [zValue]="c.id">{{ c.nombre }}</z-select-item>
          }
        </z-select>
        @if (cajas().length === 0 && !cargandoCajas()) {
          <p class="text-[0.8rem] text-muted-foreground">No hay terminales activas en tu sucursal.</p>
        }
        @if (form.controls.caja_id.invalid && form.controls.caja_id.touched) {
          <p class="text-[0.8rem] font-medium text-destructive">Selecciona una terminal.</p>
        }
      </div>

      <div z-field>
        <label z-field-label for="saldo_inicial">Efectivo inicial *</label>
        <input z-input id="saldo_inicial" type="number" min="0" step="0.01" formControlName="saldo_inicial" placeholder="0.00" />
        @if (form.controls.saldo_inicial.invalid && form.controls.saldo_inicial.touched) {
          <p class="text-[0.8rem] font-medium text-destructive">Ingresa un monto válido (≥ 0).</p>
        }
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'abrirCajaSheet',
  host: { style: 'display: contents' },
})
export class AbrirCajaSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);

  readonly cajas = signal<CajaResponse[]>([]);
  readonly cargandoCajas = signal(true);

  form = this.fb.group({
    caja_id: ['', Validators.required],
    saldo_inicial: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    this.cajaService.listarCajas().subscribe({
      next: cs => {
        this.cajas.set(cs);
        this.cargandoCajas.set(false);
        if (cs.length === 1) this.form.patchValue({ caja_id: cs[0].id });
      },
      error: err => {
        console.error('Error al cargar terminales', err);
        this.cargandoCajas.set(false);
      },
    });
  }

  save(): Observable<CajaTurnoResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const d = this.form.getRawValue();
    return this.cajaService.abrir({ caja_id: d.caja_id!, saldo_inicial: Number(d.saldo_inicial) });
  }
}
