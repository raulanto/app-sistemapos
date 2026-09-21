import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ProductoService } from './producto.service';
import { ProveedorService } from '../../proveedores/data-access/proveedor.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { InventarioActionService } from './inventario-action.service';
import { ComponenteResponse, ExistenciaResponse, ProductoResponse, UnidadResponse } from './inventario.models';
import { mensajeProveedorError, ProductoProveedorResponse } from '../../proveedores/data-access/proveedores.models';
import { ProductoFormSheetComponent } from '../ui/producto-form-sheet/producto-form-sheet.component';
import { MovimientoFormSheetComponent } from '../ui/movimiento-form-sheet/movimiento-form-sheet.component';
import { UmbralesFormSheetComponent } from '../ui/umbrales-form-sheet/umbrales-form-sheet.component';
import { ComponenteFormSheetComponent } from '../ui/componente-form-sheet/componente-form-sheet.component';
import { UnidadFormSheetComponent } from '../ui/unidad-form-sheet/unidad-form-sheet.component';
import { ProductoProveedorFormSheetComponent } from '../../proveedores/ui/producto-proveedor-form-sheet/producto-proveedor-form-sheet.component';

@Injectable({
  providedIn: 'root'
})
export class ProductoAccionesService {
  private readonly productoService = inject(ProductoService);
  private readonly proveedorService = inject(ProveedorService);
  private readonly sonner = inject(ZardSonnerService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sheetService = inject(ZardSheetService);
  private readonly inventarioAction = inject(InventarioActionService);
  private readonly router = inject(Router);

  // --- ACCIONES DIRECTAS CON CONFIRMACIÓN DIÁLOGO ---

  desactivarUnidad(productoId: string, unidad: UnidadResponse, onSuccess?: () => void): void {
    this.alertDialog.confirm({
      zTitle: '¿Desactivar presentación?',
      zDescription: `"${unidad.nombre}" dejará de venderse. Las ventas históricas la conservan y puedes reactivarla después.`,
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.productoService.eliminarUnidad(productoId, unidad.id).subscribe({
          next: () => {
            this.sonner.success('Presentación desactivada');
            if (onSuccess) onSuccess();
          },
          error: (err) => {
            console.error('Error al desactivar presentación', err);
            this.sonner.error(err?.error?.error?.message ?? err?.error?.detail ?? 'No se pudo desactivar la presentación');
          }
        });
      }
    });
  }

  reactivarUnidad(productoId: string, unidad: UnidadResponse, onSuccess?: () => void): void {
    this.productoService.reactivarUnidad(productoId, unidad.id).subscribe({
      next: () => {
        this.sonner.success('Presentación reactivada');
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        console.error('Error al reactivar presentación', err);
        this.sonner.error(err?.error?.error?.message ?? err?.error?.detail ?? 'No se pudo reactivar la presentación');
      }
    });
  }

  quitarComponente(kitId: string, kitNombre: string, comp: ComponenteResponse, onSuccess?: () => void): void {
    this.alertDialog.confirm({
      zTitle: '¿Quitar componente de la receta?',
      zDescription: `Se eliminará "${comp.componente?.nombre || 'este producto'}" de la receta de ${kitNombre}.`,
      zOkText: 'Quitar',
      zOkDestructive: true,
      zOnOk: () => {
        this.productoService.quitarComponente(kitId, comp.producto_componente_id).subscribe({
          next: () => {
            this.sonner.success('Componente removido');
            if (onSuccess) onSuccess();
          },
          error: (err) => {
            console.error('Error al remover componente', err);
            this.sonner.error('Error al remover componente');
          }
        });
      }
    });
  }

  desactivarProducto(prod: ProductoResponse, onSuccess?: () => void): void {
    const conStock = (prod.existencias ?? []).some(e => Number(e.cantidad) > 0);
    this.alertDialog.confirm({
      zTitle: `¿Desactivar producto ${prod.sku}?`,
      zDescription: conStock
        ? 'Este producto todavía tiene existencias en una o más sucursales. Se desactivará de todos modos y dejará de estar disponible para la venta.'
        : 'El producto dejará de estar disponible para la venta.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.productoService.desactivar(prod.id, conStock).subscribe({
          next: () => {
            this.sonner.success('Producto desactivado correctamente');
            if (onSuccess) onSuccess();
          },
          error: (err) => {
            console.error('Error al desactivar producto', err);
            this.sonner.error('Error al desactivar el producto');
          }
        });
      }
    });
  }

  activarProducto(prod: ProductoResponse, onSuccess?: () => void): void {
    this.alertDialog.confirm({
      zTitle: `¿Activar producto ${prod.sku}?`,
      zDescription: 'El producto volverá a estar disponible para la venta.',
      zOkText: 'Activar',
      zOnOk: () => {
        this.productoService.activar(prod.id).subscribe({
          next: () => {
            this.sonner.success('Producto activado correctamente');
            if (onSuccess) onSuccess();
          },
          error: (err) => {
            console.error('Error al activar producto', err);
            this.sonner.error('Error al activar el producto');
          }
        });
      }
    });
  }

  eliminarProducto(prod: ProductoResponse, onSuccess?: () => void): void {
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
            if (onSuccess) {
              onSuccess();
            } else {
              this.router.navigate(['/inventario/productos']);
            }
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
          }
        });
      }
    });
  }

  // --- ACCIONES CON PROVEEDORES ---

  marcarPrincipalProveedor(productoId: string, linkId: string, onSuccess?: () => void): void {
    this.proveedorService.marcarPrincipal(productoId, linkId).subscribe({
      next: () => {
        this.sonner.success('Marcado como proveedor principal');
        if (onSuccess) onSuccess();
      },
      error: (err) => this.sonner.error(mensajeProveedorError(err, 'No se pudo marcar como principal')),
    });
  }

  desvincularProveedor(productoId: string, linkId: string, nombreProveedor: string, onSuccess?: () => void): void {
    this.alertDialog.confirm({
      zTitle: `¿Desvincular ${nombreProveedor}?`,
      zDescription: 'Este producto dejará de comprarse a ese proveedor.',
      zOkText: 'Desvincular',
      zOkDestructive: true,
      zOnOk: () => {
        this.proveedorService.desvincularProveedor(productoId, linkId).subscribe({
          next: () => {
            this.sonner.success('Vínculo desactivado');
            if (onSuccess) onSuccess();
          },
          error: (err) => this.sonner.error(mensajeProveedorError(err, 'No se pudo desvincular')),
        });
      },
    });
  }

  // --- ACCIONES MODALES DE APERTURA DE SHEETS ---

  openEditSheet(prod: ProductoResponse, onSaved: () => void): void {
    this.sheetService.create({
      zTitle: `Editar ${prod.sku}`,
      zDescription: 'Modifica los datos del producto.',
      zContent: ProductoFormSheetComponent,
      zSize: 'lg',
      zData: {
        productoId: prod.id,
        onSaved: () => {
          this.sonner.success('Producto actualizado exitosamente');
          onSaved();
        }
      },
      zHideFooter: true
    });
  }

  openMovimientoSheet(prod: ProductoResponse, onSuccess: () => void): void {
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
            setTimeout(() => {
              onSuccess();
            }, 300);
          }
        );
      }
    });
  }

  async openTransferenciaSheet(prod: ProductoResponse, onSuccess: () => void): Promise<void> {
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
              onSuccess();
            }, 300);
          }
        );
      }
    });
  }

  openUmbralesSheet(prod: ProductoResponse, existencia: ExistenciaResponse, nombreSucursal: string, onSuccess: () => void): void {
    this.sheetService.create({
      zTitle: 'Configurar Umbrales',
      zDescription: `Establecer stock mínimo y máximo para la sucursal ${nombreSucursal}.`,
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
              onSuccess();
            }, 300);
          }
        );
      }
    });
  }

  openAddComponenteSheet(prod: ProductoResponse, onSuccess: () => void): void {
    if (prod.tipo !== 'kit') return;
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
              onSuccess();
            }, 300);
          }
        );
      }
    });
  }

  openEditComponenteSheet(prod: ProductoResponse, comp: ComponenteResponse, onSuccess: () => void): void {
    if (prod.tipo !== 'kit') return;
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
              onSuccess();
            }, 300);
          }
        );
      }
    });
  }

  openAddUnidadSheet(prod: ProductoResponse, onSuccess: () => void): void {
    if (prod.tipo === 'kit') return;
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
              onSuccess();
            }, 300);
          }
        );
      }
    });
  }

  openEditUnidadSheet(prod: ProductoResponse, unidad: UnidadResponse, onSuccess: () => void): void {
    if (prod.tipo === 'kit') return;
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
              onSuccess();
            }, 300);
          }
        );
      }
    });
  }

  openAgregarProveedorSheet(prod: ProductoResponse, onSuccess: () => void): void {
    this.sheetService.create({
      zTitle: 'Vincular proveedor',
      zDescription: `Agrega un proveedor para ${prod.nombre}.`,
      zContent: ProductoProveedorFormSheetComponent,
      zSize: 'lg',
      zData: { productoId: prod.id },
      zOkText: 'Vincular',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Proveedor vinculado');
              onSuccess();
              resolve();
            },
            error: (err: unknown) => {
              this.sonner.error(mensajeProveedorError(err, 'No se pudo vincular el proveedor'));
              reject(err);
            },
          });
        });
      },
    });
  }
}
