import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePackage, lucideActivity, lucideCalendar, lucideMapPin, lucideEdit, lucidePlus, lucideSettings2 } from '@ng-icons/lucide';

import { ProductoService } from '../data-access/producto.service';
import { MovimientoService } from '../data-access/movimiento.service';
import { SucursalService } from '../../../core/sucursal/sucursal.service';
import { ProductoResponse, MovimientoResponse, ExistenciaResponse } from '../data-access/inventario.models';

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
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';

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
    ZardButtonComponent
  ],
  templateUrl: './producto-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideArrowLeft, lucidePackage, lucideActivity, lucideCalendar, lucideMapPin, lucideEdit, lucidePlus, lucideSettings2 })]
})
export class ProductoDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productoService = inject(ProductoService);
  private readonly movimientoService = inject(MovimientoService);
  public readonly sucursalService = inject(SucursalService);
  private readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);
  private readonly inventarioAction = inject(InventarioActionService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly canEditar = computed(() => this.authService.hasPermission(...PERMISOS.inventario.editar));
  readonly canCrearMovimiento = computed(() => this.authService.hasPermission(...PERMISOS.inventario.crear));

  producto = signal<ProductoResponse | null>(null);
  movimientos = signal<MovimientoResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  totalStock = computed(() => {
    const prod = this.producto();
    if (!prod || !prod.existencias) return 0;
    return prod.existencias.reduce((sum, ext) => sum + Number(ext.cantidad), 0);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/inventario/productos']);
      return;
    }
    this.cargarDatos(id);
  }

  cargarDatos(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.cdr.markForCheck(); // force check

    this.productoService.obtenerPorId(id, 'categoria,existencias').subscribe({
      next: (prod) => {
        this.producto.set(prod);
        this.cargarMovimientos(id);
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
    this.movimientoService.listar({ producto_id: productoId, sort: 'created_at:desc' }).subscribe({
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
        stockMaximo: null // Backend has it but we might not have it in the frontend interface yet, will default to null
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
}
