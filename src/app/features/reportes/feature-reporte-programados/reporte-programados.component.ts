import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideTrash } from '@ng-icons/lucide';

import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardSheetService } from '@/shared/components/sheet/sheet.service';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardSonnerService } from '@/shared/components/sonner/sonner.service';
import { ZardSwitchComponent } from '@/shared/components/switch/switch.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';

import { ReporteService } from '../data-access/reporte.service';
import { ReporteProgramadoResponse } from '../data-access/reporte.models';
import { ReportePaginacionComponent } from '../ui/reporte-paginacion/reporte-paginacion.component';
import { ReporteProgramadoFormSheetComponent } from '../ui/reporte-programado-form-sheet/reporte-programado-form-sheet.component';

const ETIQUETAS_TIPO: Record<string, string> = {
  ventas: 'Ventas por período',
  ventas_por_metodo_pago: 'Ventas por método de pago',
  inventario_valorizado: 'Inventario valorizado',
  mermas_ajustes: 'Mermas y ajustes',
  clientes_con_saldo: 'Clientes con saldo',
};

@Component({
  selector: 'app-reporte-programados',
  standalone: true,
  imports: [
    DatePipe,
    NgIcon,
    ...ZardTableImports,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    ZardSwitchComponent,
    ReportePaginacionComponent,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideTrash })],
  templateUrl: './reporte-programados.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteProgramadosComponent {
  private readonly reporteService = inject(ReporteService);
  private readonly sheetService = inject(ZardSheetService);
  private readonly alertDialog = inject(ZardAlertDialogService);
  private readonly sonner = inject(ZardSonnerService);

  readonly data = signal<ReporteProgramadoResponse[]>([]);
  readonly cargando = signal(true);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.reporteService.programadosListar({ page: this.page(), page_size: this.pageSize() }).subscribe({
      next: res => {
        this.cargando.set(false);
        this.data.set(res.data);
        const p = res.meta?.pagination;
        this.totalItems.set(p?.total_items ?? res.data.length);
        this.totalPages.set(Math.max(1, p?.total_pages ?? 1));
      },
      error: () => this.cargando.set(false),
    });
  }

  onPage(p: number) {
    this.page.set(p);
    this.cargar();
  }
  onPageSize(n: number) {
    this.pageSize.set(n);
    this.page.set(1);
    this.cargar();
  }

  etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO[tipo] ?? tipo;
  }

  nuevo() {
    this.sheetService.create({
      zTitle: 'Programar reporte',
      zDescription: 'Se genera y se envía por correo automáticamente según la frecuencia elegida.',
      zContent: ReporteProgramadoFormSheetComponent,
      zOkText: 'Programar',
      zCancelText: 'Cancelar',
      zOnOk: (instance: ReporteProgramadoFormSheetComponent) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: () => {
              this.sonner.success('Reporte programado');
              this.cargar();
              resolve();
            },
            error: err => {
              this.sonner.error(err?.error?.error?.message ?? 'No se pudo programar el reporte');
              reject(err);
            },
          });
        });
      },
    });
  }

  toggleActivo(p: ReporteProgramadoResponse, activo: boolean) {
    this.reporteService.programadosSetActivo(p.id, activo).subscribe({
      next: r => this.data.update(list => list.map(item => (item.id === r.id ? r : item))),
      error: err => {
        this.sonner.error(err?.error?.error?.message ?? 'No se pudo actualizar el reporte programado');
      },
    });
  }

  eliminar(p: ReporteProgramadoResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Eliminar este reporte programado?`,
      zDescription: `${this.etiquetaTipo(p.tipo_reporte)} · ${p.frecuencia}. Esta acción no se puede deshacer.`,
      zOkText: 'Eliminar',
      zOkDestructive: true,
      zOnOk: () => {
        this.reporteService.programadosEliminar(p.id).subscribe({
          next: () => {
            this.sonner.success('Reporte programado eliminado');
            this.cargar();
          },
          error: err => {
            this.sonner.error(err?.error?.error?.message ?? 'No se pudo eliminar el reporte programado');
          },
        });
      },
    });
  }
}
