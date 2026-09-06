import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideSave } from '@ng-icons/lucide';

import { SucursalAdminService } from '../data-access/sucursal-admin.service';
import { SucursalService as SucursalGlobalService } from '@/core/sucursal/sucursal.service';
import {
  CrearSucursalRequest,
  TipoSucursal,
  TIPOS_SUCURSAL,
  limpiar,
  normalizarHora,
} from '../data-access/sucursal.models';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardFieldImports } from '../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardSwitchComponent } from '../../../shared/components/switch/switch.component';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { SucursalMapaPickerComponent, Coords } from '../ui/sucursal-mapa-picker/sucursal-mapa-picker.component';

@Component({
  selector: 'app-sucursal-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardSwitchComponent,
    ZardButtonComponent,
    SucursalMapaPickerComponent,
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideSave })],
  templateUrl: './sucursal-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SucursalCreateComponent {
  private fb = inject(FormBuilder);
  private service = inject(SucursalAdminService);
  private sucursalGlobal = inject(SucursalGlobalService);
  private sonner = inject(ZardSonnerService);
  private router = inject(Router);

  readonly tipos = TIPOS_SUCURSAL;
  readonly guardando = signal(false);

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

  onCoords(c: Coords) {
    this.form.patchValue({ latitud: c.lat, longitud: c.lon });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.sonner.error('Revisa los campos obligatorios');
      return;
    }
    const d = this.form.getRawValue();
    const payload: CrearSucursalRequest = {
      nombre: d.nombre!,
      direccion: d.direccion!,
      telefono: d.telefono!,
      tipo: d.tipo!,
      permite_ventas: !!d.permite_ventas,
      codigo: limpiar(d.codigo),
      descripcion: limpiar(d.descripcion),
      colonia: limpiar(d.colonia),
      ciudad: limpiar(d.ciudad),
      estado: limpiar(d.estado),
      codigo_postal: limpiar(d.codigo_postal),
      pais: limpiar(d.pais),
      latitud: d.latitud ?? null,
      longitud: d.longitud ?? null,
      email: limpiar(d.email),
      horario_apertura: normalizarHora(d.horario_apertura),
      horario_cierre: normalizarHora(d.horario_cierre),
    };

    this.guardando.set(true);
    this.service.crear(payload).subscribe({
      next: s => {
        this.sonner.success('Sucursal creada');
        this.sucursalGlobal.cargarSucursales();
        this.router.navigate(['/sucursales', s.id]);
      },
      error: err => {
        console.error(err);
        this.guardando.set(false);
        this.sonner.error(err?.error?.error?.message ?? 'Error al crear la sucursal');
      },
    });
  }
}
