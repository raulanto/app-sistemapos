import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX } from '@ng-icons/lucide';

import { AgendaService } from '../../data-access/agenda.service';
import { CitaResponse, CrearCitaRequest, RecursoResponse } from '../../data-access/agenda.models';
import { ProductoService } from '../../../inventario/data-access/producto.service';
import { ProductoResponse } from '../../../inventario/data-access/models/producto.model';
import { ClienteResponse } from '../../../clientes/data-access/clientes.models';
import { ClienteService } from '../../../clientes/data-access/cliente.service';
import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardSkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-crear-cita-sheet',
  standalone: true,
  imports: [
    FormsModule,
    NgIconComponent,
    ...ZardFieldImports,
    ...ZardSelectImports,
    ZardInputComponent,
    ZardButtonComponent,
    ZardCheckboxComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [provideIcons({ lucideSearch, lucideX })],
  templateUrl: './crear-cita-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'crearCitaSheet',
  host: { style: 'display: contents' },
})
export class CrearCitaSheetComponent {
  private agendaService = inject(AgendaService);
  private productoService = inject(ProductoService);
  private clienteService = inject(ClienteService);

  /**
   * Se cargan aquí (no via zData): si dependieran de un snapshot que el que abre el sheet
   * pasó como prop, un click en "Nueva cita" antes de que ese fetch terminara dejaba el
   * picker vacío para siempre — el sheet nunca reaccionaba a que el signal del padre
   * terminara de llenarse. Cargando su propia data, siempre llega completa.
   */
  readonly cargandoServicios = signal(true);
  readonly servicios = signal<ProductoResponse[]>([]);
  readonly recursos = signal<RecursoResponse[]>([]);

  readonly servicioId = signal('');
  readonly fechaHoraInicio = signal('');
  readonly recursoId = signal('');
  readonly disponibilidadCruzada = signal(false);

  readonly servicio = computed(() => this.servicios().find(s => s.id === this.servicioId()) ?? null);
  readonly requiereRecurso = computed(() => !!this.servicio()?.requiere_recurso);
  readonly permiteCruzada = computed(() => !!this.servicio()?.disponibilidad_cruzada_activa);

  readonly clienteBusqueda = signal('');
  readonly clientesEncontrados = signal<ClienteResponse[]>([]);
  readonly buscandoClientes = signal(true);
  readonly cliente = signal<ClienteResponse | null>(null);

  constructor() {
    this.productoService.listar({ page_size: 100 }).subscribe({
      next: res => {
        this.servicios.set(res.data.filter(p => (p.tipo || 'simple') === 'servicio' && p.duracion_minutos != null));
        this.cargandoServicios.set(false);
      },
      error: () => this.cargandoServicios.set(false),
    });
    this.agendaService.listarRecursos({ incluir_inactivos: false }).subscribe({
      next: r => this.recursos.set(r),
      error: () => {},
    });
    this.buscarClientes();
  }

  buscarClientes() {
    const q = this.clienteBusqueda().trim();
    this.buscandoClientes.set(true);
    this.clienteService.listar({ q: q || undefined, activo: true, page_size: 8, sort: 'nombre:asc' }).subscribe({
      next: res => {
        this.clientesEncontrados.set(res.data);
        this.buscandoClientes.set(false);
      },
      error: () => {
        this.clientesEncontrados.set([]);
        this.buscandoClientes.set(false);
      },
    });
  }

  elegirCliente(c: ClienteResponse) {
    this.cliente.set(c);
    this.clientesEncontrados.set([]);
    this.clienteBusqueda.set('');
  }

  quitarCliente() {
    this.cliente.set(null);
    this.buscarClientes();
  }

  save(): Observable<CitaResponse> | void {
    if (!this.servicioId() || !this.fechaHoraInicio()) return;
    const req: CrearCitaRequest = {
      servicio_id: this.servicioId(),
      fecha_hora_inicio: new Date(this.fechaHoraInicio()).toISOString(),
      cliente_id: this.cliente()?.id ?? null,
      recurso_id: this.recursoId() || null,
      disponibilidad_cruzada: this.permiteCruzada() ? this.disponibilidadCruzada() : false,
    };
    return this.agendaService.crearCita(req);
  }
}
