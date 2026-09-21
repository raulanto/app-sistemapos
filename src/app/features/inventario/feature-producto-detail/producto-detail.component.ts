import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePackage,
  lucideActivity,
  lucideCalendar,
  lucideMapPin,
  lucideEdit,
  lucidePlus,
  lucideSettings2,
  lucideArrowRightLeft,
  lucideTrash,
  lucideTag,
  lucideBarcode,
  lucidePercent,
  lucideLayers,
  lucideStore,
  lucideTrendingUp,
  lucideBoxes,
  lucideHistory,
  lucidePackageOpen,
  lucideWallet,
  lucideBan,
  lucideCircleCheck,
  lucideUser,
  lucideScale,
  lucideStar,
  lucideTruck,
} from '@ng-icons/lucide';

import { ProductoService } from '../data-access/producto.service';
import { MovimientoService } from '../data-access/movimiento.service';
import { UnidadMedidaService } from '../data-access/unidad-medida.service';
import { SucursalService } from '../../../core/sucursal/sucursal.service';
import { ProductoResponse, MovimientoResponse, ExistenciaResponse, UnidadResponse, UnidadMedidaResponse, DesgloseExistenciasResponse } from '../data-access/inventario.models';

import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardTabsImports } from '../../../shared/components/tabs/tabs.imports';
import { ZardAlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthService } from '../../../core/auth/api/auth.service';
import { PERMISOS } from '../../../core/auth/permissions';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { InventarioActionService } from '../data-access/inventario-action.service';
import { ProductoFormSheetComponent } from '../ui/producto-form-sheet/producto-form-sheet.component';
import { MovimientoFormSheetComponent } from '../ui/movimiento-form-sheet/movimiento-form-sheet.component';
import { UmbralesFormSheetComponent } from '../ui/umbrales-form-sheet/umbrales-form-sheet.component';
import { ComponenteFormSheetComponent } from '../ui/componente-form-sheet/componente-form-sheet.component';
import { UnidadFormSheetComponent } from '../ui/unidad-form-sheet/unidad-form-sheet.component';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardChartImports } from '../../../shared/components/chart/chart.imports';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ImagenGaleriaComponent } from '../ui/imagen-galeria/imagen-galeria.component';
import { ComponenteResponse } from '../data-access/inventario.models';
import { ProveedorService } from '../../proveedores/data-access/proveedor.service';
import { mensajeProveedorError, ProductoProveedorResponse, ProveedorResponse } from '../../proveedores/data-access/proveedores.models';
import { ProductoProveedorFormSheetComponent } from '../../proveedores/ui/producto-proveedor-form-sheet/producto-proveedor-form-sheet.component';

import { ProductoAccionesService } from '../data-access/producto-acciones.service';

import { ProductoDetailHeaderComponent } from '../ui/producto-detail-header/producto-detail-header.component';
import { ProductoDetailKpisComponent } from '../ui/producto-detail-kpis/producto-detail-kpis.component';
import { ProductoTabExistenciasComponent } from '../ui/producto-tab-existencias/producto-tab-existencias.component';
import { ProductoTabRecetaComponent } from '../ui/producto-tab-receta/producto-tab-receta.component';
import { ProductoTabPresentacionesComponent } from '../ui/producto-tab-presentaciones/producto-tab-presentaciones.component';
import { ProductoTabMovimientosComponent } from '../ui/producto-tab-movimientos/producto-tab-movimientos.component';
import { ProductoTabFichaTecnicaComponent } from '../ui/producto-tab-ficha-tecnica/producto-tab-ficha-tecnica.component';
import { ProductoTabAnalisisComponent } from '../ui/producto-tab-analisis/producto-tab-analisis.component';
import { ProductoTabProveedoresComponent } from '../ui/producto-tab-proveedores/producto-tab-proveedores.component';

@Component({
  selector: 'app-producto-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgIconComponent,
    ...ZardCardImports,
    ZardBadgeComponent,
    ...ZardTableImports,
    ...ZardTabsImports,
    ZardAlertComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ImagenGaleriaComponent,
    ...ZardChartImports,
    ProductoDetailHeaderComponent,
    ProductoDetailKpisComponent,
    ProductoTabExistenciasComponent,
    ProductoTabRecetaComponent,
    ProductoTabPresentacionesComponent,
    ProductoTabMovimientosComponent,
    ProductoTabFichaTecnicaComponent,
    ProductoTabAnalisisComponent,
    ProductoTabProveedoresComponent,
  ],
  templateUrl: './producto-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucidePackage,
      lucideActivity,
      lucideCalendar,
      lucideMapPin,
      lucideEdit,
      lucidePlus,
      lucideSettings2,
      lucideArrowRightLeft,
      lucideTrash,
      lucideTag,
      lucideBarcode,
      lucidePercent,
      lucideLayers,
      lucideStore,
      lucideTrendingUp,
      lucideBoxes,
      lucideHistory,
      lucidePackageOpen,
      lucideWallet,
      lucideBan,
      lucideCircleCheck,
      lucideUser,
      lucideScale,
      lucideStar,
      lucideTruck,
    }),
  ]
})
export class ProductoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productoService = inject(ProductoService);
  private readonly movimientoService = inject(MovimientoService);
  private readonly unidadMedidaService = inject(UnidadMedidaService);
  public readonly sucursalService = inject(SucursalService);
  private readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);
  private readonly inventarioAction = inject(InventarioActionService);
  private readonly productoAcciones = inject(ProductoAccionesService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly proveedorService = inject(ProveedorService);

  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.inventario.editar));
  readonly canCrearMovimiento = computed(() => this.authService.hasPermission(...PERMISOS.inventario.crear));
  readonly canGestionarProveedores = computed(() => this.authService.hasPermission(...PERMISOS.proveedores.productoProveedor));

  producto = signal<ProductoResponse | null>(null);
  movimientos = signal<MovimientoResponse[]>([]);
  unidades = signal<UnidadResponse[]>([]);
  unidadesMedidaCatalogo = signal<UnidadMedidaResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  /** Se activa si la portada no carga (link roto, CORS, etc.); cae al icono por defecto. */
  imagenError = signal(false);

  /** Portada: `imagen_principal` (viene siempre), o la primera de la galería embebida.
   * Se prefiere la imagen original (`url`) sobre `thumbnail_url`: la miniatura la genera
   * una Lambda que puede no existir en entornos locales y devolver 404. */
  imagenPrincipal = computed(() => {
    const prod = this.producto();
    if (!prod) return null;
    const principal =
      prod.imagen_principal ?? (prod.imagenes ?? []).find(i => i.es_principal) ?? (prod.imagenes ?? [])[0];
    return principal?.url ?? principal?.thumbnail_url ?? null;
  });

  totalStock = computed(() => {
    const prod = this.producto();
    if (!prod || !prod.existencias) return 0;
    return prod.existencias.reduce((sum, ext) => sum + Number(ext.cantidad), 0);
  });

  valorCostoTotal = computed(() => {
    const prod = this.producto();
    if (!prod) return 0;
    return this.totalStock() * Number(prod.costo || 0);
  });

  valorVentaTotal = computed(() => {
    const prod = this.producto();
    if (!prod) return 0;
    return this.totalStock() * Number(prod.precio_venta || 0);
  });

  /** Margen unitario: diferencia y porcentaje entre precio de venta y costo. */
  margen = computed(() => {
    const prod = this.producto();
    if (!prod) return { monto: 0, pct: 0 };
    const precio = Number(prod.precio_venta || 0);
    const costo = Number(prod.costo || 0);
    const monto = precio - costo;
    return { monto, pct: precio > 0 ? (monto / precio) * 100 : 0 };
  });

  /** Unidad del catálogo vinculada al producto (`unidad_medida_id`), si aplica. */
  unidadMedidaVinculada = computed(() => {
    const id = this.producto()?.unidad_medida_id;
    if (!id) return null;
    return this.unidadesMedidaCatalogo().find(u => u.id === id) ?? null;
  });

  /** Gráfica visible en la pestaña Análisis. */
  readonly grafica = signal<'balance' | 'costo' | 'stock' | 'tipos'>('balance');

  chartData = computed(() => {
    const movs = this.movimientos();
    // Group by date (DD/MM/YYYY)
    const grouped = new Map<string, { entradas: number, salidas: number }>();
    
    // Sort ascending for chart (they are fetched desc)
    const sortedMovs = [...movs].reverse();
    
    for (const mov of sortedMovs) {
      const date = new Date(mov.created_at).toLocaleDateString();
      if (!grouped.has(date)) {
        grouped.set(date, { entradas: 0, salidas: 0 });
      }
      const data = grouped.get(date)!;
      
      const tipo = String(mov.tipo).toLowerCase();
      
      if (tipo === 'entrada' || tipo === 'ajuste_positivo') {
        data.entradas += Number(mov.cantidad);
      } else if (tipo === 'salida' || tipo === 'merma' || tipo === 'ajuste_negativo') {
        data.salidas += Number(mov.cantidad);
      }
    }
    
    return Array.from(grouped.entries()).map(([date, data]) => ({
      fecha: date,
      entradas: data.entradas,
      salidas: data.salidas
    }));
  });

  chartConfig = {
    entradas: { label: 'Entradas', color: '#10b981' }, // emerald-500
    salidas: { label: 'Salidas', color: '#ef4444' } // red-500
  };

  chartSeries = [
    { dataKey: 'entradas' },
    { dataKey: 'salidas' }
  ];

  chartOptions = {
    series: [
      { barMaxWidth: 50, itemStyle: { borderRadius: [4, 4, 0, 0] } },
      { barMaxWidth: 50, itemStyle: { borderRadius: [4, 4, 0, 0] } }
    ]
  };

  /** Evolución del costo unitario: los movimientos con `costo_unitario` (entradas/ajustes con costo). */
  costoTrend = computed(() =>
    [...this.movimientos()]
      .reverse()
      .filter(m => m.costo_unitario != null)
      .map(m => ({
        fecha: new Date(m.created_at).toLocaleDateString(),
        costo: Number(m.costo_unitario),
      })),
  );
  costoConfig = { costo: { label: 'Costo unitario', color: '#6366f1' } };
  costoSeries = [{ dataKey: 'costo', showSymbol: true }];

  /** Stock actual por sucursal. */
  stockPorSucursal = computed(() =>
    (this.producto()?.existencias ?? []).map(e => ({
      sucursal: this.getNombreSucursal(e.sucursal_id),
      stock: Number(e.cantidad),
    })),
  );
  stockConfig = { stock: { label: 'Stock', color: '#0ea5e9' } };
  stockSeries = [{ dataKey: 'stock' }];

  /** Reparto de movimientos por tipo. */
  movimientosPorTipo = computed(() => {
    const conteo = new Map<string, number>();
    for (const mov of this.movimientos()) {
      const t = String(mov.tipo);
      conteo.set(t, (conteo.get(t) ?? 0) + 1);
    }
    return [...conteo].map(([tipo, total]) => ({ tipo, total }));
  });
  tipoSeries = [{ dataKey: 'total' }];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/inventario/productos']);
      return;
    }
    this.cargarDatos(id);
    this.unidadMedidaService.listar().subscribe({
      next: (data) => this.unidadesMedidaCatalogo.set(data),
      error: (err) => console.error('Error al cargar unidades de medida', err)
    });
  }

  private static readonly INCLUDES = 'categoria,existencias,componentes,imagenes';

  /** Carga inicial: muestra skeleton mientras llega todo. */
  cargarDatos(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.imagenError.set(false);
    this.cdr.markForCheck(); // force check

    this.productoService.obtenerPorId(id, ProductoDetailComponent.INCLUDES).subscribe({
      next: (prod) => {
        this.producto.set(prod);
        this.cargarMovimientos(id);
        this.cargarProveedoresProducto(id);
        if (prod.tipo !== 'kit') {
          this.cargarUnidades(id);
          this.cargarDesglose(id);
        }
      },
      error: (err) => {
        console.error('Error al cargar producto:', err);
        this.error.set('No se pudo cargar la información del producto.');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Refresco parcial tras una edición: re-lee solo el producto (con sus relaciones)
   * sin skeleton. Cabecera, KPIs, existencias, componentes e imágenes son `computed`
   * sobre `producto()`, así que se actualizan solos.
   */
  refrescarProducto(id: string) {
    this.productoService.obtenerPorId(id, ProductoDetailComponent.INCLUDES).subscribe({
      next: (prod) => {
        this.producto.set(prod);
        // La portada pudo cambiar: da otra oportunidad al <img> (el latch se quedaba en true).
        this.imagenError.set(false);
        this.cdr.markForCheck();
        if (prod.tipo !== 'kit') this.cargarDesglose(id);
      },
      error: (err) => console.error('Error al refrescar producto:', err),
    });
  }

  /** Saldo traducido a cada presentación (unidades completas + fracción). */
  readonly desglose = signal<DesgloseExistenciasResponse | null>(null);

  cargarDesglose(productoId: string) {
    this.productoService.desglosarExistencias(productoId).subscribe({
      next: (d) => {
        this.desglose.set(d);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al desglosar existencias:', err);
        this.desglose.set(null);
      },
    });
  }

  /** Proveedores vinculados a este producto (ficha «Proveedores»). */
  readonly proveedoresProducto = signal<{ link: ProductoProveedorResponse; nombreProveedor: string }[]>([]);
  readonly cargandoProveedoresProducto = signal(true);

  cargarProveedoresProducto(productoId: string) {
    this.cargandoProveedoresProducto.set(true);
    this.proveedorService.listarProveedoresDeProducto(productoId, true).subscribe({
      next: (links) => {
        if (links.length === 0) {
          this.proveedoresProducto.set([]);
          this.cargandoProveedoresProducto.set(false);
          return;
        }
        forkJoin(
          links.map((link) => this.proveedorService.obtener(link.proveedor_id).pipe(catchError(() => of(null)))),
        ).subscribe((provs) => {
          this.proveedoresProducto.set(
            links.map((link, i) => ({ link, nombreProveedor: (provs[i] as ProveedorResponse | null)?.razon_social ?? link.proveedor_id.slice(0, 8) })),
          );
          this.cargandoProveedoresProducto.set(false);
          this.cdr.markForCheck();
        });
      },
      error: () => this.cargandoProveedoresProducto.set(false),
    });
  }

  agregarProveedor() {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.openAgregarProveedorSheet(prod, () =>
      this.cargarProveedoresProducto(prod.id)
    );
  }

  marcarPrincipalProveedor(fila: { link: ProductoProveedorResponse }) {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.marcarPrincipalProveedor(prod.id, fila.link.id, () =>
      this.cargarProveedoresProducto(prod.id)
    );
  }

  desvincularProveedorProducto(fila: { link: ProductoProveedorResponse; nombreProveedor: string }) {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.desvincularProveedor(prod.id, fila.link.id, fila.nombreProveedor, () =>
      this.cargarProveedoresProducto(prod.id)
    );
  }

  cargarMovimientos(productoId: string) {
    this.movimientoService.listar({ producto_id: productoId, sort: 'created_at:desc', include: 'usuario' }).subscribe({
      next: (movs) => {
        this.movimientos.set(movs);
        this.loading.set(false);
        this.cdr.markForCheck(); // notify view to update
      },
      error: (err) => {
        console.error('Error al cargar movimientos:', err);
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  /** Portada de cada presentación (`unidad.id` → url) — `UnidadResponse` no la trae, se pide aparte. */
  readonly portadasUnidad = signal<Record<string, string | null>>({});

  cargarUnidades(productoId: string) {
    this.productoService.listarUnidades(productoId, true).subscribe({
      next: (unids) => {
        this.unidades.set(unids);
        this.cdr.markForCheck();
        if (unids.length === 0) {
          this.portadasUnidad.set({});
          return;
        }
        forkJoin(
          unids.map(u =>
            this.productoService
              .listarImagenesUnidad(productoId, u.id)
              .pipe(catchError(() => of([]))),
          ),
        ).subscribe(listas => {
          const mapa: Record<string, string | null> = {};
          unids.forEach((u, i) => {
            const imgs = listas[i];
            const p = imgs.find(x => x.es_principal) ?? imgs[0];
            mapa[u.id] = p?.url ?? p?.thumbnail_url ?? null;
          });
          this.portadasUnidad.set(mapa);
          this.cdr.markForCheck();
        });
      },
      error: (err) => {
        console.error('Error al cargar unidades:', err);
      }
    });
  }

  private fmtNum(n: number): string {
    return Number.isFinite(n) ? Number(n.toFixed(6)).toString() : '—';
  }

  /** Texto legible de la equivalencia de una presentación con la unidad base. */
  describirEquivalencia(u: UnidadResponse): string {
    const base = this.producto()?.unidad_medida ?? 'base';
    const factor = Number(u.factor);
    if (factor >= 1) {
      return `1 ${u.unidad_medida} = ${this.fmtNum(factor)} ${base}`;
    }
    const upb = u.unidades_por_base != null ? Number(u.unidades_por_base) : factor > 0 ? 1 / factor : 0;
    return `${this.fmtNum(upb)} ${u.unidad_medida} = 1 ${base}`;
  }

  readonly getNombreSucursalBound = (id: string) => this.getNombreSucursal(id);
  readonly describirEquivalenciaBound = (u: UnidadResponse) => this.describirEquivalencia(u);

  getNombreSucursal(id: string): string {
    const sucursales = this.sucursalService.sucursales();
    const sucursal = sucursales.find(s => s.id === id);
    return sucursal ? sucursal.nombre : id;
  }

  openEditSheet() {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.openEditSheet(prod, () =>
      this.refrescarProducto(prod.id)
    );
  }

  desactivarProducto() {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.desactivarProducto(prod, () =>
      this.producto.update(p => (p ? { ...p, activo: false } : p))
    );
  }

  /** La galería ya persistió el cambio; refresca solo el producto (portada + URLs prefirmadas). */
  onImagenPrincipalCambiada(_url: string | null) {
    const prod = this.producto();
    if (prod) this.refrescarProducto(prod.id);
  }

  eliminarProducto() {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.eliminarProducto(prod);
  }

  activarProducto() {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.activarProducto(prod, () =>
      this.producto.update(p => (p ? { ...p, activo: true } : p))
    );
  }

  openMovimientoSheet() {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.openMovimientoSheet(prod, () => {
      this.refrescarProducto(prod.id);
      this.cargarMovimientos(prod.id);
    });
  }

  openTransferenciaSheet() {
    const prod = this.producto();
    if (!prod) return;
    this.productoAcciones.openTransferenciaSheet(prod, () => {
      this.refrescarProducto(prod.id);
      this.cargarMovimientos(prod.id);
    });
  }

  openUmbralesSheet(existencia: ExistenciaResponse) {
    const prod = this.producto();
    if (!prod) return;
    const nombreSucursal = this.getNombreSucursal(existencia.sucursal_id);
    this.productoAcciones.openUmbralesSheet(prod, existencia, nombreSucursal, () =>
      this.refrescarProducto(prod.id)
    );
  }

  openAddComponenteSheet() {
    const prod = this.producto();
    if (!prod || prod.tipo !== 'kit') return;
    this.productoAcciones.openAddComponenteSheet(prod, () =>
      this.refrescarProducto(prod.id)
    );
  }

  openEditComponenteSheet(comp: ComponenteResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo !== 'kit') return;
    this.productoAcciones.openEditComponenteSheet(prod, comp, () =>
      this.refrescarProducto(prod.id)
    );
  }

  quitarComponente(comp: ComponenteResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo !== 'kit') return;
    this.productoAcciones.quitarComponente(prod.id, prod.nombre, comp, () =>
      this.refrescarProducto(prod.id)
    );
  }

  openAddUnidadSheet() {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;
    this.productoAcciones.openAddUnidadSheet(prod, () =>
      this.cargarUnidades(prod.id)
    );
  }

  openEditUnidadSheet(unidad: UnidadResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;
    this.productoAcciones.openEditUnidadSheet(prod, unidad, () =>
      this.cargarUnidades(prod.id)
    );
  }

  desactivarUnidad(unidad: UnidadResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;
    this.productoAcciones.desactivarUnidad(prod.id, unidad, () =>
      this.cargarUnidades(prod.id)
    );
  }

  reactivarUnidad(unidad: UnidadResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;
    this.productoAcciones.reactivarUnidad(prod.id, unidad, () =>
      this.cargarUnidades(prod.id)
    );
  }
}
