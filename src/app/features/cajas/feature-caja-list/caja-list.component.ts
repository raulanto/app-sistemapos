import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideMonitor, lucidePencil, lucideBan, lucideCircleCheck } from '@ng-icons/lucide';

import { CajaService } from '../../ventas/data-access/caja.service';
import { CajaResponse } from '../../ventas/data-access/ventas.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardTableImports } from '../../../shared/components/table/table.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSwitchComponent } from '../../../shared/components/switch/switch.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { CajaFormSheetComponent } from '../ui/caja-form-sheet/caja-form-sheet.component';

@Component({
  selector: 'app-caja-list',
  standalone: true,
  imports: [
    NgIconComponent,
    ...ZardTableImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ZardSwitchComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideMonitor, lucidePencil, lucideBan, lucideCircleCheck })],
  templateUrl: './caja-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajaListComponent {
  private cajaService = inject(CajaService);
  private sheetService = inject(ZardSheetService);
  private alertDialog = inject(ZardAlertDialogService);
  private sonner = inject(ZardSonnerService);
  private authService = inject(AuthService);

  readonly canAdministrar = computed(() => this.authService.hasPermission(...PERMISOS.caja.administrar));

  readonly cajas = signal<CajaResponse[]>([]);
  readonly loading = signal(true);
  readonly incluirInactivas = signal(false);

  constructor() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.cajaService.listarCajas(this.incluirInactivas()).subscribe({
      next: cs => {
        this.cajas.set(cs);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar terminales', err);
        this.loading.set(false);
      },
    });
  }

  toggleInactivas(v: boolean) {
    this.incluirInactivas.set(v);
    this.cargar();
  }

  openCreateSheet() {
    this.sheetService.create({
      zTitle: 'Nueva terminal',
      zDescription: 'Alta de una caja física de la sucursal.',
      zContent: CajaFormSheetComponent,
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Terminal creada', 'No se pudo crear la terminal'),
    });
  }

  openEditSheet(caja: CajaResponse) {
    this.sheetService.create({
      zTitle: `Renombrar ${caja.nombre}`,
      zDescription: 'Cambia el nombre de la terminal.',
      zContent: CajaFormSheetComponent,
      zData: { caja },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Terminal actualizada', 'No se pudo actualizar la terminal'),
    });
  }

  private persistir(instance: any, okMsg: string, errMsg: string): Promise<void> | false {
    const obs = instance.save();
    if (!obs) return false;
    return new Promise<void>((resolve, reject) => {
      obs.subscribe({
        next: () => {
          this.sonner.success(okMsg);
          this.cargar();
          resolve();
        },
        error: (err: any) => {
          this.sonner.error(err?.error?.error?.message ?? errMsg);
          reject(err);
        },
      });
    });
  }

  desactivar(caja: CajaResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Desactivar ${caja.nombre}?`,
      zDescription: 'No se podrán abrir turnos en esta terminal hasta reactivarla.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.cajaService.desactivarCaja(caja.id).subscribe({
          next: () => {
            this.sonner.success('Terminal desactivada');
            this.cargar();
          },
          error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo desactivar'),
        });
      },
    });
  }

  reactivar(caja: CajaResponse) {
    this.cajaService.reactivarCaja(caja.id).subscribe({
      next: () => {
        this.sonner.success('Terminal reactivada');
        this.cargar();
      },
      error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo reactivar'),
    });
  }
}
