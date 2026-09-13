import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBan, lucidePackageCheck, lucideSend } from '@ng-icons/lucide';

import { ProveedorService } from '../data-access/proveedor.service';
import {
  ESTADOS_PEDIDO_PROVEEDOR,
  EstadoPedidoProveedor,
  mensajeProveedorError,
  PedidoProveedorResponse,
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
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { RecepcionProveedorFormSheetComponent } from '../ui/recepcion-proveedor-form-sheet/recepcion-proveedor-form-sheet.component';

@Component({
  selector: 'app-pedido-proveedor-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
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
  viewProviders: [provideIcons({ lucideArrowLeft, lucideBan, lucidePackageCheck, lucideSend })],
  templateUrl: './pedido-proveedor-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoProveedorDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private authService = inject(AuthService);
  private sonner = inject(ZardSonnerService);
  private alertDialog = inject(ZardAlertDialogService);
  private sheetService = inject(ZardSheetService);

  readonly canConfirmarEnvio = computed(() => this.authService.hasPermission(...PERMISOS.pedidoProveedor.confirmarEnvio));
  readonly canGestionar = computed(() => this.authService.hasPermission(...PERMISOS.pedidoProveedor.gestionar));
  readonly canRegistrarRecepcion = computed(() => this.authService.hasPermission(...PERMISOS.recepcionProveedor.registrar));

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly pedido = signal<PedidoProveedorResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly working = signal(false);
  readonly nombres = signal<Record<string, string>>({});

  readonly puedeRecibir = computed(() => {
    const p = this.pedido();
    return !!p && (p.estado === 'enviado' || p.estado === 'confirmado' || p.estado === 'parcial');
  });
  readonly puedeCancelar = computed(() => {
    const p = this.pedido();
    return !!p && p.estado !== 'recibido' && p.estado !== 'cancelado';
  });

  constructor() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.error.set(false);
    this.proveedorService.obtenerPedido(this.id).subscribe({
      next: p => {
        this.pedido.set(p);
        this.loading.set(false);
        this.resolverProductos(p);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private resolverProductos(p: PedidoProveedorResponse) {
    const ids = [...new Set(p.lineas.map(l => l.producto_id))].filter(id => !this.nombres()[id]);
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

  labelEstado(e: EstadoPedidoProveedor) {
    return ESTADOS_PEDIDO_PROVEEDOR.find(x => x.value === e)?.label ?? e;
  }
  estadoBadge(e: EstadoPedidoProveedor): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'recibido') return 'default';
    if (e === 'cancelado') return 'destructive';
    if (e === 'parcial' || e === 'enviado') return 'secondary';
    return 'outline';
  }

  confirmarEnvio() {
    if (this.working()) return;
    this.working.set(true);
    this.proveedorService.confirmarEnvioPedido(this.id).subscribe({
      next: p => {
        this.pedido.set(p);
        this.working.set(false);
        this.sonner.success('Envío confirmado');
      },
      error: err => {
        this.working.set(false);
        this.sonner.error(mensajeProveedorError(err, 'No se pudo confirmar el envío'));
      },
    });
  }

  cancelar() {
    const p = this.pedido();
    if (!p) return;
    this.alertDialog.confirm({
      zTitle: `¿Cancelar el pedido ${p.folio}?`,
      zDescription: 'Esta acción no se puede deshacer.',
      zOkText: 'Cancelar pedido',
      zOkDestructive: true,
      zOnOk: () => {
        this.working.set(true);
        this.proveedorService.cancelarPedido(this.id).subscribe({
          next: actualizado => {
            this.pedido.set(actualizado);
            this.working.set(false);
            this.sonner.success('Pedido cancelado');
          },
          error: err => {
            this.working.set(false);
            this.sonner.error(mensajeProveedorError(err, 'No se pudo cancelar el pedido'));
          },
        });
      },
    });
  }

  recibirMercancia() {
    const p = this.pedido();
    if (!p) return;
    const pendientes = p.lineas.filter(l => Number(l.pendiente) > 0).map(l => ({ producto_id: l.producto_id, pendiente: Number(l.pendiente) }));
    this.sheetService.create({
      zTitle: `Recibir mercancía · ${p.folio}`,
      zDescription: 'Registra lo que llegó de este pedido (bueno y defectuoso).',
      zContent: RecepcionProveedorFormSheetComponent,
      zSize: 'lg',
      zData: { proveedorId: p.proveedor_id, pedidoId: p.id, pedidoLineas: pendientes },
      zOkText: 'Registrar recepción',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (recepcion: { id: string }) => {
              this.sonner.success('Recepción registrada');
              this.cargar();
              resolve();
              this.router.navigate(['/proveedores/recepciones', recepcion.id]);
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
}
