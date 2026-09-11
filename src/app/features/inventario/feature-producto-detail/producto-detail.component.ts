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
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardChartImports } from '../../../shared/components/chart/chart.imports';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSeparatorComponent } from '../../../shared/components/separator/separator.component';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ImagenGaleriaComponent } from '../ui/imagen-galeria/imagen-galeria.component';
import { ComponenteResponse } from '../data-access/inventario.models';

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
    ZardButtonComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ZardSeparatorComponent,
    ImagenGaleriaComponent,
    ...ZardChartImports
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
  private readonly sonner = inject(ZardSonnerService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.inventario.editar));
  readonly canCrearMovimiento = computed(() => this.authService.hasPermission(...PERMISOS.inventario.crear));

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

  getNombreSucursal(id: string): string {
    const sucursales = this.sucursalService.sucursales();
    const sucursal = sucursales.find(s => s.id === id);
    return sucursal ? sucursal.nombre : id;
  }

  openEditSheet() {
    const prod = this.producto();
    if (!prod) return;
    this.sheetService.create({
      zTitle: `Editar ${prod.sku}`,
      zDescription: 'Modifica los datos del producto.',
      zContent: ProductoFormSheetComponent,
      zSize: 'lg',
      zData: {
        productoId: prod.id,
        onSaved: () => {
          this.sonner.success('Producto actualizado exitosamente');
          this.refrescarProducto(prod.id);
        }
      },
      zHideFooter: true
    });
  }

  desactivarProducto() {
    const prod = this.producto();
    if (!prod) return;
    const conStock = (prod.existencias ?? []).some(e => Number(e.cantidad) > 0);
    this.alertDialog.confirm({
      zTitle: `¿Desactivar producto ${prod.sku}?`,
      zDescription: conStock
        ? 'Este producto todavía tiene existencias en una o más sucursales. Se desactivará de todos modos y dejará de estar disponible para la venta.'
        : 'El producto dejará de estar disponible para la venta.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.inventarioAction.handleAction(
          this.productoService.desactivar(prod.id, conStock),
          'Producto desactivado correctamente',
          'Error al desactivar el producto',
          () => this.producto.update(p => (p ? { ...p, activo: false } : p))
        );
      }
    });
  }

  /** La galería ya persistió el cambio; refresca solo el producto (portada + URLs prefirmadas). */
  onImagenPrincipalCambiada(_url: string | null) {
    const prod = this.producto();
    if (prod) this.refrescarProducto(prod.id);
  }

  eliminarProducto() {
    const prod = this.producto();
    if (!prod) return;
    this.alertDialog.confirm({
      zTitle: `¿Eliminar producto ${prod.sku}?`,
      zDescription:
        'Se borrará permanentemente junto con sus imágenes, presentaciones, receta, lotes y existencias. ' +
        'No se puede si tiene movimientos de inventario o es componente de un kit: en ese caso, desactívalo.',
      zOkText: 'Eliminar',
      zOkDestructive: true,
      zOnOk: () => {
        this.productoService.eliminar(prod.id).subscribe({
          next: () => {
            this.sonner.success('Producto eliminado correctamente');
            this.router.navigate(['/inventario/productos']);
          },
          error: (err) => {
            console.error('Error al eliminar el producto', err);
            if (err?.status === 409) {
              this.sonner.error(
                err?.error?.error?.message ??
                  'El producto tiene historial y no se puede eliminar. Desactívalo en su lugar.',
              );
            } else {
              this.sonner.error('Error al eliminar el producto');
            }
          },
        });
      },
    });
  }

  activarProducto() {
    const prod = this.producto();
    if (!prod) return;
    this.alertDialog.confirm({
      zTitle: `¿Activar producto ${prod.sku}?`,
      zDescription: 'El producto volverá a estar disponible para la venta.',
      zOkText: 'Activar',
      zOnOk: () => {
        this.inventarioAction.handleAction(
          this.productoService.activar(prod.id),
          'Producto activado correctamente',
          'Error al activar el producto',
          () => this.producto.update(p => (p ? { ...p, activo: true } : p))
        );
      }
    });
  }

  openMovimientoSheet() {
    const prod = this.producto();
    if (!prod) return;
    this.sheetService.create({
      zTitle: 'Agregar Movimiento',
      zDescription: `Registrar movimiento manual para ${prod.sku}.`,
      zContent: MovimientoFormSheetComponent,
      zData: { productoId: prod.id },
      zOkText: 'Aplicar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        return this.inventarioAction.handleSheetSave(
          instance.save(),
          'Movimiento registrado exitosamente',
          'Error al registrar el movimiento',
          () => {
            // Small delay to ensure backend transaction is fully committed before reading
            setTimeout(() => {
              this.refrescarProducto(prod.id);
              this.cargarMovimientos(prod.id);
            }, 300);
          }
        );
      }
    });
  }

  async openTransferenciaSheet() {
    const prod = this.producto();
    if (!prod) return;

    const { TransferenciaFormSheetComponent } = await import('../ui/transferencia-form-sheet/transferencia-form-sheet.component');
    
    this.sheetService.create({
      zTitle: 'Transferir Stock',
      zDescription: `Mover unidades de ${prod.nombre} entre sucursales.`,
      zContent: TransferenciaFormSheetComponent,
      zSize: 'lg',
      zData: { productoId: prod.id },
      zOkText: 'Transferir',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        return this.inventarioAction.handleSheetSave(
          instance.save(),
          'Transferencia realizada exitosamente',
          'Error al realizar la transferencia',
          () => {
            setTimeout(() => {
              this.refrescarProducto(prod.id);
              this.cargarMovimientos(prod.id);
            }, 300);
          }
        );
      }
    });
  }

  openUmbralesSheet(existencia: ExistenciaResponse) {
    const prod = this.producto();
    if (!prod) return;
    this.sheetService.create({
      zTitle: 'Configurar Umbrales',
      zDescription: `Establecer stock mínimo y máximo para la sucursal ${this.getNombreSucursal(existencia.sucursal_id)}.`,
      zContent: UmbralesFormSheetComponent,
      zData: {
        productoId: prod.id,
        sucursalId: existencia.sucursal_id,
        stockMinimo: existencia.stock_minimo ? Number(existencia.stock_minimo) : 0,
        stockMaximo: existencia.stock_maximo != null ? Number(existencia.stock_maximo) : null
      },
      zOkText: 'Guardar Umbrales',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        return this.inventarioAction.handleSheetSave(
          instance.save(),
          'Umbrales configurados exitosamente',
          'Error al configurar umbrales',
          () => {
            setTimeout(() => {
              this.refrescarProducto(prod.id);
            }, 300);
          }
        );
      }
    });
  }

  openAddComponenteSheet() {
    const prod = this.producto();
    if (!prod || prod.tipo !== 'kit') return;

    this.sheetService.create({
      zTitle: 'Agregar Componente',
      zDescription: `Selecciona un producto para agregarlo a la receta de ${prod.nombre}.`,
      zContent: ComponenteFormSheetComponent,
      zData: { kitId: prod.id },
      zOkText: 'Agregar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        return this.inventarioAction.handleSheetSave(
          instance.save(),
          'Componente agregado exitosamente',
          'Error al agregar componente',
          () => {
            setTimeout(() => {
              this.refrescarProducto(prod.id);
            }, 300);
          }
        );
      }
    });
  }

  openEditComponenteSheet(comp: ComponenteResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo !== 'kit') return;

    this.sheetService.create({
      zTitle: 'Editar Componente',
      zDescription: `Actualiza la cantidad del componente.`,
      zContent: ComponenteFormSheetComponent,
      zData: { kitId: prod.id, componente: comp },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        return this.inventarioAction.handleSheetSave(
          instance.save(),
          'Componente actualizado',
          'Error al actualizar componente',
          () => {
            setTimeout(() => {
              this.refrescarProducto(prod.id);
            }, 300);
          }
        );
      }
    });
  }

  quitarComponente(comp: ComponenteResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo !== 'kit') return;

    this.alertDialog.confirm({
      zTitle: '¿Quitar componente de la receta?',
      zDescription: `Se eliminará "${comp.componente?.nombre || 'este producto'}" de la receta de ${prod.nombre}.`,
      zOkText: 'Quitar',
      zOkDestructive: true,
      zOnOk: () => {
        this.inventarioAction.handleAction(
          this.productoService.quitarComponente(prod.id, comp.producto_componente_id),
          'Componente removido',
          'Error al remover componente',
          () => this.refrescarProducto(prod.id)
        );
      }
    });
  }

  openAddUnidadSheet() {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;

    this.sheetService.create({
      zTitle: 'Agregar Presentación',
      zDescription: `Nueva presentación de venta para ${prod.nombre}.`,
      zContent: UnidadFormSheetComponent,
      zSize: 'lg',
      zData: { productoId: prod.id, unidadBase: prod.unidad_medida },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        return this.inventarioAction.handleSheetSave(
          instance.save(),
          'Presentación agregada exitosamente',
          'Error al agregar presentación',
          () => {
            setTimeout(() => {
              this.cargarUnidades(prod.id);
            }, 300);
          }
        );
      }
    });
  }

  openEditUnidadSheet(unidad: UnidadResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;

    this.sheetService.create({
      zTitle: 'Editar Presentación',
      zDescription: `Actualiza los datos de la presentación.`,
      zContent: UnidadFormSheetComponent,
      zSize: 'lg',
      zData: { productoId: prod.id, unidadBase: prod.unidad_medida, unidad },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        return this.inventarioAction.handleSheetSave(
          instance.save(),
          'Presentación actualizada exitosamente',
          'Error al actualizar presentación',
          () => {
            setTimeout(() => {
              this.cargarUnidades(prod.id);
            }, 300);
          }
        );
      }
    });
  }

  desactivarUnidad(unidad: UnidadResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;

    this.alertDialog.confirm({
      zTitle: '¿Desactivar presentación?',
      zDescription: `"${unidad.nombre}" dejará de venderse. Las ventas históricas la conservan y puedes reactivarla después.`,
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.productoService.eliminarUnidad(prod.id, unidad.id).subscribe({
          next: () => {
            this.sonner.success('Presentación desactivada');
            this.cargarUnidades(prod.id);
          },
          error: (err) => {
            console.error('Error al desactivar presentación', err);
            this.sonner.error(err?.error?.error?.message ?? err?.error?.detail ?? 'No se pudo desactivar la presentación');
          },
        });
      }
    });
  }

  reactivarUnidad(unidad: UnidadResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;
    this.productoService.reactivarUnidad(prod.id, unidad.id).subscribe({
      next: () => {
        this.sonner.success('Presentación reactivada');
        this.cargarUnidades(prod.id);
      },
      error: (err) => {
        console.error('Error al reactivar presentación', err);
        this.sonner.error(err?.error?.error?.message ?? err?.error?.detail ?? 'No se pudo reactivar la presentación');
      },
    });
  }
}
