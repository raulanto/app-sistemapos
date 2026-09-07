import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideBan, lucideReceiptText, lucideUser, lucideStore, lucideUndo2 } from '@ng-icons/lucide';

import { VentaService } from '../data-access/venta.service';
import { CajaService } from '../data-access/caja.service';
import {
  VentaResponse,
  EstadoVenta,
  MetodoPago,
  MetodoDevolucion,
  DevolucionResponse,
} from '../data-access/ventas.models';
import { ProductoService } from '../../inventario/data-access/producto.service';
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
import { DevolucionSheetComponent } from '../ui/devolucion-sheet/devolucion-sheet.component';

@Component({
  selector: 'app-venta-detail',
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
  viewProviders: [provideIcons({ lucideArrowLeft, lucideBan, lucideReceiptText, lucideUser, lucideStore, lucideUndo2 })],
  templateUrl: './venta-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentaDetailComponent {
  private route = inject(ActivatedRoute);
  private ventaService = inject(VentaService);
  private cajaService = inject(CajaService);
  private productoService = inject(ProductoService);
  private sonner = inject(ZardSonnerService);
  private sheetService = inject(ZardSheetService);
  private authService = inject(AuthService);

  readonly canAnular = computed(() => this.authService.hasPermission(...PERMISOS.ventas.anular));
  readonly canDevolver = computed(() => this.authService.hasPermission(...PERMISOS.ventas.devolver));

  readonly venta = signal<VentaResponse | null>(null);
  readonly devoluciones = signal<DevolucionResponse[]>([]);
  readonly turnoAbiertoId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  /** producto_id → nombre, para las líneas. */
  readonly nombres = signal<Record<string, string>>({});

  private readonly id = this.route.snapshot.paramMap.get('id')!;

  readonly ahorroPromo = computed(() =>
    (this.venta()?.lineas ?? []).reduce((s, l) => s + (Number(l.promo_descuento) || 0), 0),
  );

  readonly tieneDevoluciones = computed(() => Number(this.venta()?.total_devuelto ?? 0) > 0);
  readonly quedaPorDevolver = computed(() =>
    (this.venta()?.lineas ?? []).some(l => Number(l.cantidad) - Number(l.cantidad_devuelta ?? 0) > 0.0001),
  );
  readonly puedeDevolver = computed(() => {
    const v = this.venta();
    if (!v || !this.canDevolver()) return false;
    return ['pagada', 'pendiente_pago', 'devuelta_parcial'].includes(v.estado) && this.quedaPorDevolver();
  });

  readonly metodoLabel: Record<MetodoPago, string> = {
    efectivo: 'Efectivo',
    tarjeta_debito: 'Tarjeta débito',
    tarjeta_credito: 'Tarjeta crédito',
    transferencia: 'Transferencia',
    credito: 'Crédito',
  };
  readonly metodoDevLabel: Record<MetodoDevolucion, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    credito: 'Crédito',
  };

  constructor() {
    this.cargar();
    this.productoService.listar({ page_size: 100 }).subscribe({
      next: res => this.nombres.set(Object.fromEntries(res.data.map(p => [p.id, p.nombre]))),
      error: () => {},
    });
    this.cajaService.actual().subscribe({
      next: t => this.turnoAbiertoId.set(t?.id ?? null),
      error: () => this.turnoAbiertoId.set(null),
    });
  }

  private cargar() {
    this.loading.set(true);
    this.error.set(false);
    this.ventaService.obtener(this.id).subscribe({
      next: v => {
        this.venta.set(v);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar la venta', err);
        this.error.set(true);
        this.loading.set(false);
      },
    });
    this.ventaService.devoluciones(this.id).subscribe({
      next: d => this.devoluciones.set(d),
      error: () => this.devoluciones.set([]),
    });
  }

  nombreProducto(productoId: string): string {
    return this.nombres()[productoId] ?? productoId.slice(0, 8);
  }

  badge(estado: EstadoVenta): 'default' | 'secondary' | 'destructive' {
    if (estado === 'pagada') return 'default';
    if (estado === 'cancelada') return 'destructive';
    return 'secondary';
  }

  anular() {
    const v = this.venta();
    if (!v) return;
    if (this.tieneDevoluciones()) {
      this.sonner.error('Esta venta tiene devoluciones registradas: devuelve el resto en lugar de anular.');
      return;
    }
    const motivo = window.prompt(
      'Anular esta venta repone el stock y revierte el crédito (queda como "cancelada").\nMotivo (opcional):',
    );
    if (motivo === null) return;
    this.ventaService.anular(v.id, { motivo: motivo || null }).subscribe({
      next: actualizada => {
        this.venta.set(actualizada);
        this.sonner.success('Venta anulada');
      },
      error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo anular la venta'),
    });
  }

  abrirDevolucion() {
    const v = this.venta();
    const turnoId = this.turnoAbiertoId();
    if (!v) return;
    if (!turnoId) {
      this.sonner.error('Necesitas un turno de caja abierto para registrar la devolución.');
      return;
    }
    this.sheetService.create({
      zTitle: 'Devolución',
      zDescription: 'Reingresa parte o todo lo comprado.',
      zContent: DevolucionSheetComponent,
      zData: { venta: v, turnoId, nombres: this.nombres() },
      zOkText: 'Registrar devolución',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Devolución registrada');
              this.cargar();
              resolve();
            },
            error: (err: any) => {
              this.sonner.error(err?.error?.error?.message ?? err?.error?.detail ?? 'No se pudo registrar la devolución');
              reject(err);
            },
          });
        });
      },
    });
  }
}
