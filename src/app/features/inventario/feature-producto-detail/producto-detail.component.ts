import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ProductoResponse, MovimientoResponse, ExistenciaResponse, UnidadResponse, UnidadMedidaResponse } from '../data-access/inventario.models';

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

  cargarDatos(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.cdr.markForCheck(); // force check

    this.productoService.obtenerPorId(id, 'categoria,existencias,componentes').subscribe({
      next: (prod) => {
        this.producto.set(prod);
        this.cargarMovimientos(id);
        if (prod.tipo !== 'kit') {
          this.cargarUnidades(id);
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

  cargarUnidades(productoId: string) {
    this.productoService.listarUnidades(productoId, true).subscribe({
      next: (unids) => {
        this.unidades.set(unids);
        this.cdr.markForCheck();
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
          this.cargarDatos(prod.id);
        }
      },
      zHideFooter: true
    });
  }

  desactivarProducto() {
    const prod = this.producto();
    if (!prod) return;
    this.alertDialog.confirm({
      zTitle: `¿Desactivar producto ${prod.sku}?`,
      zDescription: 'El producto dejará de estar disponible para la venta.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.inventarioAction.handleAction(
          this.productoService.desactivar(prod.id),
          'Producto desactivado correctamente',
          'Error al desactivar el producto',
          () => this.cargarDatos(prod.id)
        );
      }
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
          () => this.cargarDatos(prod.id)
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
              this.cargarDatos(prod.id);
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
              this.cargarDatos(prod.id);
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
              this.cargarDatos(prod.id);
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
              this.cargarDatos(prod.id);
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
              this.cargarDatos(prod.id);
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
          () => this.cargarDatos(prod.id)
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

  eliminarUnidad(unidad: UnidadResponse) {
    const prod = this.producto();
    if (!prod || prod.tipo === 'kit') return;

    this.alertDialog.confirm({
      zTitle: '¿Eliminar presentación?',
      zDescription: `Se eliminará la presentación "${unidad.nombre}" de ${prod.nombre}.`,
      zOkText: 'Eliminar',
      zOkDestructive: true,
      zOnOk: () => {
        this.inventarioAction.handleAction(
          this.productoService.eliminarUnidad(prod.id, unidad.id),
          'Presentación eliminada',
          'Error al eliminar presentación',
          () => this.cargarUnidades(prod.id)
        );
      }
    });
  }
}
