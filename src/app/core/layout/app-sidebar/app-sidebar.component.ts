import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';

import {
  BoxesIcon,
  ChartColumnIcon,
  CirclePlusIcon,
  ClipboardListIcon,
  ClockIcon,
  FolderKanbanIcon,
  HandCoinsIcon,
  HistoryIcon,
  KanbanIcon,
  KeyRoundIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  MonitorCheckIcon,
  ScanTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  TagIcon,
  UserCogIcon,
  UserPenIcon,
  UserRoundCheckIcon,
  UserRoundIcon,
} from 'ng-animated-icons';

import { ZardKbdImports } from '../../../shared/components/kbd/kbd.imports';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';
import { CommandPaletteService } from '../command-palette/command-palette.service';
import { NavMainComponent, type Sidebar07NavItem } from './nav-main.component';
import { NavSecondaryComponent } from './nav-secondary.component';
import { NavUserComponent } from './nav-user.component';
import { TeamSwitcherComponent } from './team-switcher.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    ...ZardSidebarImports,
    ...ZardKbdImports,
    TeamSwitcherComponent,
    NavMainComponent,
    NavSecondaryComponent,
    NavUserComponent,
    NgIcon,
  ],
  viewProviders: [provideIcons({ lucideSearch })],
  template: `
    <z-sidebar zCollapsible="icon">
      <div z-sidebar-header>
        <lib-sidebar-07-team-switcher />

        <ul z-sidebar-menu>
          <li z-sidebar-menu-item>
            <button z-sidebar-menu-button type="button" (click)="commandPalette.open()" zTooltip="Buscar">
              <ng-icon name="lucideSearch" />
              <span>Buscar...</span>
              <z-kbd class="ml-auto">Ctrl K</z-kbd>
            </button>
          </li>
        </ul>
      </div>

      <z-sidebar-content>
        <lib-sidebar-07-nav-main [items]="navMain" />
        <lib-sidebar-07-nav-secondary [items]="navSecondary" class="mt-auto" />
      </z-sidebar-content>

      <div z-sidebar-footer>
        <lib-sidebar-07-nav-user />
      </div>

      <button z-sidebar-rail aria-label="Toggle Sidebar"></button>
    </z-sidebar>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class AppSidebarComponent {
  protected readonly commandPalette = inject(CommandPaletteService);

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.commandPalette.open();
    }
  }

  protected readonly navSecondary: readonly Sidebar07NavItem[] = [
    {
      title: 'Buscar',
      url: '/buscar',
      icon: SearchIcon,
    },
    {
      title: 'Configuración',
      url: '/config',
      icon: SettingsIcon,
    },
  ];

  protected readonly navMain: readonly Sidebar07NavItem[] = [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboardIcon,
      isActive: true,
    },
    {
      title: 'Ventas',
      url: '/ventas',
      icon: ShoppingCartIcon,
      items: [
        { title: 'Punto de venta', url: '/ventas', icon: ScanTextIcon },
        { title: 'Historial', url: '/ventas/historial', icon: HistoryIcon },
        { title: 'Turnos de caja', url: '/ventas/turnos', icon: ClockIcon },
        { title: 'Terminales', url: '/cajas', icon: MonitorCheckIcon },
        { title: 'Promociones', url: '/promociones', icon: TagIcon },
      ],
    },
    {
      title: 'Pedidos',
      url: '/pedidos',
      icon: ClipboardListIcon,
      items: [
        { title: 'Tablero', url: '/pedidos', icon: KanbanIcon },
        { title: 'Nuevo pedido', url: '/pedidos/nuevo', icon: CirclePlusIcon },
      ],
    },
    {
      title: 'Inventario',
      url: '/inventario',
      icon: BoxesIcon,
      items: [
        { title: 'Productos', url: '/inventario/productos', icon: LayersIcon },
        { title: 'Nuevo Producto', url: '/inventario/productos/nuevo', icon: CirclePlusIcon },
        { title: 'Categorías', url: '/inventario/categorias', icon: FolderKanbanIcon },
      ],
    },
    {
      title: 'Sucursales',
      url: '/sucursales',
      icon: LandmarkIcon,
    },
    {
      title: 'Clientes',
      url: '/clientes',
      icon: UserRoundIcon,
      items: [
        { title: 'Clientes', url: '/clientes', icon: UserRoundCheckIcon },
        { title: 'Monedero', url: '/clientes/monedero', icon: HandCoinsIcon },
      ],
    },
    {
      title: 'Usuarios',
      url: '/usuarios',
      icon: UserCogIcon,
      items: [
        { title: 'Usuarios', url: '/usuarios', icon: UserPenIcon },
        { title: 'Roles y permisos', url: '/usuarios/roles', icon: KeyRoundIcon },
      ],
    },
    {
      title: 'Reportes',
      url: '/reportes',
      icon: ChartColumnIcon,
    },
    {
      title: 'Auditoría',
      url: '/auditoria',
      icon: ShieldCheckIcon,
    },
  ];
}
