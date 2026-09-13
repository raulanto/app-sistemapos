import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw, lucideRotateCcw, lucideX } from '@ng-icons/lucide';

import { ProveedorService } from '../data-access/proveedor.service';
import {
  DevolucionProveedorResponse,
  ESTADOS_DEVOLUCION_PROVEEDOR,
  EstadoDevolucionProveedor,
} from '../data-access/proveedores.models';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';

@Component({
  selector: 'app-devolucion-proveedor-list',
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
  viewProviders: [provideIcons({ lucideRefreshCw, lucideRotateCcw, lucideX })],
  templateUrl: './devolucion-proveedor-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevolucionProveedorListComponent {
  private proveedorService = inject(ProveedorService);

  readonly estados = ESTADOS_DEVOLUCION_PROVEEDOR;

  readonly devoluciones = signal<DevolucionProveedorResponse[]>([]);
  readonly nombresProveedor = signal<Record<string, string>>({});
  readonly loading = signal(true);

  readonly estado = signal<EstadoDevolucionProveedor | ''>('');
  readonly hayFiltros = computed(() => !!this.estado());

  constructor() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.proveedorService
      .listarDevoluciones({ estado: this.estado() || undefined, page_size: 50, sort: 'created_at:desc' })
      .subscribe({
        next: res => {
          this.devoluciones.set(res.data);
          this.loading.set(false);
          this.resolverProveedores(res.data);
        },
        error: err => {
          console.error('Error al cargar devoluciones', err);
          this.loading.set(false);
        },
      });
  }

  private resolverProveedores(ds: DevolucionProveedorResponse[]) {
    const ids = [...new Set(ds.map(d => d.proveedor_id))].filter(id => !this.nombresProveedor()[id]);
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

  setEstado(v: string) {
    this.estado.set(v as EstadoDevolucionProveedor | '');
    this.cargar();
  }
  limpiarFiltros() {
    this.estado.set('');
    this.cargar();
  }

  labelEstado(e: EstadoDevolucionProveedor) {
    return this.estados.find(x => x.value === e)?.label ?? e;
  }
  estadoBadge(e: EstadoDevolucionProveedor): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'cerrada') return 'default';
    if (e === 'enviada') return 'secondary';
    return 'outline';
  }
}
