import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { CajaService } from '../../data-access/caja.service';
import { VentaService } from '../../data-access/venta.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { CajaTurnoResponse, ResumenTurnoResponse, CorteCajaResponse } from '../../data-access/ventas.models';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';

export interface CerrarCajaSheetData {
  turnoId: string;
}

@Component({
  selector: 'app-cerrar-caja-sheet',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, NgClass, ...ZardFieldImports, ZardInputComponent],
  template: `
    <form [formGroup]="form" class="grid min-h-0 flex-1 auto-rows-min gap-5 px-4 pb-4 overflow-y-auto">
      @if (resumen(); as r) {
        <dl class="rounded-md border text-sm">
          <div class="flex justify-between border-b px-3 py-2">
            <dt class="text-muted-foreground">Efectivo inicial</dt>
            <dd class="tabular-nums">{{ r.turno.saldo_inicial | currency }}</dd>
          </div>
          <div class="flex justify-between border-b px-3 py-2">
            <dt class="text-muted-foreground">+ Ventas en efectivo ({{ r.cantidad_ventas }})</dt>
            <dd class="tabular-nums">{{ r.total_efectivo | currency }}</dd>
          </div>
          @if (+r.total_devoluciones_efectivo > 0) {
            <div class="flex justify-between border-b px-3 py-2 text-amber-600">
              <dt>− Devoluciones en efectivo</dt>
              <dd class="tabular-nums">{{ r.total_devoluciones_efectivo | currency }}</dd>
            </div>
          }
          <div class="flex justify-between px-3 py-2 font-medium">
            <dt>Efectivo esperado</dt>
            <dd class="tabular-nums">{{ r.saldo_esperado | currency }}</dd>
          </div>
        </dl>
      } @else {
        <div class="h-24 animate-pulse rounded-md bg-muted"></div>
      }

      <div z-field>
        <label z-field-label for="saldo_final_declarado">Efectivo contado *</label>
        <input z-input id="saldo_final_declarado" type="number" min="0" step="0.01" formControlName="saldo_final_declarado" placeholder="0.00" />
      </div>

      @if (resumen()) {
        <div class="flex items-center justify-between rounded-md px-3 py-2.5"
             [ngClass]="diferencia() > 0 ? 'bg-green-500/10' : diferencia() < 0 ? 'bg-destructive/10' : 'bg-muted'">
          <span class="text-sm font-medium">Diferencia</span>
          <span class="text-lg font-semibold tabular-nums"
                [ngClass]="diferencia() > 0 ? 'text-green-600' : diferencia() < 0 ? 'text-destructive' : ''">
            {{ diferencia() | currency }}
            <span class="text-xs font-normal text-muted-foreground">
              {{ diferencia() > 0 ? '(sobrante)' : diferencia() < 0 ? '(faltante)' : '(cuadra)' }}
            </span>
          </span>
        </div>
      }

      <p class="text-[0.8rem] text-muted-foreground">
        El arqueo solo cuenta efectivo. Tarjeta y transferencia se concilian aparte.
      </p>

      @if (corte(); as c) {
        <dl class="rounded-md border text-sm">
          <p class="border-b px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground">Corte por método</p>
          <div class="flex justify-between px-3 py-1.5"><dt class="text-muted-foreground">Efectivo</dt><dd class="tabular-nums">{{ c.total_efectivo | currency }}</dd></div>
          <div class="flex justify-between px-3 py-1.5"><dt class="text-muted-foreground">Tarjeta</dt><dd class="tabular-nums">{{ c.total_tarjeta | currency }}</dd></div>
          <div class="flex justify-between px-3 py-1.5"><dt class="text-muted-foreground">Transferencia</dt><dd class="tabular-nums">{{ c.total_transferencia | currency }}</dd></div>
          <div class="flex justify-between px-3 py-1.5"><dt class="text-muted-foreground">Crédito</dt><dd class="tabular-nums">{{ c.total_credito | currency }}</dd></div>
          @if (+c.total_descuento_promo > 0) {
            <div class="flex justify-between px-3 py-1.5 text-primary"><dt>Descuento por promos</dt><dd class="tabular-nums">{{ c.total_descuento_promo | currency }}</dd></div>
          }
          @if (+c.total_devoluciones_efectivo > 0) {
            <div class="flex justify-between px-3 py-1.5 text-amber-600"><dt>Devoluciones en efectivo</dt><dd class="tabular-nums">− {{ c.total_devoluciones_efectivo | currency }}</dd></div>
          }
        </dl>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cerrarCajaSheet',
  host: { style: 'display: contents' },
})
export class CerrarCajaSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);
  private ventaService = inject(VentaService);
  public sheetData = injectSheetData<CerrarCajaSheetData>();

  readonly resumen = signal<ResumenTurnoResponse | null>(null);
  readonly corte = signal<CorteCajaResponse | null>(null);

  form = this.fb.group({
    saldo_final_declarado: [0, [Validators.required, Validators.min(0)]],
  });

  readonly diferencia = computed(() => {
    const r = this.resumen();
    if (!r) return 0;
    return Number(this.form.controls.saldo_final_declarado.value ?? 0) - Number(r.saldo_esperado);
  });

  ngOnInit() {
    this.cajaService.resumen(this.sheetData.turnoId).subscribe({
      next: r => this.resumen.set(r),
      error: err => console.error('Error al cargar el arqueo', err),
    });
    // Corte por método de pago (requiere permiso reportes.leer; si no, se omite).
    this.ventaService.corteCaja(this.sheetData.turnoId).subscribe({
      next: c => this.corte.set(c),
      error: () => this.corte.set(null),
    });
  }

  save(): Observable<CajaTurnoResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    return this.cajaService.cerrar(this.sheetData.turnoId, {
      saldo_final_declarado: Number(this.form.getRawValue().saldo_final_declarado),
    });
  }
}
