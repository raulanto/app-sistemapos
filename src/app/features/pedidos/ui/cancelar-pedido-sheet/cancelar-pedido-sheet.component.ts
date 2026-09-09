import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { PedidoService } from '../../data-access/pedido.service';
import { PedidoResponse } from '../../data-access/pedidos.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';

export interface CancelarPedidoSheetData {
  pedidoId: string;
  folio: string;
  /** Anticipos no reembolsados; si > 0 hay que devolver ese dinero a mano. */
  totalAnticipos: number;
}

@Component({
  selector: 'app-cancelar-pedido-sheet',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, ...ZardFieldImports, ZardTextareaComponent],
  template: `
    <form [formGroup]="form" class="grid min-h-0 flex-1 auto-rows-min gap-5 px-4 pb-4 overflow-y-auto">
      <div class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-foreground">
        Cancelar el pedido <span class="font-mono font-medium">{{ sheetData.folio }}</span> lo deja en estado
        <span class="font-medium">cancelado</span>. No se puede deshacer.
      </div>

      @if (sheetData.totalAnticipos > 0) {
        <p class="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[0.8rem] font-medium text-amber-700 dark:text-amber-400">
          Hay que reembolsar {{ sheetData.totalAnticipos | currency }} al cliente. El sistema sólo marca los
          anticipos como reembolsados; la devolución del dinero se hace fuera del sistema.
        </p>
      }

      <div z-field>
        <label z-field-label for="motivo">Motivo</label>
        <textarea z-textarea id="motivo" formControlName="motivo" rows="3" placeholder="Ej. el cliente se arrepintió"></textarea>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cancelarPedidoSheet',
  host: { style: 'display: contents' },
})
export class CancelarPedidoSheetComponent {
  private fb = inject(FormBuilder);
  private pedidoService = inject(PedidoService);
  readonly sheetData = injectSheetData<CancelarPedidoSheetData>();

  form = this.fb.group({ motivo: [''] });

  save(): Observable<PedidoResponse> {
    return this.pedidoService.cancelar(this.sheetData.pedidoId, {
      motivo: this.form.getRawValue().motivo?.trim() || null,
    });
  }
}
