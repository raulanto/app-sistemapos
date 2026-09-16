import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight, lucidePlus, lucideTrash } from '@ng-icons/lucide';

import { EmpleadoAgendaService } from '../../data-access/services/empleado-agenda.service';
import {
  DIAS_SEMANA_AGENDA,
  EmpleadoServicioResponse,
  ExcepcionResponse,
  HorarioBaseResponse,
  mensajeCitaError,
  TIPOS_EXCEPCION,
  TipoExcepcion,
} from '../../data-access/agenda.models';
import { ProductoService } from '../../../inventario/data-access/producto.service';
import { ProductoResponse } from '../../../inventario/data-access/models/producto.model';
import { UsuarioAdminService } from '../../../usuarios/data-access/usuario-admin.service';
import { UsuarioResponse } from '../../../usuarios/data-access/models/usuario.model';
import { SucursalService } from '@core/sucursal/sucursal.service';
import { ZardSonnerService } from '../../../../shared/components/sonner/sonner.service';

import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function hoyISO(): string {
  return toISODate(new Date());
}
/** 'YYYY-MM-DD' -> Date a medianoche LOCAL. `new Date(iso)` la lee en UTC y corre el
 *  día en husos horarios negativos (America/*); acá se arma a mano para evitarlo. */
function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function sumarDias(iso: string, dias: number): string {
  const d = parseISODateLocal(iso);
  d.setDate(d.getDate() + dias);
  return toISODate(d);
}
/** Tope de días a pedir en paralelo por rango: suficiente para un mes, sin abusar del backend. */
const MAX_DIAS_RANGO = 31;

export interface DiaRango {
  fecha: string;
  corto: string;
  diaMes: number;
  esHoy: boolean;
}

@Component({
  selector: 'app-empleado-agenda-editor',
  standalone: true,
  imports: [
    FormsModule,
    NgIconComponent,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardInputComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [provideIcons({ lucideChevronLeft, lucideChevronRight, lucidePlus, lucideTrash })],
  templateUrl: './empleado-agenda-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadoAgendaEditorComponent {
  private empleadoAgendaService = inject(EmpleadoAgendaService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioAdminService);
  private sonner = inject(ZardSonnerService);
  public sucursalService = inject(SucursalService);

  readonly dias = DIAS_SEMANA_AGENDA;
  readonly tiposExcepcion = TIPOS_EXCEPCION;

  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly servicios = signal<ProductoResponse[]>([]);
  readonly serviciosAgendables = computed(() => this.servicios().filter(s => s.duracion_minutos != null));

  readonly empleadoId = signal('');
  readonly loading = signal(false);

  readonly calificados = signal<EmpleadoServicioResponse[]>([]);
  readonly horarios = signal<HorarioBaseResponse[]>([]);

  readonly calificadoIds = computed(() => new Set(this.calificados().map(c => c.servicio_id)));

  // Draft: nuevo horario
  readonly nuevoDia = signal(0);
  readonly nuevoHoraInicio = signal('09:00');
  readonly nuevoHoraFin = signal('18:00');
  readonly nuevaSucursalId = signal(this.sucursalService.selectedSucursalId() ?? '');

  // Excepciones: tira de días del rango elegido, cargados en paralelo y cacheados por fecha.
  readonly rangoInicio = signal(hoyISO());
  readonly rangoFin = signal(sumarDias(hoyISO(), 6));
  readonly diaActivo = signal(hoyISO());
  readonly excepcionesPorFecha = signal<Record<string, ExcepcionResponse[]>>({});
  readonly cargandoRango = signal(false);

  readonly diasRango = computed<DiaRango[]>(() => {
    const inicio = this.rangoInicio();
    const fin = this.rangoFin();
    const hoy = hoyISO();
    const dias: DiaRango[] = [];
    let cursor = parseISODateLocal(inicio);
    const limite = parseISODateLocal(fin);
    let i = 0;
    while (cursor <= limite && i < MAX_DIAS_RANGO) {
      const fecha = toISODate(cursor);
      const corto = this.dias[(cursor.getDay() + 6) % 7].corto;
      dias.push({ fecha, corto, diaMes: cursor.getDate(), esHoy: fecha === hoy });
      cursor.setDate(cursor.getDate() + 1);
      i++;
    }
    return dias;
  });

  readonly excepcionesDelDiaActivo = computed(() => this.excepcionesPorFecha()[this.diaActivo()] ?? []);

  private readonly nombresMes = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  readonly etiquetaDiaActivo = computed(() => {
    const d = parseISODateLocal(this.diaActivo());
    const nombreDia = this.dias[(d.getDay() + 6) % 7].label;
    return `${nombreDia} ${d.getDate()} de ${this.nombresMes[d.getMonth()]}`;
  });

  // Draft: nueva excepción
  readonly nuevoTipoExcepcion = signal<TipoExcepcion>('bloqueo');
  readonly nuevaHoraInicioExc = signal('');
  readonly nuevaHoraFinExc = signal('');
  readonly nuevoMotivoExc = signal('');

  constructor() {
    this.usuarioService.listar({ sort: 'nombre:asc', page_size: 100 }).subscribe({
      next: res => this.usuarios.set(res.data),
      error: () => {},
    });
    this.productoService.listar({ page_size: 100 }).subscribe({
      next: res => this.servicios.set(res.data.filter(p => (p.tipo || 'simple') === 'servicio')),
      error: () => {},
    });
  }

  elegirEmpleado(id: string) {
    this.empleadoId.set(id);
    if (!id) return;
    this.cargarTodo();
  }

  private cargarTodo() {
    this.loading.set(true);
    this.empleadoAgendaService.listarServiciosEmpleado(this.empleadoId()).subscribe({
      next: r => this.calificados.set(r.filter(c => c.activo)),
      error: () => this.calificados.set([]),
    });
    this.empleadoAgendaService.listarHorariosEmpleado(this.empleadoId()).subscribe({
      next: r => {
        this.horarios.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.cargarRangoExcepciones();
  }

  /** El backend sólo da excepciones de un día a la vez: se piden todas las del rango en paralelo. */
  cargarRangoExcepciones() {
    const empleadoId = this.empleadoId();
    const dias = this.diasRango();
    if (!empleadoId || dias.length === 0) return;
    this.cargandoRango.set(true);
    forkJoin(
      dias.map(d =>
        this.empleadoAgendaService.listarExcepciones(empleadoId, d.fecha).pipe(
          map(lista => [d.fecha, lista] as const),
          catchError(() => of([d.fecha, []] as const)),
        ),
      ),
    ).subscribe(pares => {
      this.excepcionesPorFecha.set(Object.fromEntries(pares));
      this.cargandoRango.set(false);
    });
  }

  elegirDiaActivo(fecha: string) {
    this.diaActivo.set(fecha);
  }

  private moverRango(dias: number) {
    this.rangoInicio.set(sumarDias(this.rangoInicio(), dias));
    this.rangoFin.set(sumarDias(this.rangoFin(), dias));
    this.diaActivo.set(this.rangoInicio());
    this.cargarRangoExcepciones();
  }
  semanaAnterior() {
    this.moverRango(-7);
  }
  semanaSiguiente() {
    this.moverRango(7);
  }
  irAHoy() {
    this.rangoInicio.set(hoyISO());
    this.rangoFin.set(sumarDias(hoyISO(), 6));
    this.diaActivo.set(hoyISO());
    this.cargarRangoExcepciones();
  }

  /** Rango a mano: si se pasa del tope, se recorta el fin en vez de pedir de más. */
  setRangoInicio(v: string) {
    this.rangoInicio.set(v);
    if (sumarDias(v, MAX_DIAS_RANGO - 1) < this.rangoFin()) {
      this.rangoFin.set(sumarDias(v, MAX_DIAS_RANGO - 1));
    }
    if (this.rangoFin() < v) this.rangoFin.set(v);
    this.diaActivo.set(v);
    this.cargarRangoExcepciones();
  }
  setRangoFin(v: string) {
    const tope = sumarDias(this.rangoInicio(), MAX_DIAS_RANGO - 1);
    this.rangoFin.set(v > tope ? tope : v);
    if (v > tope) this.sonner.info(`El rango se limita a ${MAX_DIAS_RANGO} días.`);
    this.cargarRangoExcepciones();
  }

  toggleServicio(servicioId: string) {
    if (!this.empleadoId()) return;
    if (this.calificadoIds().has(servicioId)) {
      this.empleadoAgendaService.quitarServicioEmpleado(this.empleadoId(), servicioId).subscribe({
        next: () => {
          this.calificados.update(list => list.filter(c => c.servicio_id !== servicioId));
          this.sonner.success('Servicio quitado');
        },
        error: err => this.sonner.error(mensajeCitaError(err, 'No se pudo quitar el servicio')),
      });
    } else {
      this.empleadoAgendaService.calificarEmpleado(this.empleadoId(), servicioId).subscribe({
        next: c => {
          this.calificados.update(list => [...list, c]);
          this.sonner.success('Servicio agregado');
        },
        error: err => this.sonner.error(mensajeCitaError(err, 'No se pudo agregar el servicio')),
      });
    }
  }

  agregarHorario() {
    if (!this.empleadoId() || !this.nuevaSucursalId()) {
      this.sonner.error('Elige una sucursal');
      return;
    }
    this.empleadoAgendaService
      .crearHorarioEmpleado(this.empleadoId(), {
        sucursal_id: this.nuevaSucursalId(),
        dia_semana: this.nuevoDia(),
        hora_inicio: this.nuevoHoraInicio(),
        hora_fin: this.nuevoHoraFin(),
      })
      .subscribe({
        next: h => {
          this.horarios.update(list => [...list, h]);
          this.sonner.success('Horario agregado');
        },
        error: err => this.sonner.error(mensajeCitaError(err, 'No se pudo agregar el horario')),
      });
  }

  quitarHorario(h: HorarioBaseResponse) {
    this.empleadoAgendaService.eliminarHorarioEmpleado(this.empleadoId(), h.id).subscribe({
      next: () => this.horarios.update(list => list.filter(x => x.id !== h.id)),
      error: err => this.sonner.error(mensajeCitaError(err, 'No se pudo quitar el horario')),
    });
  }

  agregarExcepcion() {
    const fecha = this.diaActivo();
    if (!this.empleadoId() || !fecha) return;
    this.empleadoAgendaService
      .crearExcepcion(this.empleadoId(), {
        fecha,
        tipo: this.nuevoTipoExcepcion(),
        hora_inicio: this.nuevaHoraInicioExc() || null,
        hora_fin: this.nuevaHoraFinExc() || null,
        motivo: this.nuevoMotivoExc().trim() || null,
      })
      .subscribe({
        // Sólo se actualiza la entrada de ese día en el cache: no hace falta repetir
        // las N llamadas del rango completo por una excepción nueva.
        next: e => {
          this.excepcionesPorFecha.update(m => ({ ...m, [fecha]: [...(m[fecha] ?? []), e] }));
          this.nuevaHoraInicioExc.set('');
          this.nuevaHoraFinExc.set('');
          this.nuevoMotivoExc.set('');
          this.sonner.success('Excepción agregada');
        },
        error: err => this.sonner.error(mensajeCitaError(err, 'No se pudo agregar la excepción')),
      });
  }

  quitarExcepcion(fecha: string, e: ExcepcionResponse) {
    this.empleadoAgendaService.eliminarExcepcion(this.empleadoId(), e.id).subscribe({
      next: () =>
        this.excepcionesPorFecha.update(m => ({ ...m, [fecha]: (m[fecha] ?? []).filter(x => x.id !== e.id) })),
      error: err => this.sonner.error(mensajeCitaError(err, 'No se pudo quitar la excepción')),
    });
  }

  nombreServicio(id: string): string {
    return this.servicios().find(s => s.id === id)?.nombre ?? id.slice(0, 8);
  }
  labelDia(n: number): string {
    return this.dias.find(d => d.value === n)?.label ?? String(n);
  }
}
