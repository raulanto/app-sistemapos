import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { VentaService } from '../../data-access/venta.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import {
  DevolucionResponse,
  DevolverVentaRequest,
  MetodoDevolucion,
  METODOS_DEVOLUCION,
  VentaResponse,
} from '../../data-access/ventas.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface DevolucionSheetData {
  venta: VentaResponse;
  /** Turno abierto actual, donde se registra la devolución. */
  turnoId: string;
  nombres: Record<string, string>;
}

interface FilaDevolucion {
  detalle_venta_id: string;
  nombre: string;
  restante: number;
  precioNeto: number;
  cantidad: number;
}

@Component({
  selector: 'app-devolucion-sheet',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  templateUrl: './devolucion-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'devolucionSheet',
  host: { style: 'display: contents' },
})
export class DevolucionSheetComponent {
  private ventaService = inject(VentaService);
  public sheetData = injectSheetData<DevolucionSheetData>();

  /** El monedero sólo se puede reintegrar si la venta se registró con teléfono. */
  readonly metodos = METODOS_DEVOLUCION.filter(m => m.value !== 'monedero' || !!this.sheetData.venta.telefono);
  readonly metodo = signal<MetodoDevolucion>('efectivo');
  readonly motivo = signal('');

  readonly filas = signal<FilaDevolucion[]>(
    (this.sheetData.venta.lineas ?? [])
      .map(l => {
        const restante = Number(l.cantidad) - Number(l.cantidad_devuelta ?? 0);
        const bruto = Number(l.cantidad) * Number(l.precio_unitario);
        const neto = bruto - Number(l.descuento_linea) - Number(l.promo_descuento ?? 0);
        return {
          detalle_venta_id: l.id,
          nombre: this.sheetData.nombres[l.producto_id] ?? l.producto_id.slice(0, 8),
          restante,
          precioNeto: Number(l.cantidad) > 0 ? neto / Number(l.cantidad) : 0,
          cantidad: 0,
        };
      })
      .filter(f => f.restante > 0.0001),
  );

  readonly montoEstimado = computed(() =>
    this.filas().reduce((s, f) => s + Math.min(f.cantidad, f.restante) * f.precioNeto, 0),
  );
  readonly hayAlgo = computed(() => this.filas().some(f => f.cantidad > 0));

  setCantidad(id: string, v: number) {
    this.filas.update(list =>
      list.map(f => (f.detalle_venta_id === id ? { ...f, cantidad: Math.max(0, Math.min(Number(v) || 0, f.restante)) } : f)),
    );
  }

  save(): Observable<DevolucionResponse> | void {
    const lineas = this.filas()
      .filter(f => f.cantidad > 0)
      .map(f => ({ detalle_venta_id: f.detalle_venta_id, cantidad: f.cantidad }));
    if (lineas.length === 0) return;

    const req: DevolverVentaRequest = {
      caja_turno_id: this.sheetData.turnoId,
      metodo_devolucion: this.metodo(),
      motivo: this.motivo().trim() || null,
      lineas,
    };
    const idem = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    return this.ventaService.devolver(this.sheetData.venta.id, req, idem);
  }
}
