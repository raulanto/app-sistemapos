import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucidePencil, lucideBan, lucideCircleCheck, lucideTag, lucideTicket } from '@ng-icons/lucide';

import { PromocionService } from '../data-access/promocion.service';
import { PromocionResponse, TipoPromocion, TIPOS_PROMOCION } from '../data-access/promociones.models';
import { CuponSheetComponent } from '../ui/cupon-sheet/cupon-sheet.component';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { PromocionFormSheetComponent } from '../ui/promocion-form-sheet/promocion-form-sheet.component';

@Component({
  selector: 'app-promocion-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    NgIconComponent,
    ...ZardCardImports,
    ...ZardTableImports,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucidePencil, lucideBan, lucideCircleCheck, lucideTag, lucideTicket })],
  templateUrl: './promocion-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromocionListComponent {
  private promocionService = inject(PromocionService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private authService = inject(AuthService);

  readonly canCrear = computed(() => this.authService.hasPermission(...PERMISOS.promociones.crear));
  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.promociones.editar));

  readonly tipos = TIPOS_PROMOCION;
  readonly promociones = signal<PromocionResponse[]>([]);
  readonly loading = signal(true);
  readonly filtroTipo = signal<TipoPromocion | ''>('');
  readonly filtroActivo = signal<'' | 'true' | 'false'>('');

  constructor() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.promocionService
      .listar({
        tipo: this.filtroTipo() || undefined,
        activo: this.filtroActivo() === '' ? undefined : this.filtroActivo() === 'true',
        page_size: 100,
        sort: 'prioridad:asc',
      })
      .subscribe({
        next: res => {
          this.promociones.set(res.data);
          this.loading.set(false);
        },
        error: err => {
          console.error('Error al cargar promociones', err);
          this.loading.set(false);
        },
      });
  }

  etiquetaTipo(t: TipoPromocion) {
    return this.tipos.find(x => x.value === t)?.label ?? t;
  }

  regla(p: PromocionResponse): string {
    if (p.tipo === 'nxm') return `${p.nxm_lleva} x ${p.nxm_paga}`;
    if (p.tipo === 'porcentaje') return `-${p.descuento_pct}%`;
    return `$${p.precio_fijo}`;
  }

  /** Etiquetas cortas de las condiciones activas de una promo, para la tabla. */
  condiciones(p: PromocionResponse): string[] {
    const c: string[] = [];
    if (p.combinable) c.push('combinable');
    if (p.requiere_cupon) c.push('cupón');
    if (p.metodo_pago_requerido) c.push(p.metodo_pago_requerido.replace('_', ' '));
    if (p.cliente_segmento) c.push(p.cliente_segmento);
    if (p.monto_minimo_compra) c.push(`mín. $${p.monto_minimo_compra}`);
    if (p.hora_desde && p.hora_hasta) c.push(`${p.hora_desde.slice(0, 5)}–${p.hora_hasta.slice(0, 5)}`);
    if (p.sucursales?.length) c.push(`${p.sucursales.length} suc.`);
    return c;
  }

  openCuponSheet(promocion: PromocionResponse) {
    this.sheetService.create({
      zTitle: `Cupones · ${promocion.nombre}`,
      zDescription: 'Códigos que habilitan esta promoción en la venta.',
      zContent: CuponSheetComponent,
      zSize: 'lg',
      zData: { promocion },
      zOkText: null,
      zCancelText: 'Cerrar',
    });
  }

  openCreateSheet() {
    this.sheetService.create({
      zTitle: 'Nueva promoción',
      zDescription: 'Regla de descuento sobre productos o presentaciones.',
      zContent: PromocionFormSheetComponent,
      zSize: 'lg',
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Promoción creada', 'Error al crear la promoción'),
    });
  }

  openEditSheet(promocion: PromocionResponse) {
    this.sheetService.create({
      zTitle: `Editar ${promocion.nombre}`,
      zDescription: 'Ajusta la regla, los objetivos o la vigencia.',
      zContent: PromocionFormSheetComponent,
      zSize: 'lg',
      zData: { promocion },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Promoción actualizada', 'Error al actualizar la promoción'),
    });
  }

  private persistir(instance: any, okMsg: string, errMsg: string): Promise<void> | false {
    const obs = instance.save();
    if (!obs) return false;
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({
        next: () => {
          this.sonner.success(okMsg);
          this.cargar();
          resolve();
        },
        error: (err: any) => {
          this.sonner.error(err?.error?.error?.message ?? errMsg);
          reject(err);
        },
      });
    });
  }

  toggleActivo(p: PromocionResponse) {
    const req = p.activo ? this.promocionService.desactivar(p.id) : this.promocionService.reactivar(p.id);
    req.subscribe({
      next: () => {
        this.sonner.success(p.activo ? 'Promoción desactivada' : 'Promoción reactivada');
        this.cargar();
      },
      error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo cambiar el estado'),
    });
  }
}
