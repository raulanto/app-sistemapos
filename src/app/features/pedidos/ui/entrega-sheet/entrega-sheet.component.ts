import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { PedidoService } from '../../data-access/pedido.service';
import {
  EntregaRequest,
  ESTADOS_ENTREGA,
  EstadoEntrega,
  PedidoResponse,
  siguientesEstadosEntrega,
  TipoPedido,
} from '../../data-access/pedidos.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { UsuarioAdminService } from '../../../usuarios/data-access/usuario-admin.service';
import { UsuarioResponse } from '../../../usuarios/data-access/usuarios.models';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardTextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

export interface EntregaSheetData {
  pedidoId: string;
  tipo: TipoPedido;
  estadoEntrega: EstadoEntrega | null;
  repartidorId: string | null;
}

@Component({
  selector: 'app-entrega-sheet',
  standalone: true,
  imports: [FormsModule, ...ZardFieldImports, ...ZardSelectImports, ZardTextareaComponent, ZardButtonComponent],
  template: `
    <div class="grid min-h-0 flex-1 auto-rows-min gap-5 px-4 pb-4 overflow-y-auto">
      <div z-field>
        <label z-field-label>Repartidor</label>
        <z-select [ngModel]="repartidorId()" (ngModelChange)="repartidorId.set($event)" placeholder="Sin asignar">
          <z-select-item zValue="">Sin asignar</z-select-item>
          @for (u of repartidores(); track u.id) {
            <z-select-item [zValue]="u.id">{{ u.nombre }}</z-select-item>
          }
        </z-select>
      </div>

      <div z-field>
        <label z-field-label>Estado de entrega</label>
        <p class="text-sm">
          Actual: <span class="font-medium">{{ label(sheetData.estadoEntrega) }}</span>
        </p>
        @if (siguientes().length) {
          <div class="mt-1 flex flex-wrap gap-2">
            @for (s of siguientes(); track s) {
              <button z-button type="button" [zType]="destino() === s ? 'default' : 'outline'" zSize="sm" (click)="elegir(s)">
                {{ label(s) }}
              </button>
            }
          </div>
        } @else {
          <p class="text-[0.8rem] text-muted-foreground">No hay transiciones disponibles desde este estado.</p>
        }
      </div>

      @if (destino() === 'fallido') {
        <div z-field>
          <label z-field-label for="motivo">Motivo del fallo *</label>
          <textarea z-textarea id="motivo" rows="2" [ngModel]="motivo()" (ngModelChange)="motivo.set($event)"
                    placeholder="Ej. nadie en el domicilio"></textarea>
        </div>
      }

      @if (nada()) {
        <p class="text-[0.8rem] text-muted-foreground">Elige un repartidor o un nuevo estado para guardar.</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'entregaSheet',
  host: { style: 'display: contents' },
})
export class EntregaSheetComponent {
  private pedidoService = inject(PedidoService);
  private usuarioService = inject(UsuarioAdminService);
  readonly sheetData = injectSheetData<EntregaSheetData>();

  readonly repartidores = signal<UsuarioResponse[]>([]);
  readonly repartidorId = signal<string>(this.sheetData.repartidorId ?? '');
  readonly destino = signal<EstadoEntrega | null>(null);
  readonly motivo = signal('');

  readonly siguientes = computed(() => siguientesEstadosEntrega(this.sheetData.estadoEntrega, this.sheetData.tipo));
  /** No hay nada que guardar: ni cambió el repartidor ni se eligió un estado. */
  readonly nada = computed(
    () => !this.destino() && (this.repartidorId() || '') === (this.sheetData.repartidorId || ''),
  );

  constructor() {
    this.usuarioService.listar({ sort: 'nombre:asc' }).subscribe({
      next: res => this.repartidores.set(res.data.filter(u => u.activo)),
      error: () => this.repartidores.set([]),
    });
  }

  label(s: EstadoEntrega | null): string {
    return ESTADOS_ENTREGA.find(x => x.value === s)?.label ?? '—';
  }

  elegir(s: EstadoEntrega) {
    this.destino.set(this.destino() === s ? null : s);
  }

  save(): Observable<PedidoResponse> | void {
    const destino = this.destino();
    if (destino === 'fallido' && !this.motivo().trim()) return;
    if (this.nada()) return;

    const req: EntregaRequest = {};
    if (destino) req.estado_entrega = destino;
    if ((this.repartidorId() || '') !== (this.sheetData.repartidorId || '')) {
      req.repartidor_id = this.repartidorId() || null;
    }
    if (destino === 'fallido') req.motivo = this.motivo().trim();
    return this.pedidoService.entrega(this.sheetData.pedidoId, req);
  }
}
