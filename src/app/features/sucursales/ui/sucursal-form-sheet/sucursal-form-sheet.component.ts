import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { SucursalAdminService } from '../../data-access/sucursal-admin.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import {
  CrearSucursalRequest,
  ActualizarSucursalRequest,
  SucursalResponse,
  TipoSucursal,
  TIPOS_SUCURSAL,
  limpiar as clean,
  normalizarHora as time,
} from '../../data-access/sucursal.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardSwitchComponent } from '../../../../shared/components/switch/switch.component';
import { SucursalMapaPickerComponent, Coords } from '../sucursal-mapa-picker/sucursal-mapa-picker.component';

export interface SucursalSheetData {
  sucursalId?: string;
  /** La vista detalle ya tiene la sucursal cargada; evita un GET extra. */
  sucursal?: SucursalResponse;
}

@Component({
  selector: 'app-sucursal-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardSwitchComponent,
    SucursalMapaPickerComponent,
  ],
  templateUrl: './sucursal-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'sucursalFormSheet',
  // Sin esto el host (inline por defecto) rompe la cadena flex-1/min-h-0 del sheet
  // y el formulario nunca scrollea, tapando los botones del footer.
  host: { style: 'display: contents' },
})
export class SucursalFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sucursalService = inject(SucursalAdminService);

  public sheetData = injectSheetData<SucursalSheetData | undefined>();

  readonly tipos = TIPOS_SUCURSAL;
  loading = signal(false);
  isEditing = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    codigo: ['', Validators.maxLength(20)],
    tipo: ['tienda' as TipoSucursal, Validators.required],
    descripcion: [''],
    permite_ventas: [true],
    telefono: ['', [Validators.required, Validators.maxLength(20)]],
    email: ['', Validators.email],
    direccion: ['', [Validators.required, Validators.maxLength(255)]],
    colonia: ['', Validators.maxLength(100)],
    ciudad: ['', Validators.maxLength(100)],
    estado: ['', Validators.maxLength(100)],
    codigo_postal: ['', Validators.maxLength(10)],
    pais: ['México', Validators.maxLength(60)],
    latitud: [null as number | null],
    longitud: [null as number | null],
    horario_apertura: [''],
    horario_cierre: [''],
  });

  ngOnInit() {
    const preload = this.sheetData?.sucursal;
    this.isEditing = !!(this.sheetData?.sucursalId || preload);

    if (preload) {
      this.patch(preload);
    } else if (this.sheetData?.sucursalId) {
      this.loading.set(true);
      this.sucursalService.obtenerPorId(this.sheetData.sucursalId).subscribe({
        next: s => {
          this.patch(s);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al obtener sucursal', err);
          this.loading.set(false);
        },
      });
    }
  }

  private patch(s: SucursalResponse) {
    this.form.patchValue({
      nombre: s.nombre,
      codigo: s.codigo ?? '',
      tipo: s.tipo,
      descripcion: s.descripcion ?? '',
      permite_ventas: s.permite_ventas,
      telefono: s.telefono,
      email: s.email ?? '',
      direccion: s.direccion,
      colonia: s.colonia ?? '',
      ciudad: s.ciudad ?? '',
      estado: s.estado ?? '',
      codigo_postal: s.codigo_postal ?? '',
      pais: s.pais ?? 'México',
      latitud: s.latitud != null ? Number(s.latitud) : null,
      longitud: s.longitud != null ? Number(s.longitud) : null,
      horario_apertura: (s.horario_apertura ?? '').slice(0, 5),
      horario_cierre: (s.horario_cierre ?? '').slice(0, 5),
    });
  }

  private targetId(): string | undefined {
    return this.sheetData?.sucursalId ?? this.sheetData?.sucursal?.id;
  }

  onCoords(c: Coords) {
    this.form.patchValue({ latitud: c.lat, longitud: c.lon });
  }

  save(): Observable<SucursalResponse> | void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const d = this.form.getRawValue();
    const id = this.targetId();

    if (this.isEditing && id) {
      // Todos los campos van con su flag `cambiar_*`: el formulario está prellenado,
      // así que reenviarlos idénticos es un no-op y evita el dirty-diff.
      const payload: ActualizarSucursalRequest = {
        nombre: d.nombre!,
        direccion: d.direccion!,
        telefono: d.telefono!,
        tipo: d.tipo!,
        permite_ventas: !!d.permite_ventas,
        codigo: clean(d.codigo), cambiar_codigo: true,
        descripcion: clean(d.descripcion), cambiar_descripcion: true,
        colonia: clean(d.colonia), cambiar_colonia: true,
        ciudad: clean(d.ciudad), cambiar_ciudad: true,
        estado: clean(d.estado), cambiar_estado: true,
        codigo_postal: clean(d.codigo_postal), cambiar_codigo_postal: true,
        pais: clean(d.pais), cambiar_pais: true,
        latitud: d.latitud ?? null, longitud: d.longitud ?? null, cambiar_geo: true,
        email: clean(d.email), cambiar_email: true,
        horario_apertura: time(d.horario_apertura), horario_cierre: time(d.horario_cierre), cambiar_horario: true,
      };
      return this.sucursalService.actualizar(id, payload);
    }

    const payload: CrearSucursalRequest = {
      nombre: d.nombre!,
      direccion: d.direccion!,
      telefono: d.telefono!,
      tipo: d.tipo!,
      permite_ventas: !!d.permite_ventas,
      codigo: clean(d.codigo),
      descripcion: clean(d.descripcion),
      colonia: clean(d.colonia),
      ciudad: clean(d.ciudad),
      estado: clean(d.estado),
      codigo_postal: clean(d.codigo_postal),
      pais: clean(d.pais),
      latitud: d.latitud ?? null,
      longitud: d.longitud ?? null,
      email: clean(d.email),
      horario_apertura: time(d.horario_apertura),
      horario_cierre: time(d.horario_cierre),
    };
    return this.sucursalService.crear(payload);
  }
}
