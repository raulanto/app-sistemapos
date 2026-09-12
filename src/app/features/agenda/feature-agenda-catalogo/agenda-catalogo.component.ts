import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArmchair, lucideBan, lucidePencil, lucidePlus, lucideRotateCcw } from '@ng-icons/lucide';

import { AgendaService } from '../data-access/agenda.service';
import { RecursoResponse } from '../data-access/agenda.models';

import { ZardTabsImports } from '../../../shared/components/tabs/tabs.imports';
import { ZardCardImports } from '../../../shared/components/card/card.imports';
import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { ZardAlertDialogService } from '../../../shared/components/alert-dialog/alert-dialog.service';
import { RecursoFormSheetComponent } from '../ui/recurso-form-sheet/recurso-form-sheet.component';
import { EmpleadoAgendaEditorComponent } from '../ui/empleado-agenda-editor/empleado-agenda-editor.component';

@Component({
  selector: 'app-agenda-catalogo',
  standalone: true,
  imports: [
    NgIcon,
    ...ZardTabsImports,
    ...ZardCardImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    EmpleadoAgendaEditorComponent,
  ],
  viewProviders: [provideIcons({ lucideArmchair, lucideBan, lucidePencil, lucidePlus, lucideRotateCcw })],
  templateUrl: './agenda-catalogo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaCatalogoComponent {
  private agendaService = inject(AgendaService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private alertDialog = inject(ZardAlertDialogService);

  readonly recursos = signal<RecursoResponse[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.agendaService.listarRecursos({ incluir_inactivos: true }).subscribe({
      next: r => {
        this.recursos.set(r);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar recursos', err);
        this.loading.set(false);
      },
    });
  }

  crear() {
    this.sheetService.create({
      zTitle: 'Nuevo recurso',
      zDescription: 'Silla, cabina, equipo… lo que un servicio con "requiere recurso" necesita.',
      zContent: RecursoFormSheetComponent,
      zData: {},
      zOkText: 'Crear',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Recurso creado', 'No se pudo crear el recurso'),
    });
  }

  editar(recurso: RecursoResponse) {
    this.sheetService.create({
      zTitle: `Editar ${recurso.nombre}`,
      zContent: RecursoFormSheetComponent,
      zData: { recurso },
      zOkText: 'Guardar',
      zCancelText: 'Cancelar',
      zOnOk: (i: any) => this.persistir(i, 'Recurso actualizado', 'No se pudo actualizar el recurso'),
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

  desactivar(recurso: RecursoResponse) {
    this.alertDialog.confirm({
      zTitle: `¿Desactivar ${recurso.nombre}?`,
      zDescription: 'Deja de ofrecerse para nuevas citas.',
      zOkText: 'Desactivar',
      zOkDestructive: true,
      zOnOk: () => {
        this.agendaService.eliminarRecurso(recurso.id).subscribe({
          next: () => {
            this.sonner.success('Recurso desactivado');
            this.cargar();
          },
          error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo desactivar el recurso'),
        });
      },
    });
  }

  reactivar(recurso: RecursoResponse) {
    this.agendaService.reactivarRecurso(recurso.id).subscribe({
      next: () => {
        this.sonner.success('Recurso reactivado');
        this.cargar();
      },
      error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo reactivar el recurso'),
    });
  }
}
