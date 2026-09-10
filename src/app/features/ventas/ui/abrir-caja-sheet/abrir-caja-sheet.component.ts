import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { CajaService } from '../../data-access/caja.service';
import { CajaResponse, CajaTurnoResponse } from '../../data-access/ventas.models';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

@Component({
  selector: 'app-abrir-caja-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  template: `
    <form class="grid min-h-0 flex-1 auto-rows-min gap-6 px-4 pb-4 overflow-y-auto">
      <p class="text-sm text-muted-foreground">
        Elegí la terminal y declará el efectivo con el que arranca el cajón. La sucursal se toma de tu usuario.
      </p>

      @let cajaId = abrirForm.caja_id();
      @let cajaIdInvalid = cajaId.invalid() && cajaId.touched();
      <div z-field [attr.data-invalid]="cajaIdInvalid || null">
        <label z-field-label>Terminal *</label>
        <z-select [formField]="abrirForm.caja_id" placeholder="Selecciona la caja" [zInvalid]="cajaIdInvalid">
          @for (c of cajas(); track c.id) {
            <z-select-item [zValue]="c.id">{{ c.nombre }}</z-select-item>
          }
        </z-select>
        @if (cajas().length === 0 && !cargandoCajas()) {
          <p class="text-[0.8rem] text-muted-foreground">No hay terminales activas en tu sucursal.</p>
        }
        @if (cajaIdInvalid) {
          <z-field-error [zErrors]="cajaId.errors()" />
        }
      </div>

      @let saldo = abrirForm.saldo_inicial();
      @let saldoInvalid = saldo.invalid() && saldo.touched();
      <div z-field [attr.data-invalid]="saldoInvalid || null">
        <label z-field-label for="saldo_inicial">Efectivo inicial *</label>
        <input z-input id="saldo_inicial" type="number" step="0.01" placeholder="0.00"
          [formField]="abrirForm.saldo_inicial" [attr.aria-invalid]="saldoInvalid || null" />
        @if (saldoInvalid) {
          <z-field-error [zErrors]="saldo.errors()" />
        }
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'abrirCajaSheet',
  host: { style: 'display: contents' },
})
export class AbrirCajaSheetComponent implements OnInit {
  private cajaService = inject(CajaService);

  readonly cajas = signal<CajaResponse[]>([]);
  readonly cargandoCajas = signal(true);

  private readonly model = signal({ caja_id: '', saldo_inicial: 0 });

  protected readonly abrirForm = form(this.model, path => {
    required(path.caja_id, { message: 'Selecciona una terminal.' });
    required(path.saldo_inicial, { message: 'Ingresa un monto válido (≥ 0).' });
    min(path.saldo_inicial, 0, { message: 'Ingresa un monto válido (≥ 0).' });
  });

  ngOnInit() {
    this.cajaService.listarCajas().subscribe({
      next: cs => {
        this.cajas.set(cs);
        this.cargandoCajas.set(false);
        if (cs.length === 1) this.model.update(m => ({ ...m, caja_id: cs[0].id }));
      },
      error: err => {
        console.error('Error al cargar terminales', err);
        this.cargandoCajas.set(false);
      },
    });
  }

  save(): Observable<CajaTurnoResponse> | void {
    const root = this.abrirForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }
    const d = this.model();
    return this.cajaService.abrir({ caja_id: d.caja_id, saldo_inicial: Number(d.saldo_inicial) });
  }
}
