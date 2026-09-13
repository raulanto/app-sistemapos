import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBan, lucideCheck, lucideSend } from '@ng-icons/lucide';

import { ProveedorService } from '../data-access/proveedor.service';
import {
  DevolucionProveedorResponse,
  ESTADOS_DEVOLUCION_PROVEEDOR,
  EstadoDevolucionProveedor,
  mensajeProveedorError,
  RESULTADOS_DEVOLUCION,
  TIPOS_RESOLUCION_DEVOLUCION,
} from '../data-access/proveedores.models';
import { ProductoService } from '../../inventario/data-access/producto.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { CerrarDevolucionSheetComponent } from '../ui/cerrar-devolucion-sheet/cerrar-devolucion-sheet.component';

@Component({
  selector: 'app-devolucion-proveedor-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ...ZardTableImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideBan, lucideCheck, lucideSend })],
  templateUrl: './devolucion-proveedor-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevolucionProveedorDetailComponent {
  private route = inject(ActivatedRoute);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private sonner = inject(ZardSonnerService);
  private sheetService = inject(ZardSheetService);

  readonly canGestionar = computed(() => this.authService.hasPermission(...PERMISOS.devolucionProveedor.gestionar));

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly devolucion = signal<DevolucionProveedorResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly working = signal(false);
  readonly nombres = signal<Record<string, string>>({});

  constructor() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.error.set(false);
    this.proveedorService.obtenerDevolucion(this.id).subscribe({
      next: d => {
        this.devolucion.set(d);
        this.loading.set(false);
        this.resolverProductos(d);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private resolverProductos(d: DevolucionProveedorResponse) {
    const ids = [...new Set(d.lineas.map(l => l.producto_id))].filter(id => !this.nombres()[id]);
    if (ids.length === 0) return;
    forkJoin(ids.map(id => this.productoService.obtenerPorId(id).pipe(catchError(() => of(null))))).subscribe(prods => {
      const nuevo: Record<string, string> = {};
      ids.forEach((id, i) => (nuevo[id] = prods[i]?.nombre ?? id.slice(0, 8)));
      this.nombres.update(m => ({ ...m, ...nuevo }));
    });
  }

  nombreProducto(id: string): string {
    return this.nombres()[id] ?? id.slice(0, 8);
  }
  labelEstado(e: EstadoDevolucionProveedor) {
    return ESTADOS_DEVOLUCION_PROVEEDOR.find(x => x.value === e)?.label ?? e;
  }
  estadoBadge(e: EstadoDevolucionProveedor): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'cerrada') return 'default';
    if (e === 'enviada') return 'secondary';
    return 'outline';
  }
  labelResultado(r: string | null) {
    return RESULTADOS_DEVOLUCION.find(x => x.value === r)?.label ?? '—';
  }
  labelResolucion(t: string | null) {
    return TIPOS_RESOLUCION_DEVOLUCION.find(x => x.value === t)?.label ?? '—';
  }

  enviar() {
    if (this.working()) return;
    this.working.set(true);
    this.proveedorService.enviarDevolucion(this.id).subscribe({
      next: d => {
        this.devolucion.set(d);
        this.working.set(false);
        this.sonner.success('Devolución enviada al proveedor');
      },
      error: err => {
        this.working.set(false);
        this.sonner.error(mensajeProveedorError(err, 'No se pudo enviar la devolución'));
      },
    });
  }

  cerrar() {
    this.sheetService.create({
      zTitle: 'Cerrar devolución',
      zDescription: 'Registra cómo resolvió el proveedor.',
      zContent: CerrarDevolucionSheetComponent,
      zData: { devolucionId: this.id },
      zOkText: 'Cerrar devolución',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (d: DevolucionProveedorResponse) => {
              this.devolucion.set(d);
              this.sonner.success('Devolución cerrada');
              resolve();
            },
            error: (err: unknown) => {
              this.sonner.error(mensajeProveedorError(err, 'No se pudo cerrar la devolución'));
              reject(err);
            },
          });
        });
      },
    });
  }
}
