import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBan,
  lucideCircleCheck,
  lucideClipboardList,
  lucidePencil,
  lucideStar,
  lucideTrash,
} from '@ng-icons/lucide';

import { ProveedorService } from '../data-access/proveedor.service';
import {
  ESTADOS_PEDIDO_PROVEEDOR,
  EstadoPedidoProveedor,
  mensajeProveedorError,
  PedidoProveedorResponse,
  ProductoProveedorResponse,
  ProveedorResponse,
  ResumenProveedorResponse,
} from '../data-access/proveedores.models';
import { ProductoService } from '../../inventario/data-access/producto.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardTabsImports } from '../../../shared/components/tabs/tabs.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ProveedorFormSheetComponent } from '../ui/proveedor-form-sheet/proveedor-form-sheet.component';

interface FilaProducto {
  link: ProductoProveedorResponse;
  nombre: string;
  sku: string;
}

@Component({
  selector: 'app-proveedor-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ...ZardTableImports,
    ...ZardTabsImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideBan,
      lucideCircleCheck,
      lucideClipboardList,
      lucidePencil,
      lucideStar,
      lucideTrash,
    }),
  ],
  templateUrl: './proveedor-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedorDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private alertDialog = inject(ZardAlertDialogService);

  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.proveedores.editar));
  readonly canGestionarVinculo = computed(() => this.authService.hasPermission(...PERMISOS.proveedores.productoProveedor));

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly proveedor = signal<ProveedorResponse | null>(null);
  readonly resumen = signal<ResumenProveedorResponse | null>(null);
  readonly productos = signal<FilaProducto[]>([]);
  readonly pedidos = signal<PedidoProveedorResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly cargandoProductos = signal(true);
  readonly cargandoPedidos = signal(true);

  constructor() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.error.set(false);
    this.proveedorService.obtener(this.id).subscribe({
      next: p => {
        this.proveedor.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
    this.proveedorService.resumen(this.id).subscribe({ next: r => this.resumen.set(r), error: () => this.resumen.set(null) });
    this.cargarProductos();
    this.proveedorService.listarPedidos({ proveedor_id: this.id, page_size: 10, sort: 'fecha_pedido:desc' }).subscribe({
      next: res => {
        this.pedidos.set(res.data);
        this.cargandoPedidos.set(false);
      },
      error: () => this.cargandoPedidos.set(false),
    });
  }

  private cargarProductos() {
    this.cargandoProductos.set(true);
    this.proveedorService.listarProductosDeProveedor(this.id, true).subscribe({
      next: links => {
        if (links.length === 0) {
          this.productos.set([]);
          this.cargandoProductos.set(false);
          return;
        }
        forkJoin(
          links.map(link => this.productoService.obtenerPorId(link.producto_id).pipe(catchError(() => of(null)))),
        ).subscribe(prods => {
          this.productos.set(
            links.map((link, i) => ({
              link,
              nombre: prods[i]?.nombre ?? link.producto_id.slice(0, 8),
              sku: prods[i]?.sku ?? '—',
            })),
          );
          this.cargandoProductos.set(false);
        });
      },
      error: () => this.cargandoProductos.set(false),
    });
  }

  labelEstadoPedido(e: EstadoPedidoProveedor) {
    return ESTADOS_PEDIDO_PROVEEDOR.find(x => x.value === e)?.label ?? e;
  }
  estadoPedidoBadge(e: EstadoPedidoProveedor): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'recibido') return 'default';
    if (e === 'cancelado') return 'destructive';
    if (e === 'parcial' || e === 'enviado') return 'secondary';
    return 'outline';
  }

  editar() {
    const p = this.proveedor();
    if (!p) return;
    this.sheetService.create({
      zTitle: `Editar ${p.codigo}`,
      zDescription: 'Actualiza los datos del proveedor.',
      zContent: ProveedorFormSheetComponent,
      zSize: 'lg',
      zData: { proveedor: p },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (actualizado: ProveedorResponse) => {
              this.proveedor.set(actualizado);
              this.sonner.success('Proveedor actualizado');
              resolve();
            },
            error: (err: unknown) => {
              this.sonner.error(mensajeProveedorError(err, 'No se pudo actualizar el proveedor'));
              reject(err);
            },
          });
        });
      },
    });
  }

  toggleActivo() {
    const p = this.proveedor();
    if (!p) return;
    const accion = p.activo ? 'Desactivar' : 'Activar';
    this.alertDialog.confirm({
      zTitle: `¿${accion} ${p.razon_social}?`,
      zOkText: accion,
      zOkDestructive: p.activo,
      zOnOk: () => {
        const obs = p.activo ? this.proveedorService.desactivar(p.id) : this.proveedorService.activar(p.id);
        obs.subscribe({
          next: actualizado => {
            this.proveedor.set(actualizado);
            this.sonner.success(`Proveedor ${p.activo ? 'desactivado' : 'activado'}`);
          },
          error: err => this.sonner.error(mensajeProveedorError(err, `No se pudo ${accion.toLowerCase()} el proveedor`)),
        });
      },
    });
  }

  marcarPrincipal(fila: FilaProducto) {
    this.proveedorService.marcarPrincipal(fila.link.producto_id, fila.link.id).subscribe({
      next: () => {
        this.sonner.success('Marcado como proveedor principal de ese producto');
        this.cargarProductos();
      },
      error: err => this.sonner.error(mensajeProveedorError(err, 'No se pudo marcar como principal')),
    });
  }

  desvincular(fila: FilaProducto) {
    this.alertDialog.confirm({
      zTitle: `¿Desvincular ${fila.nombre}?`,
      zDescription: 'Este proveedor dejará de ofrecer ese producto.',
      zOkText: 'Desvincular',
      zOkDestructive: true,
      zOnOk: () => {
        this.proveedorService.desvincularProveedor(fila.link.producto_id, fila.link.id).subscribe({
          next: () => {
            this.sonner.success('Vínculo desactivado');
            this.cargarProductos();
          },
          error: err => this.sonner.error(mensajeProveedorError(err, 'No se pudo desvincular')),
        });
      },
    });
  }
}
