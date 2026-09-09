import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBan,
  lucideCircleCheck,
  lucidePencil,
  lucidePrinter,
  lucideReceiptText,
  lucideRotateCcw,
  lucideTruck,
  lucideWallet,
} from '@ng-icons/lucide';

import { PedidoService } from '../data-access/pedido.service';
import {
  ESTADOS_ENTREGA,
  ESTADOS_PEDIDO,
  EstadoEntrega,
  EstadoPedido,
  MetodoPago,
  PedidoResponse,
  TIPOS_PEDIDO,
} from '../data-access/pedidos.models';
import { CajaService } from '../../ventas/data-access/caja.service';
import { VentaService } from '../../ventas/data-access/venta.service';
import { ProductoService } from '../../inventario/data-access/producto.service';
import { UsuarioAdminService } from '../../usuarios/data-access/usuario-admin.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSeparatorComponent } from '../../../shared/components/separator/separator.component';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { FacturarSheetComponent } from '../ui/facturar-sheet/facturar-sheet.component';
import { AnticipoSheetComponent } from '../ui/anticipo-sheet/anticipo-sheet.component';
import { CancelarPedidoSheetComponent } from '../ui/cancelar-pedido-sheet/cancelar-pedido-sheet.component';
import { EntregaSheetComponent } from '../ui/entrega-sheet/entrega-sheet.component';

@Component({
  selector: 'app-pedido-detail',
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
    ZardSeparatorComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideBan,
      lucideCircleCheck,
      lucidePencil,
      lucidePrinter,
      lucideReceiptText,
      lucideRotateCcw,
      lucideTruck,
      lucideWallet,
    }),
  ],
  templateUrl: './pedido-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pedidoService = inject(PedidoService);
  private cajaService = inject(CajaService);
  private ventaService = inject(VentaService);
  private productoService = inject(ProductoService);
  private usuarioService = inject(UsuarioAdminService);
  private sonner = inject(ZardSonnerService);
  private sheetService = inject(ZardSheetService);
  private authService = inject(AuthService);

  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.pedidos.editar));
  readonly canConfirmar = computed(() => this.authService.hasPermission(...PERMISOS.pedidos.confirmar));
  readonly canCancelar = computed(() => this.authService.hasPermission(...PERMISOS.pedidos.cancelar));
  readonly canFacturar = computed(() => this.authService.hasPermission(...PERMISOS.pedidos.facturar));
  readonly canRepartir = computed(() => this.authService.hasPermission(...PERMISOS.pedidos.repartir));

  readonly pedido = signal<PedidoResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly working = signal(false);
  readonly nombres = signal<Record<string, string>>({});
  readonly repartidores = signal<Record<string, string>>({});

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly esEntrega = computed(() => {
    const p = this.pedido();
    return !!p && p.tipo !== 'mostrador';
  });
  readonly totalAnticipos = computed(() => Number(this.pedido()?.total_anticipos ?? 0));
  readonly ahorroPromo = computed(() =>
    (this.pedido()?.lineas ?? []).reduce((s, l) => s + (Number(l.promo_descuento) || 0), 0),
  );

  readonly metodoLabel: Record<MetodoPago, string> = {
    efectivo: 'Efectivo',
    tarjeta_debito: 'Tarjeta débito',
    tarjeta_credito: 'Tarjeta crédito',
    transferencia: 'Transferencia',
    credito: 'Crédito',
    monedero: 'Monedero',
  };

  constructor() {
    this.cargar();
    this.productoService.listar({ page_size: 100 }).subscribe({
      next: res => this.nombres.set(Object.fromEntries(res.data.map(p => [p.id, p.nombre]))),
      error: () => {},
    });
    this.usuarioService.listar({ sort: 'nombre:asc' }).subscribe({
      next: res => this.repartidores.set(Object.fromEntries(res.data.map(u => [u.id, u.nombre]))),
      error: () => {},
    });
  }

  private cargar() {
    this.loading.set(true);
    this.error.set(false);
    this.pedidoService.obtener(this.id).subscribe({
      next: p => {
        this.pedido.set(p);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar el pedido', err);
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  nombreProducto(productoId: string): string {
    return this.nombres()[productoId] ?? productoId.slice(0, 8);
  }
  nombreRepartidor(id: string | null): string {
    return id ? (this.repartidores()[id] ?? id.slice(0, 8)) : 'Sin asignar';
  }

  estadoBadge(e: EstadoPedido): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'facturado') return 'default';
    if (e === 'cancelado') return 'destructive';
    if (e === 'confirmado') return 'secondary';
    return 'outline';
  }
  entregaBadge(e: EstadoEntrega): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (e === 'entregado') return 'default';
    if (e === 'fallido') return 'destructive';
    if (e === 'en_reparto') return 'secondary';
    return 'outline';
  }
  labelEstado(e: string) {
    return ESTADOS_PEDIDO.find(x => x.value === e)?.label ?? e;
  }
  labelEntrega(e: string) {
    return ESTADOS_ENTREGA.find(x => x.value === e)?.label ?? e;
  }
  labelTipo(t: string) {
    return TIPOS_PEDIDO.find(x => x.value === t)?.label ?? t;
  }

  private errMsg(err: unknown, fallback: string): string {
    const e = err as { error?: { error?: { message?: string; code?: string } } };
    return e?.error?.error?.message ?? fallback;
  }

  editar() {
    this.router.navigate(['/pedidos', this.id, 'editar']);
  }

  confirmar() {
    if (this.working()) return;
    this.working.set(true);
    this.pedidoService.confirmar(this.id).subscribe({
      next: p => {
        this.pedido.set(p);
        this.working.set(false);
        this.sonner.success(`Pedido confirmado · total congelado ${Number(p.total).toFixed(2)}`);
      },
      error: err => {
        this.working.set(false);
        this.sonner.error(this.errMsg(err, 'No se pudo confirmar el pedido'));
      },
    });
  }

  reabrir() {
    if (this.working()) return;
    this.working.set(true);
    this.pedidoService.reabrir(this.id).subscribe({
      next: p => {
        this.pedido.set(p);
        this.working.set(false);
        this.sonner.success('Pedido reabierto para edición');
      },
      error: err => {
        this.working.set(false);
        this.sonner.error(this.errMsg(err, 'No se pudo reabrir el pedido'));
      },
    });
  }

  cancelar() {
    const p = this.pedido();
    if (!p) return;
    this.sheetService.create({
      zTitle: 'Cancelar pedido',
      zDescription: `Folio ${p.id.slice(0, 8)}`,
      zContent: CancelarPedidoSheetComponent,
      zData: { pedidoId: p.id, folio: p.id.slice(0, 8), totalAnticipos: this.totalAnticipos() },
      zOkText: 'Cancelar pedido',
      zCancelText: 'Volver',
      zOnOk: (i: any) => this.persistir(i, 'Pedido cancelado', 'No se pudo cancelar el pedido'),
    });
  }

  anticipo() {
    const p = this.pedido();
    if (!p) return;
    this.sheetService.create({
      zTitle: 'Registrar anticipo',
      zDescription: `Folio ${p.id.slice(0, 8)}`,
      zContent: AnticipoSheetComponent,
      zData: { pedidoId: p.id, saldoPorCobrar: Number(p.saldo_por_cobrar) || 0 },
      zOkText: 'Registrar',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Anticipo registrado', 'No se pudo registrar el anticipo'),
    });
  }

  gestionarEntrega() {
    const p = this.pedido();
    if (!p) return;
    this.sheetService.create({
      zTitle: 'Gestionar entrega',
      zDescription: `Folio ${p.id.slice(0, 8)}`,
      zContent: EntregaSheetComponent,
      zData: { pedidoId: p.id, tipo: p.tipo, estadoEntrega: p.estado_entrega, repartidorId: p.repartidor_id },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Entrega actualizada', 'No se pudo actualizar la entrega'),
    });
  }

  facturar() {
    const p = this.pedido();
    if (!p) return;
    this.cajaService.actual().subscribe({
      next: turno => {
        if (!turno) {
          this.sonner.error('Necesitas un turno de caja abierto. Abre caja en el Punto de venta.');
          return;
        }
        this.sheetService.create({
          zTitle: 'Facturar pedido',
          zDescription: `Folio ${p.id.slice(0, 8)} · emite la venta`,
          zContent: FacturarSheetComponent,
          zSize: 'lg',
          zData: { pedido: p, turnoId: turno.id },
          zOkText: 'Facturar',
          zCancelText: 'Cancelar',
          zOnOk: (i: any) => {
            const obs = i.save();
            if (!obs) return false;
            return new Promise<void>((resolve, reject) => {
              obs.subscribe({
                next: (venta: { id: string }) => {
                  this.sonner.success('Pedido facturado');
                  this.cargar();
                  resolve();
                  this.router.navigate(['/ventas/historial', venta.id]);
                },
                error: (err: unknown) => {
                  this.sonner.error(this.errMsg(err, 'No se pudo facturar el pedido'));
                  reject(err);
                },
              });
            });
          },
        });
      },
      error: () => this.sonner.error('No se pudo verificar el turno de caja'),
    });
  }

  private persistir(instance: any, okMsg: string, errMsg: string): Promise<void> | false {
    const obs = instance.save();
    if (!obs) return false;
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({
        next: (p: PedidoResponse) => {
          this.pedido.set(p);
          this.sonner.success(okMsg);
          resolve();
        },
        error: (err: unknown) => {
          this.sonner.error(this.errMsg(err, errMsg));
          reject(err);
        },
      });
    });
  }

  imprimirTicket() {
    const ventaId = this.pedido()?.venta_id;
    if (!ventaId) return;
    this.ventaService.ticketPdf(ventaId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => this.sonner.error('No se pudo generar el ticket'),
    });
  }
}
