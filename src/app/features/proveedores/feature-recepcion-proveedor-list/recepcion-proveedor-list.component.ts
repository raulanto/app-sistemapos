import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideRefreshCw, lucideX } from '@ng-icons/lucide';

import { ProveedorService } from '../data-access/proveedor.service';
import { ESTADOS_RECEPCION, EstadoRecepcion, mensajeProveedorError, RecepcionProveedorResponse } from '../data-access/proveedores.models';
import { SucursalService } from '../../../core/sucursal/sucursal.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { RecepcionProveedorFormSheetComponent } from '../ui/recepcion-proveedor-form-sheet/recepcion-proveedor-form-sheet.component';

@Component({
  selector: 'app-recepcion-proveedor-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    NgIconComponent,
    ...ZardTableImports,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideRefreshCw, lucideX })],
  templateUrl: './recepcion-proveedor-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecepcionProveedorListComponent {
  private proveedorService = inject(ProveedorService);
  public sucursalService = inject(SucursalService);
  private authService = inject(AuthService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);

  readonly canRegistrar = computed(() => this.authService.hasPermission(...PERMISOS.recepcionProveedor.registrar));

  readonly estados = ESTADOS_RECEPCION;

  readonly recepciones = signal<RecepcionProveedorResponse[]>([]);
  readonly nombresProveedor = signal<Record<string, string>>({});
  readonly loading = signal(true);

  readonly sucursalId = signal('');
  readonly hayFiltros = computed(() => !!this.sucursalId());

  constructor() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.proveedorService
      .listarRecepciones({ sucursal_id: this.sucursalId() || undefined, page_size: 50, sort: 'fecha_recepcion:desc' })
      .subscribe({
        next: res => {
          this.recepciones.set(res.data);
          this.loading.set(false);
          this.resolverProveedores(res.data);
        },
        error: err => {
          console.error('Error al cargar recepciones', err);
          this.loading.set(false);
        },
      });
  }

  private resolverProveedores(rs: RecepcionProveedorResponse[]) {
    const ids = [...new Set(rs.map(r => r.proveedor_id))].filter(id => !this.nombresProveedor()[id]);
    if (ids.length === 0) return;
    forkJoin(ids.map(id => this.proveedorService.obtener(id).pipe(catchError(() => of(null))))).subscribe(provs => {
      const nuevo: Record<string, string> = {};
      ids.forEach((id, i) => (nuevo[id] = provs[i]?.razon_social ?? id.slice(0, 8)));
      this.nombresProveedor.update(m => ({ ...m, ...nuevo }));
    });
  }

  nombreProveedor(id: string): string {
    return this.nombresProveedor()[id] ?? id.slice(0, 8);
  }

  setSucursal(v: string) {
    this.sucursalId.set(v);
    this.cargar();
  }
  limpiarFiltros() {
    this.sucursalId.set('');
    this.cargar();
  }

  nueva() {
    this.sheetService.create({
      zTitle: 'Nueva recepción',
      zDescription: 'Registra lo que llegó de un proveedor.',
      zContent: RecepcionProveedorFormSheetComponent,
      zSize: 'lg',
      zOkText: 'Registrar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Recepción registrada');
              this.cargar();
              resolve();
            },
            error: (err: unknown) => {
              this.sonner.error(mensajeProveedorError(err, 'No se pudo registrar la recepción'));
              reject(err);
            },
          });
        });
      },
    });
  }

  labelEstado(e: EstadoRecepcion) {
    return this.estados.find(x => x.value === e)?.label ?? e;
  }
  estadoBadge(e: EstadoRecepcion): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'completa') return 'default';
    if (e === 'con_defectos') return 'destructive';
    return 'secondary';
  }
}
