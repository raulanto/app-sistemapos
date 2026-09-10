import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { VentaService } from '../../data-access/venta.service';
import { VentaResponse } from '../../data-access/ventas.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';

export interface AnularVentaSheetData {
  ventaId: string;
  folio: string;
  /** true si la venta tiene devoluciones: el backend rechaza la anulación (403). */
  tieneDevoluciones?: boolean;
}

@Component({
  selector: 'app-anular-venta-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ZardTextareaComponent],
  template: `
    <form class="grid min-h-0 flex-1 auto-rows-min gap-5 px-4 pb-4 overflow-y-auto">
      <div class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-foreground">
        Anular la venta <span class="font-mono font-medium">{{ sheetData.folio }}</span> repone el stock,
        revierte el crédito y el monedero, y la deja como <span class="font-medium">cancelada</span>.
        No se puede deshacer.
      </div>

      @if (sheetData.tieneDevoluciones) {
        <p class="text-[0.8rem] font-medium text-destructive">
          Esta venta tiene devoluciones registradas: el sistema no permite anularla. Devuelve el resto en su lugar.
        </p>
      }

      <div z-field>
        <label z-field-label for="motivo">Motivo (opcional)</label>
        <textarea z-textarea id="motivo" rows="3" placeholder="Ej. cobro duplicado" [formField]="anularForm.motivo"></textarea>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'anularVentaSheet',
  host: { style: 'display: contents' },
})
export class AnularVentaSheetComponent {
  private ventaService = inject(VentaService);
  readonly sheetData = injectSheetData<AnularVentaSheetData>();

  private readonly model = signal({ motivo: '' });
  protected readonly anularForm = form(this.model);

  save(): Observable<VentaResponse> | void {
    if (this.sheetData.tieneDevoluciones) return;
    return this.ventaService.anular(this.sheetData.ventaId, {
      motivo: this.model().motivo.trim() || null,
    });
  }
}
