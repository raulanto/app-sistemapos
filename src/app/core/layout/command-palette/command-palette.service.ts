import { Injectable, inject } from '@angular/core';

import { ZardDialogService } from '@/shared/components/dialog';

import { CommandPaletteComponent } from './command-palette.component';

/**
 * Punto único para abrir el command palette (Ctrl/Cmd+K). Las acciones que
 * ofrece viven en {@link CommandPaletteComponent}, que las filtra por
 * permiso al construirse.
 */
@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly dialog = inject(ZardDialogService);

  open(): void {
    this.dialog.create({
      zContent: CommandPaletteComponent,
      zTitle: 'Buscar',
      zHideHeader: true,
      zHideFooter: true,
      zClosable: false,
      zCustomClasses: 'gap-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-lg',
    });
  }
}
