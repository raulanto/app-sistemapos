import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideBoxes,
  lucideClipboardList,
  lucideLandmark,
  lucideMinus,
  lucideTag,
  lucideTrendingDown,
  lucideTrendingUp,
  lucideUserCog,
  lucideUsers,
  lucideWallet,
} from '@ng-icons/lucide';

import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { VentaService } from '@/features/ventas/data-access/venta.service';
import { CajaService } from '@/features/ventas/data-access/caja.service';
import { CajaTurnoResponse, EstadoVenta, VentaListItem } from '@/features/ventas/data-access/ventas.models';
import { ProductoService } from '@/features/inventario/data-access/producto.service';
import { ProductoKpiResponse } from '@/features/inventario/data-access/inventario.models';
import { ClienteService } from '@/features/clientes/data-access/cliente.service';
import { ClienteResponse } from '@/features/clientes/data-access/clientes.models';
import { PedidoService } from '@/features/pedidos/data-access/pedido.service';
import { EstadoEntrega, EstadoPedido, PedidoListItem, PedidoResumen } from '@/features/pedidos/data-access/pedidos.models';
import { PromocionService } from '@/features/promociones/data-access/promocion.service';
import { PromocionResponse } from '@/features/promociones/data-access/promociones.models';
import { SucursalAdminService } from '@/features/sucursales/data-access/sucursal-admin.service';
import { UsuarioAdminService } from '@/features/usuarios/data-access/usuario-admin.service';
import { RolAdminService } from '@/features/usuarios/data-access/rol-admin.service';
import { UsuarioResponse } from '@/features/usuarios/data-access/usuarios.models';

import { ZardCardImports } from '@/shared/components/card/card.imports';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardChartImports } from '@/shared/components/chart/chart.imports';
import { ZardSelectImports } from '@/shared/components/select/select.imports';

import { ReporteService } from '@/features/reportes/data-access/reporte.service';
import { DashboardReporte } from '@/features/reportes/data-access/reporte.models';
import { SucursalService } from '@/core/sucursal/sucursal.service';

interface StatCard {
  description: string;
  value: string;
  trend: 'up' | 'down' | 'alert' | 'neutral';
  badge: string;
  headline: string;
  caption: string;
}

type BadgeType = 'default' | 'secondary' | 'destructive' | 'outline';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    NgIcon,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ...ZardCardImports,
    ZardBadgeComponent,
    ZardSkeletonComponent,
    ZardEmptyComponent,
    ...ZardTableImports,
    ...ZardChartImports,
    ...ZardSelectImports,
    FormsModule,
  ],
  viewProviders: [
    provideIcons({
      lucideAlertTriangle,
      lucideBoxes,
      lucideClipboardList,
      lucideLandmark,
      lucideMinus,
      lucideTag,
      lucideTrendingDown,
      lucideTrendingUp,
      lucideUserCog,
      lucideUsers,
      lucideWallet,
    }),
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly ventaService = inject(VentaService);
  private readonly cajaService = inject(CajaService);
  private readonly productoService = inject(ProductoService);
  private readonly clienteService = inject(ClienteService);
  private readonly pedidoService = inject(PedidoService);
  private readonly promocionService = inject(PromocionService);
  private readonly sucursalAdminService = inject(SucursalAdminService);
  private readonly usuarioAdminService = inject(UsuarioAdminService);
  private readonly rolAdminService = inject(RolAdminService);
  private readonly reporteService = inject(ReporteService);
  readonly sucursalService = inject(SucursalService);

  readonly esGlobal = computed(() => {
    const codigo = this.authService.currentUser()?.rol?.codigo;
    return codigo === 'admin' || codigo === 'gerente';
  });

  readonly sucursalId = signal('');
  readonly reporte = signal<DashboardReporte | null>(null);

  readonly nombreUsuario = computed(() => this.authService.currentUser()?.nombre ?? '');

  readonly canVentas = computed(() => this.authService.hasPermission(...PERMISOS.ventas.leer));
  readonly canCaja = computed(() => this.authService.hasPermission(...PERMISOS.caja.verHistorico));
  readonly canInventario = computed(() => this.authService.hasPermission(...PERMISOS.inventario.leer));
  readonly canClientes = computed(() => this.authService.hasPermission(...PERMISOS.clientes.leer));
  readonly canPedidos = computed(() => this.authService.hasPermission(...PERMISOS.pedidos.leer));
  readonly canPromociones = computed(() => this.authService.hasPermission(...PERMISOS.promociones.leer));
  readonly canUsuarios = computed(() => this.authService.hasPermission(...PERMISOS.usuarios.leer));

  readonly cargando = signal(true);

  private readonly ventasHoy = signal(0);
  private readonly ventasPorDia = signal<{ fecha: string; total: number }[]>([]);
  private readonly ultimasVentas = signal<VentaListItem[]>([]);
  private readonly turnoActual = signal<CajaTurnoResponse | null>(null);
  private readonly efectivoEsperado = signal(0);
  private readonly cajasActivas = signal(0);
  private readonly turnosAbiertos = signal(0);
  private readonly productoKpis = signal<ProductoKpiResponse | null>(null);
  private readonly clientesTotal = signal(0);
  private readonly clientesConSaldo = signal(0);
  private readonly clientesConSaldoLista = signal<ClienteResponse[]>([]);
  private readonly pedidoResumen = signal<PedidoResumen | null>(null);
  private readonly pedidosRecientes = signal<PedidoListItem[]>([]);
  private readonly promocionesActivas = signal(0);
  private readonly promocionesLista = signal<PromocionResponse[]>([]);
  private readonly sucursalesActivas = signal(0);
  private readonly usuariosTotal = signal(0);
  private readonly usuariosRecientes = signal<UsuarioResponse[]>([]);
  private readonly rolesTotal = signal(0);

  ngOnInit() {
    this.cargarDatos();
  }

  setSucursal(v: string) {
    this.sucursalId.set(v);
    this.cargarDatos();
  }

  private cargarDatos() {
    const hoy = new Date().toISOString().slice(0, 10);
    const totalItems = (r: { meta?: { pagination?: { total_items: number } } }) =>
      r.meta?.pagination?.total_items ?? 0;

    forkJoin({
      ventasHoy: this.canVentas()
        ? this.ventaService
            .listar({ desde: `${hoy}T00:00:00`, hasta: `${hoy}T23:59:59`, page_size: 1 })
            .pipe(map(totalItems), catchError(() => of(0)))
        : of(0),
      ventasPorDia: this.ventasPorDiaObservable(),
      ultimasVentas: this.canVentas()
        ? this.ventaService
            .listar({ sort: 'created_at:desc', page_size: 6 })
            .pipe(map(r => r.data ?? []), catchError(() => of([] as VentaListItem[])))
        : of([] as VentaListItem[]),
      turnoActual: this.canCaja() ? this.cajaService.actual().pipe(catchError(() => of(null))) : of(null),
      efectivoEsperado: this.canCaja()
        ? this.cajaService.efectivoActual().pipe(map(r => Number(r.efectivo_esperado) || 0), catchError(() => of(0)))
        : of(0),
      cajasActivas: this.canCaja()
        ? this.cajaService.listarCajas().pipe(map(cs => cs.filter(c => c.activo).length), catchError(() => of(0)))
        : of(0),
      turnosAbiertos: this.canCaja()
        ? this.cajaService
            .historico({ estado: 'abierto', page_size: 1 })
            .pipe(map(totalItems), catchError(() => of(0)))
        : of(0),
      productoKpis: this.canInventario()
        ? this.productoService.obtenerKpis().pipe(catchError(() => of(null)))
        : of(null),
      clientes: this.canClientes()
        ? this.clienteService
            .listar({ con_saldo_pendiente: true, page_size: 6 })
            .pipe(
              map(r => ({ total: totalItems(r), lista: r.data ?? [] })),
              catchError(() => of({ total: 0, lista: [] as ClienteResponse[] })),
            )
        : of({ total: 0, lista: [] as ClienteResponse[] }),
      clientesTotal: this.canClientes()
        ? this.clienteService.listar({ activo: true, page_size: 1 }).pipe(map(totalItems), catchError(() => of(0)))
        : of(0),
      pedidoResumen: this.canPedidos() ? this.pedidoService.resumen().pipe(catchError(() => of(null))) : of(null),
      pedidosRecientes: this.canPedidos()
        ? this.pedidoService
            .listar({ page_size: 6 })
            .pipe(map(r => r.data ?? []), catchError(() => of([] as PedidoListItem[])))
        : of([] as PedidoListItem[]),
      promociones: this.canPromociones()
        ? this.promocionService
            .listar({ activo: true, page_size: 6 })
            .pipe(
              map(r => ({ total: totalItems(r), lista: r.data ?? [] })),
              catchError(() => of({ total: 0, lista: [] as PromocionResponse[] })),
            )
        : of({ total: 0, lista: [] as PromocionResponse[] }),
      sucursalesActivas: this.sucursalAdminService
        .listar({ activo: true, page_size: 1 })
        .pipe(map(totalItems), catchError(() => of(0))),
      usuarios: this.canUsuarios()
        ? this.usuarioAdminService
            .listar({ page_size: 6, sort: 'last_login_at:desc', include: 'rol' })
            .pipe(
              map(r => ({ total: totalItems(r), lista: r.data ?? [] })),
              catchError(() => of({ total: 0, lista: [] as UsuarioResponse[] })),
            )
        : of({ total: 0, lista: [] as UsuarioResponse[] }),
      rolesTotal: this.canUsuarios()
        ? this.rolAdminService.listar({ page_size: 1 }).pipe(map(totalItems), catchError(() => of(0)))
        : of(0),
      reporte: this.reporteService
        .dashboard(this.esGlobal() ? this.sucursalId() || undefined : undefined)
        .pipe(catchError(() => of(null))),
    }).subscribe(r => {
      this.ventasHoy.set(r.ventasHoy);
      this.ventasPorDia.set(r.ventasPorDia);
      this.ultimasVentas.set(r.ultimasVentas);
      this.turnoActual.set(r.turnoActual);
      this.efectivoEsperado.set(r.efectivoEsperado);
      this.cajasActivas.set(r.cajasActivas);
      this.turnosAbiertos.set(r.turnosAbiertos);
      this.productoKpis.set(r.productoKpis);
      this.clientesTotal.set(r.clientesTotal);
      this.clientesConSaldo.set(r.clientes.total);
      this.clientesConSaldoLista.set(r.clientes.lista);
      this.pedidoResumen.set(r.pedidoResumen);
      this.pedidosRecientes.set(r.pedidosRecientes);
      this.promocionesActivas.set(r.promociones.total);
      this.promocionesLista.set(r.promociones.lista);
      this.sucursalesActivas.set(r.sucursalesActivas);
      this.usuariosTotal.set(r.usuarios.total);
      this.usuariosRecientes.set(r.usuarios.lista);
      this.rolesTotal.set(r.rolesTotal);
      this.reporte.set(r.reporte);
      this.cargando.set(false);
    });
  }

  /** Ventas de cada uno de los últimos 7 días (conteo exacto por paginación, sin sumar montos a ojo). */
  private ventasPorDiaObservable() {
    if (!this.canVentas()) return of([] as { fecha: string; total: number }[]);
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const llamadas = dias.map(d => {
      const iso = d.toISOString().slice(0, 10);
      const fecha = d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '');
      return this.ventaService.listar({ desde: `${iso}T00:00:00`, hasta: `${iso}T23:59:59`, page_size: 1 }).pipe(
        map(r => ({ fecha, total: r.meta?.pagination?.total_items ?? 0 })),
        catchError(() => of({ fecha, total: 0 })),
      );
    });
    return forkJoin(llamadas);
  }

  private fmtNum(n: number): string {
    return new Intl.NumberFormat('es-MX').format(n);
  }

  private fmtCurrency(n: number | string | null): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
  }

  private fmtHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  readonly ventasCajaCards = computed<StatCard[]>(() => {
    const cards: StatCard[] = [];
    const rep = this.reporte();

    if (this.canVentas()) {
      if (rep) {
        const hoy = Number(rep.ventas_hoy.total_vendido) || 0;
        const ayer = Number(rep.ventas_ayer.total_vendido) || 0;
        const variacion = ayer ? ((hoy - ayer) / ayer) * 100 : null;
        const tendencia = variacion == null ? 'Sin ventas ayer' : `${variacion >= 0 ? '+' : ''}${variacion.toFixed(1)}% vs. ayer`;

        cards.push({
          description: 'Ventas hoy',
          value: this.fmtCurrency(hoy),
          trend: variacion == null ? 'neutral' : variacion >= 0 ? 'up' : 'alert',
          badge: 'Hoy',
          headline: `${this.fmtNum(rep.ventas_hoy.numero_ventas)} transacciones`,
          caption: tendencia,
        });
      } else {
        cards.push({
          description: 'Ventas hoy',
          value: this.fmtNum(this.ventasHoy()),
          trend: this.ventasHoy() > 0 ? 'up' : 'neutral',
          badge: 'Hoy',
          headline: 'Transacciones registradas',
          caption: 'Ventas creadas hoy en el sistema',
        });
      }
    }
    if (this.canCaja()) {
      const t = this.turnoActual();
      cards.push({
        description: 'Turno de caja',
        value: t ? 'Abierto' : 'Cerrado',
        trend: t ? 'up' : 'neutral',
        badge: t ? (t.caja?.nombre ?? 'Sin caja asignada') : 'Sin turno',
        headline: t ? `Desde las ${this.fmtHora(t.abierto_en)}` : 'Ningún turno abierto',
        caption: t ? `Saldo inicial ${this.fmtCurrency(t.saldo_inicial)}` : 'Abre un turno para empezar a vender',
      });
      cards.push({
        description: 'Efectivo esperado',
        value: this.fmtCurrency(this.efectivoEsperado()),
        trend: 'neutral',
        badge: 'Arqueo en vivo',
        headline: 'Efectivo en cajón',
        caption: 'Según ventas y movimientos registrados',
      });
      
      if (rep) {
        cards.push({
          description: 'Cajas abiertas',
          value: this.fmtNum(rep.cajas_abiertas.length),
          trend: 'neutral',
          badge: `${rep.cajas_abiertas.length} operando`,
          headline: 'En toda la sucursal',
          caption: 'Según el último reporte',
        });
      } else {
        cards.push({
          description: 'Turnos abiertos',
          value: this.fmtNum(this.turnosAbiertos()),
          trend: 'neutral',
          badge: `${this.cajasActivas()} cajas activas`,
          headline: 'En toda la sucursal',
          caption: 'Cajeros operando en este momento',
        });
      }
    }
    return cards;
  });

  readonly inventarioCards = computed<StatCard[]>(() => {
    const kpi = this.productoKpis();
    if (!this.canInventario() || !kpi) return [];
    return [
      {
        description: 'Productos activos',
        value: this.fmtNum(kpi.activos),
        trend: 'neutral',
        badge: `${kpi.inactivos} inactivos`,
        headline: 'Catálogo',
        caption: `${kpi.categorias_distintas} categorías con productos`,
      },
      {
        description: 'Bajo stock',
        value: this.fmtNum(kpi.bajo_stock),
        trend: kpi.bajo_stock > 0 ? 'alert' : 'up',
        badge: `${kpi.productos_sin_existencia} sin stock`,
        headline: 'Para reabastecer',
        caption: `${kpi.productos_con_existencia} productos con existencia`,
      },
      {
        description: 'Valor del inventario',
        value: this.fmtCurrency(kpi.valor_inventario_venta),
        trend: 'up',
        badge: `Costo ${this.fmtCurrency(kpi.valor_inventario_costo)}`,
        headline: 'A precio de venta',
        caption: `Margen promedio ${this.fmtCurrency(kpi.margen_promedio)}`,
      },
      {
        description: 'Precio de venta promedio',
        value: this.fmtCurrency(kpi.precio_venta_promedio),
        trend: 'neutral',
        badge: `${kpi.con_codigo_barras} con código`,
        headline: 'Por producto',
        caption: `Rango ${this.fmtCurrency(kpi.precio_venta_min)} – ${this.fmtCurrency(kpi.precio_venta_max)}`,
      },
    ];
  });

  readonly clientesCards = computed<StatCard[]>(() => {
    if (!this.canClientes()) return [];
    const conSaldo = this.clientesConSaldo();
    return [
      {
        description: 'Clientes activos',
        value: this.fmtNum(this.clientesTotal()),
        trend: 'neutral',
        badge: 'Registrados',
        headline: 'Base de clientes',
        caption: 'Clientes activos en el sistema',
      },
      {
        description: 'Con saldo pendiente',
        value: this.fmtNum(conSaldo),
        trend: conSaldo > 0 ? 'alert' : 'up',
        badge: 'A crédito',
        headline: 'Cuentas por cobrar',
        caption: 'Clientes con saldo de crédito activo',
      },
    ];
  });

  readonly pedidosCards = computed<StatCard[]>(() => {
    const r = this.pedidoResumen();
    if (!this.canPedidos() || !r) return [];
    const porEstado = r.por_estado ?? {};
    const porEntrega = r.por_estado_entrega ?? {};
    const activos = (porEstado['borrador'] ?? 0) + (porEstado['confirmado'] ?? 0);
    const facturados = porEstado['facturado'] ?? 0;
    const cancelados = porEstado['cancelado'] ?? 0;
    const enCamino = (porEntrega['en_preparacion'] ?? 0) + (porEntrega['en_reparto'] ?? 0);
    return [
      {
        description: 'Pedidos activos',
        value: this.fmtNum(activos),
        trend: activos > 0 ? 'up' : 'neutral',
        badge: `${cancelados} cancelados`,
        headline: 'Borrador + confirmado',
        caption: 'Pendientes de facturar',
      },
      {
        description: 'Facturados',
        value: this.fmtNum(facturados),
        trend: 'neutral',
        badge: 'Convertidos a venta',
        headline: 'Ciclo completo',
        caption: 'Pedidos ya emitidos como venta',
      },
      {
        description: 'En camino',
        value: this.fmtNum(enCamino),
        trend: enCamino > 0 ? 'alert' : 'neutral',
        badge: 'Preparación + reparto',
        headline: 'Entregas en curso',
        caption: `${porEntrega['entregado'] ?? 0} ya entregados`,
      },
    ];
  });

  readonly promocionesCards = computed<StatCard[]>(() => {
    if (!this.canPromociones()) return [];
    const total = this.promocionesActivas();
    return [
      {
        description: 'Promociones activas',
        value: this.fmtNum(total),
        trend: total > 0 ? 'up' : 'neutral',
        badge: 'Vigentes',
        headline: 'Catálogo de promos',
        caption: 'Aplican automáticamente en las ventas',
      },
    ];
  });

  readonly sucursalesCards = computed<StatCard[]>(() => [
    {
      description: 'Sucursales activas',
      value: this.fmtNum(this.sucursalesActivas()),
      trend: 'neutral',
      badge: 'Puntos de venta',
      headline: 'Red de sucursales',
      caption: 'Sucursales habilitadas para operar',
    },
  ]);

  readonly usuariosCards = computed<StatCard[]>(() => {
    if (!this.canUsuarios()) return [];
    return [
      {
        description: 'Usuarios registrados',
        value: this.fmtNum(this.usuariosTotal()),
        trend: 'neutral',
        badge: `${this.rolesTotal()} roles`,
        headline: 'Cuentas del sistema',
        caption: 'Usuarios con acceso a la plataforma',
      },
    ];
  });

  trendIcon(trend: StatCard['trend']) {
    if (trend === 'up') return 'lucideTrendingUp';
    if (trend === 'down') return 'lucideTrendingDown';
    if (trend === 'alert') return 'lucideAlertTriangle';
    return 'lucideMinus';
  }

  // --- Gráficas (derivadas de datos ya cargados, sin llamadas extra) ---

  readonly pedidosPorEstadoChart = computed(() =>
    Object.entries(this.pedidoResumen()?.por_estado ?? {}).map(([estado, total]) => ({ estado, total })),
  );
  readonly pedidosEstadoSeries = [{ dataKey: 'total' }];
  readonly pedidosEstadoConfig = { total: { label: 'Pedidos', color: '#6366f1' } };

  readonly productosPorTipoChart = computed(() =>
    Object.entries(this.productoKpis()?.por_tipo ?? {}).map(([tipo, total]) => ({ tipo, total })),
  );
  readonly productosTipoSeries = [{ dataKey: 'total' }];

  readonly ventasPorDiaData = computed(() => this.ventasPorDia());
  readonly ventasPorDiaSeries = [{ dataKey: 'total' }];
  readonly ventasPorDiaConfig = { total: { label: 'Ventas', color: '#10b981' } };

  // --- Tablas ---

  readonly ultimasVentasLista = computed(() => this.ultimasVentas());
  readonly pedidosRecientesLista = computed(() => this.pedidosRecientes());
  readonly clientesConSaldoTabla = computed(() => this.clientesConSaldoLista());
  readonly promocionesTabla = computed(() => this.promocionesLista());
  readonly usuariosRecientesTabla = computed(() => this.usuariosRecientes());

  ventaBadge(estado: EstadoVenta): BadgeType {
    if (estado === 'pagada') return 'default';
    if (estado === 'cancelada') return 'destructive';
    return 'secondary';
  }

  pedidoBadge(estado: EstadoPedido): BadgeType {
    if (estado === 'facturado') return 'default';
    if (estado === 'cancelado') return 'destructive';
    if (estado === 'confirmado') return 'secondary';
    return 'outline';
  }

  entregaBadge(estado: EstadoEntrega | null): BadgeType {
    if (estado === 'entregado') return 'default';
    if (estado === 'fallido') return 'destructive';
    if (estado === 'en_reparto') return 'secondary';
    return 'outline';
  }

  disponibleCredito(c: ClienteResponse): number {
    return Number(c.limite_credito) - Number(c.saldo_credito);
  }
}
