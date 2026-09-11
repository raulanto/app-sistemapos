import type { IconName } from '@ng-icons/core';

export interface CommandPaletteAction {
  readonly label: string;
  readonly url: string;
  readonly icon: IconName;
  /** Códigos de `PERMISOS`; se omite si la acción no requiere permiso. */
  readonly permiso?: readonly string[];
}

export interface CommandPaletteGroup {
  readonly label: string;
  readonly actions: readonly CommandPaletteAction[];
}
