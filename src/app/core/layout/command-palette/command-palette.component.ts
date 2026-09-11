import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { provideIcons } from '@ng-icons/core';
import {
  lucideBoxes,
  lucideBuilding2,
  lucideChartColumn,
  lucideCirclePlus,
  lucideClipboardList,
  lucideLandmark,
  lucideLayoutDashboard,
  lucidePackagePlus,
  lucideSearchX,
  lucideShieldCheck,
  lucideShoppingCart,
  lucideTag,
  lucideUserCog,
  lucideUsers,
} from '@ng-icons/lucide';

import { AuthService } from '@core/auth/api/auth.service';
import { PERMISOS } from '@core/auth/permissions';
import { ZardCommandImports, type ZardCommandOption } from '@/shared/components/command';
import { ZardDialogRef } from '@/shared/components/dialog';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';

import type { CommandPaletteAction, CommandPaletteGroup } from './command-palette.types';

const NAVEGACION: readonly CommandPaletteAction[] = [
  { label: 'Dashboard', url: '/', icon: 'lucideLayoutDashboard' },
  { label: 'Punto de venta', url: '/ventas', icon: 'lucideShoppingCart' },
  { label: 'Pedidos', url: '/pedidos', icon: 'lucideClipboardList' },
  { label: 'Inventario', url: '/inventario/productos', icon: 'lucideBoxes' },
  { label: 'Promociones', url: '/promociones', icon: 'lucideTag' },
  { label: 'Sucursales', url: '/sucursales', icon: 'lucideLandmark' },
  { label: 'Clientes', url: '/clientes', icon: 'lucideUsers' },
  { label: 'Usuarios', url: '/usuarios', icon: 'lucideUserCog' },
  { label: 'Reportes', url: '/reportes', icon: 'lucideChartColumn' },
  { label: 'Auditoría', url: '/auditoria', icon: 'lucideShieldCheck' },
];

const CREAR: readonly CommandPaletteAction[] = [
  {
    label: 'Crear producto',
    url: '/inventario/productos/nuevo',
    icon: 'lucidePackagePlus',
    permiso: PERMISOS.inventario.crear,
  },
  { label: 'Crear pedido', url: '/pedidos/nuevo', icon: 'lucideCirclePlus', permiso: PERMISOS.pedidos.crear },
  { label: 'Crear sucursal', url: '/sucursales/nuevo', icon: 'lucideBuilding2' },
];

@Component({
  selector: 'app-command-palette',
  imports: [...ZardCommandImports, ZardEmptyComponent],
  viewProviders: [
    provideIcons({
      lucideBoxes,
      lucideBuilding2,
      lucideChartColumn,
      lucideCirclePlus,
      lucideClipboardList,
      lucideLandmark,
      lucideLayoutDashboard,
      lucidePackagePlus,
      lucideSearchX,
      lucideShieldCheck,
      lucideShoppingCart,
      lucideTag,
      lucideUserCog,
      lucideUsers,
    }),
  ],
  template: `
    <z-command (zCommandSelected)="onSelected($event)" #cmd="zCommand">
      <z-command-input placeholder="Buscar o navegar..." />
      <z-command-list>
        @for (group of groups(); track group.label) {
          <z-command-option-group [zLabel]="group.label">
            @for (action of group.actions; track action.url) {
              <z-command-option [zValue]="action.url" [zLabel]="action.label" [zIcon]="action.icon" />
            }
          </z-command-option-group>
        }

        @if (cmd.isEmpty()) {
          <z-empty zIcon="lucideSearchX" zTitle="Sin resultados" zDescription="Prueba con otra búsqueda." />
        }
      </z-command-list>
    </z-command>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly dialogRef = inject(ZardDialogRef<CommandPaletteComponent>);

  protected readonly groups = computed<readonly CommandPaletteGroup[]>(() =>
    [
      { label: 'Ir a', actions: NAVEGACION },
      {
        label: 'Crear',
        actions: CREAR.filter(action => !action.permiso || this.auth.hasPermission(...action.permiso)),
      },
    ].filter(group => group.actions.length > 0),
  );

  protected onSelected(option: ZardCommandOption) {
    this.dialogRef.close();
    this.router.navigateByUrl(option.value as string);
  }
}
