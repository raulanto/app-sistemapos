import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { SucursalAdminService } from '../../data-access/sucursal-admin.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import {
  CrearSucursalRequest,
  ActualizarSucursalRequest,
  SucursalResponse,
  SucursalFormValue,
  SUCURSAL_FORM_INICIAL,
  sucursalFormSchema,
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
    FormField,
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
  private sucursalService = inject(SucursalAdminService);

  public sheetData = injectSheetData<SucursalSheetData | undefined>();

  readonly tipos = TIPOS_SUCURSAL;
  loading = signal(false);
  isEditing = false;

  protected readonly model = signal<SucursalFormValue>({ ...SUCURSAL_FORM_INICIAL });
  protected readonly sucForm = form(this.model, sucursalFormSchema);

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
    this.model.set({
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
    this.model.update(m => ({ ...m, latitud: c.lat, longitud: c.lon }));
  }

  save(): Observable<SucursalResponse> | void {
    const root = this.sucForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }

    const d = this.model();
    const id = this.targetId();

    if (this.isEditing && id) {
      // Todos los campos van con su flag `cambiar_*`: el formulario está prellenado,
      // así que reenviarlos idénticos es un no-op y evita el dirty-diff.
      const payload: ActualizarSucursalRequest = {
        nombre: d.nombre,
        direccion: d.direccion,
        telefono: d.telefono,
        tipo: d.tipo,
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
      nombre: d.nombre,
      direccion: d.direccion,
      telefono: d.telefono,
      tipo: d.tipo,
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
