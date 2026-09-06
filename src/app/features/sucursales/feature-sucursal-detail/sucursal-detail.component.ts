import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePencil,
  lucideLoader,
  lucideBan,
  lucideCircleCheck,
  lucideMapPin,
  lucidePhone,
  lucideMail,
  lucideClock,
  lucideExternalLink,
} from '@ng-icons/lucide';

import { SucursalAdminService } from '../data-access/sucursal-admin.service';
import { SucursalResponse, TIPOS_SUCURSAL } from '../data-access/sucursal.models';
import { SucursalService as SucursalGlobalService } from '@/core/sucursal/sucursal.service';
import { IMAGEN_MAX_BYTES, IMAGEN_TIPOS_PERMITIDOS } from '../../inventario/data-access/inventario.models';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardSeparatorComponent } from '../../../shared/components/separator/separator.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { SucursalFormSheetComponent } from '../ui/sucursal-form-sheet/sucursal-form-sheet.component';

@Component({
  selector: 'app-sucursal-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardSeparatorComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucidePencil,
      lucideLoader,
      lucideBan,
      lucideCircleCheck,
      lucideMapPin,
      lucidePhone,
      lucideMail,
      lucideClock,
      lucideExternalLink,
    }),
  ],
  templateUrl: './sucursal-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SucursalDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(SucursalAdminService);
  private readonly sucursalGlobal = inject(SucursalGlobalService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly sheetService = inject(ZardSheetService);

  readonly sucursal = signal<SucursalResponse | null>(null);
  readonly loading = signal(true);
  readonly subiendo = signal(false);
  readonly fachadaRota = signal(false);

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly tipoLabel = computed(
    () => TIPOS_SUCURSAL.find(t => t.value === this.sucursal()?.tipo)?.label ?? this.sucursal()?.tipo ?? '',
  );

  readonly direccionLarga = computed(() => {
    const s = this.sucursal();
    if (!s) return '';
    return [s.colonia, s.ciudad, s.estado, s.codigo_postal, s.pais].filter(Boolean).join(', ') || 'Sin datos adicionales';
  });

  readonly coords = computed(() => {
    const s = this.sucursal();
    if (!s?.latitud || !s?.longitud) return null;
    const lat = Number(s.latitud);
    const lon = Number(s.longitud);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  });

  readonly mapaUrl = computed<SafeResourceUrl | null>(() => {
    const c = this.coords();
    if (!c) return null;
    const d = 0.008;
    const bbox = `${c.lon - d},${c.lat - d},${c.lon + d},${c.lat + d}`;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${c.lat},${c.lon}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly mapaLink = computed(() => {
    const c = this.coords();
    return c ? `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=16/${c.lat}/${c.lon}` : null;
  });

  constructor() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.service.obtenerPorId(this.id).subscribe({
      next: s => {
        this.sucursal.set(s);
        this.fachadaRota.set(false);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar la sucursal', err);
        this.sonner.error('No se pudo cargar la sucursal');
        this.loading.set(false);
      },
    });
  }

  editar() {
    const s = this.sucursal();
    if (!s) return;
    this.sheetService.create({
      zTitle: `Editar ${s.nombre}`,
      zDescription: 'Modifica los datos de la sucursal.',
      zContent: SucursalFormSheetComponent,
      zSize: 'lg',
      zData: { sucursal: s },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (actualizada: SucursalResponse) => {
              this.sucursal.set(actualizada);
              this.sucursalGlobal.cargarSucursales();
              this.sonner.success('Sucursal actualizada');
              resolve();
            },
            error: (err: any) => {
              console.error(err);
              this.sonner.error(err?.error?.error?.message ?? 'Error al actualizar la sucursal');
              reject(err);
            },
          });
        });
      },
    });
  }

  onFachadaInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!(IMAGEN_TIPOS_PERMITIDOS as readonly string[]).includes(file.type)) {
      this.sonner.error('Formato no permitido. Usa JPG, PNG o WebP.');
      return;
    }
    if (file.size > IMAGEN_MAX_BYTES) {
      this.sonner.error('La imagen supera 5 MiB.');
      return;
    }
    this.subiendo.set(true);
    this.service.subirFachada(this.id, file).subscribe({
      next: s => {
        this.sucursal.set(s);
        this.fachadaRota.set(false);
        this.subiendo.set(false);
        this.sonner.success('Fachada actualizada');
      },
      error: err => {
        console.error(err);
        this.subiendo.set(false);
        this.sonner.error(err?.status === 400 ? 'Formato o tamaño no válido.' : 'Error al subir la fachada');
      },
    });
  }

  toggleActivo() {
    const s = this.sucursal();
    if (!s) return;
    const activar = !s.activo;
    this.alertDialog.confirm({
      zTitle: activar ? `¿Reactivar ${s.nombre}?` : `¿Desactivar ${s.nombre}?`,
      zDescription: activar
        ? 'La sucursal volverá a estar disponible.'
        : 'La sucursal dejará de estar disponible para nuevos movimientos y ventas.',
      zOkText: activar ? 'Reactivar' : 'Desactivar',
      zOkDestructive: !activar,
      zOnOk: () => {
        const req = activar ? this.service.reactivar(s.id) : this.service.desactivar(s.id);
        req.subscribe({
          next: actualizada => {
            this.sucursal.set(actualizada);
            this.sucursalGlobal.cargarSucursales();
            this.sonner.success(activar ? 'Sucursal reactivada' : 'Sucursal desactivada');
          },
          error: err => {
            console.error(err);
            this.sonner.error('No se pudo cambiar el estado');
          },
        });
      },
    });
  }
}
