import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBan, lucideRotateCcw } from '@ng-icons/lucide';

import { ProveedorService } from '../data-access/proveedor.service';
import {
  ACCIONES_DEFECTO,
  AccionDefecto,
  ESTADOS_RECEPCION,
  EstadoRecepcion,
  MOTIVOS_DEFECTO,
  mensajeProveedorError,
  RecepcionProveedorResponse,
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
import { DevolucionProveedorFormSheetComponent } from '../ui/devolucion-proveedor-form-sheet/devolucion-proveedor-form-sheet.component';

@Component({
  selector: 'app-recepcion-proveedor-detail',
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
  viewProviders: [provideIcons({ lucideArrowLeft, lucideBan, lucideRotateCcw })],
  templateUrl: './recepcion-proveedor-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecepcionProveedorDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private sonner = inject(ZardSonnerService);
  private sheetService = inject(ZardSheetService);

  readonly canGestionarDevolucion = computed(() => this.authService.hasPermission(...PERMISOS.devolucionProveedor.gestionar));

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly recepcion = signal<RecepcionProveedorResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly nombres = signal<Record<string, string>>({});

  readonly hayDefectuososDevolvibles = computed(() =>
    (this.recepcion()?.lineas ?? []).some(l => l.accion_defecto === 'devolucion' && Number(l.cantidad_defectuosa) > 0),
  );

  constructor() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.error.set(false);
    this.proveedorService.obtenerRecepcion(this.id).subscribe({
      next: r => {
        this.recepcion.set(r);
        this.loading.set(false);
        this.resolverProductos(r);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private resolverProductos(r: RecepcionProveedorResponse) {
    const ids = [...new Set(r.lineas.map(l => l.producto_id))].filter(id => !this.nombres()[id]);
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
  labelMotivo(m: string | null) {
    return MOTIVOS_DEFECTO.find(x => x.value === m)?.label ?? m;
  }
  labelAccion(a: AccionDefecto | null) {
    return ACCIONES_DEFECTO.find(x => x.value === a)?.label ?? a;
  }
  labelEstado(e: EstadoRecepcion) {
    return ESTADOS_RECEPCION.find(x => x.value === e)?.label ?? e;
  }
  estadoBadge(e: EstadoRecepcion): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'completa') return 'default';
    if (e === 'con_defectos') return 'destructive';
    return 'secondary';
  }

  crearDevolucion() {
    const r = this.recepcion();
    if (!r) return;
    this.sheetService.create({
      zTitle: 'Devolver al proveedor',
      zDescription: `Recepción ${r.folio}`,
      zContent: DevolucionProveedorFormSheetComponent,
      zSize: 'lg',
      zData: { recepcion: r, nombresProducto: this.nombres() },
      zOkText: 'Crear devolución',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (dev: { id: string }) => {
              this.sonner.success('Devolución creada');
              resolve();
              this.router.navigate(['/proveedores/devoluciones', dev.id]);
            },
            error: (err: unknown) => {
              this.sonner.error(mensajeProveedorError(err, 'No se pudo crear la devolución'));
              reject(err);
            },
          });
        });
      },
    });
  }
}
