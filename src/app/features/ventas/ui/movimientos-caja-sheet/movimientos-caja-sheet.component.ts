import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowDownLeft, lucideArrowUpRight, lucideReceipt, lucidePlus } from '@ng-icons/lucide';

import { CajaService } from '../../data-access/caja.service';
import {
  MOVIMIENTOS_CAJA,
  MovimientoCajaResponse,
  MovimientoCajaTipo,
} from '../../data-access/ventas.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../../shared/components/sonner/sonner.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';

export interface MovimientosCajaSheetData {
  turnoId: string;
}

@Component({
  selector: 'app-movimientos-caja-sheet',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    NgIconComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
  ],
  viewProviders: [provideIcons({ lucideArrowDownLeft, lucideArrowUpRight, lucideReceipt, lucidePlus })],
  templateUrl: './movimientos-caja-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class MovimientosCajaSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);
  private sonner = inject(ZardSonnerService);

  readonly data = injectSheetData<MovimientosCajaSheetData>();
  readonly tipos = MOVIMIENTOS_CAJA;

  readonly movimientos = signal<MovimientoCajaResponse[]>([]);
  readonly loading = signal(true);
  readonly guardando = signal(false);

  form = this.fb.group({
    tipo: ['retiro' as MovimientoCajaTipo, Validators.required],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    motivo: [''],
  });

  readonly tipoSel = signal<MovimientoCajaTipo>('retiro');
  /** `retiro` y `gasto` exigen motivo. */
  readonly motivoRequerido = computed(() => this.tipoSel() !== 'ingreso');

  ngOnInit() {
    this.form.controls.tipo.valueChanges.subscribe(v => this.tipoSel.set((v as MovimientoCajaTipo) ?? 'retiro'));
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.cajaService.movimientos(this.data.turnoId).subscribe({
      next: ms => {
        this.movimientos.set(ms);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar movimientos', err);
        this.loading.set(false);
      },
    });
  }

  iconoDe(t: MovimientoCajaTipo) {
    return t === 'ingreso' ? 'lucideArrowDownLeft' : t === 'retiro' ? 'lucideArrowUpRight' : 'lucideReceipt';
  }

  registrar() {
    const d = this.form.getRawValue();
    const motivo = (d.motivo ?? '').trim();
    if (this.form.invalid || (this.motivoRequerido() && !motivo) || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.cajaService
      .registrarMovimiento(this.data.turnoId, {
        tipo: d.tipo as MovimientoCajaTipo,
        monto: Number(d.monto),
        ...(motivo ? { motivo } : {}),
      })
      .subscribe({
        next: () => {
          this.sonner.success('Movimiento registrado');
          this.form.reset({ tipo: d.tipo as MovimientoCajaTipo, monto: 0, motivo: '' });
          this.guardando.set(false);
          this.cargar();
        },
        error: err => {
          this.sonner.error(err?.error?.error?.message ?? 'No se pudo registrar el movimiento');
          this.guardando.set(false);
        },
      });
  }
}
