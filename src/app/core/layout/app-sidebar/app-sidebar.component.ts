import { Component, HostListener, computed, inject } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';

import {
  BoxesIcon,
  BriefcaseBusinessIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  ChartColumnIcon,
  CirclePlusIcon,
  ClipboardCheckIcon,
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
  MessageSquareIcon,
  MonitorCheckIcon,
  PackageCheckIcon,
  RotateCcwIcon,
  ScanTextIcon,
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
import { LayoutConfigService } from '../config/layout-config.service';
import { NavMainComponent, type Sidebar07NavItem } from './nav-main.component';
import { NavSecondaryComponent } from './nav-secondary.component';
import { NavUserComponent } from './nav-user.component';
import { TeamSwitcherComponent } from './team-switcher.component';

const MASTER_NAV_MAIN: Record<string, Sidebar07NavItem> = {
  dashboard: {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboardIcon,
    isActive: true,
  },
  ventas: {
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
  pedidos: {
    title: 'Pedidos',
    url: '/pedidos',
    icon: ClipboardListIcon,
    items: [
      { title: 'Tablero', url: '/pedidos', icon: KanbanIcon },
      { title: 'Nuevo pedido', url: '/pedidos/nuevo', icon: CirclePlusIcon },
    ],
  },
  agenda: {
    title: 'Agenda',
    url: '/agenda',
    icon: CalendarDaysIcon,
    items: [
      { title: 'Citas', url: '/agenda', icon: CalendarCheckIcon },
      { title: 'Catálogo', url: '/agenda/catalogo', icon: FolderKanbanIcon },
    ],
  },
  inventario: {
    title: 'Inventario',
    url: '/inventario',
    icon: BoxesIcon,
    items: [
      { title: 'Productos', url: '/inventario/productos', icon: LayersIcon },
      { title: 'Nuevo Producto', url: '/inventario/productos/nuevo', icon: CirclePlusIcon },
      { title: 'Categorías', url: '/inventario/categorias', icon: FolderKanbanIcon },
      { title: 'Marcas', url: '/inventario/marcas', icon: TagIcon },
    ],
  },
  clientes: {
    title: 'Clientes',
    url: '/clientes',
    icon: UserRoundIcon,
    items: [
      { title: 'Clientes', url: '/clientes', icon: UserRoundCheckIcon },
      { title: 'Monedero', url: '/clientes/monedero', icon: HandCoinsIcon },
    ],
  },
  proveedores: {
    title: 'Proveedores',
    url: '/proveedores',
    icon: BriefcaseBusinessIcon,
    items: [
      { title: 'Proveedores', url: '/proveedores', icon: BriefcaseBusinessIcon },
      { title: 'Pedidos', url: '/proveedores/pedidos', icon: PackageCheckIcon },
      { title: 'Recepciones', url: '/proveedores/recepciones', icon: ClipboardCheckIcon },
      { title: 'Devoluciones', url: '/proveedores/devoluciones', icon: RotateCcwIcon },
    ],
  },
  promociones: {
    title: 'Promociones',
    url: '/promociones',
    icon: TagIcon,
  },
  cajas: {
    title: 'Control de Cajas',
    url: '/cajas',
    icon: MonitorCheckIcon,
  },
  sucursales: {
    title: 'Sucursales',
    url: '/sucursales',
    icon: LandmarkIcon,
  },
  usuarios: {
    title: 'Usuarios',
    url: '/usuarios',
    icon: UserCogIcon,
    items: [
      { title: 'Usuarios', url: '/usuarios', icon: UserPenIcon },
      { title: 'Roles y permisos', url: '/usuarios/roles', icon: KeyRoundIcon },
    ],
  },
  reportes: {
    title: 'Reportes',
    url: '/reportes',
    icon: ChartColumnIcon,
    items: [
      { title: 'Dashboard', url: '/reportes/dashboard', icon: LayoutDashboardIcon },
      { title: 'Ventas', url: '/reportes/ventas', icon: ShoppingCartIcon },
      { title: 'Métodos de pago', url: '/reportes/metodos-pago', icon: HandCoinsIcon },
      { title: 'Por vendedor', url: '/reportes/vendedores', icon: UserRoundIcon },
      { title: 'Productos', url: '/reportes/productos', icon: LayersIcon },
      { title: 'Inventario', url: '/reportes/inventario', icon: BoxesIcon },
      { title: 'Mermas y ajustes', url: '/reportes/mermas', icon: RotateCcwIcon },
      { title: 'Clientes con saldo', url: '/reportes/clientes', icon: UserRoundCheckIcon },
      { title: 'Corte de caja', url: '/reportes/corte-caja', icon: ClockIcon },
      { title: 'Programados', url: '/reportes/programados', icon: CalendarCheckIcon },
    ],
  },
  auditoria: {
    title: 'Auditoría',
    url: '/auditoria',
    icon: ShieldCheckIcon,
  },
};

@Component({
  selector: 'app-sidebar',
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
    <z-sidebar [zCollapsible]="sidebarConfig().collapsible">
      @if (sidebarConfig().showTeamSwitcher || sidebarConfig().showSearch) {
        <div z-sidebar-header>
          @if (sidebarConfig().showTeamSwitcher) {
            <lib-sidebar-07-team-switcher />
          }

          @if (sidebarConfig().showSearch) {
            <ul z-sidebar-menu>
              <li z-sidebar-menu-item>
                <button z-sidebar-menu-button type="button" (click)="commandPalette.open()" zTooltip="Buscar">
                  <ng-icon name="lucideSearch" />
                  <span>Buscar...</span>
                  <z-kbd class="ml-auto">Ctrl K</z-kbd>
                </button>
              </li>
            </ul>
          }
        </div>
      }

      <z-sidebar-content>
        <lib-sidebar-07-nav-main [items]="navMain()" [groupLabel]="sidebarConfig().groupLabel" />
        @if (sidebarConfig().showSecondaryNav) {
          <lib-sidebar-07-nav-secondary [items]="navSecondary" class="mt-auto" />
        }
      </z-sidebar-content>

      @if (sidebarConfig().showUserMenu) {
        <div z-sidebar-footer>
          <lib-sidebar-07-nav-user />
        </div>
      }

      <button z-sidebar-rail aria-label="Alternar barra lateral"></button>
    </z-sidebar>
  `,
  host: { class: 'contents' },
})
export class AppSidebarComponent {
  protected readonly commandPalette = inject(CommandPaletteService);
  protected readonly layoutConfigService = inject(LayoutConfigService);

  readonly sidebarConfig = this.layoutConfigService.sidebar;

  readonly navMain = computed<readonly Sidebar07NavItem[]>(() => {
    const orderItems = this.sidebarConfig().itemsOrder;
    const result: Sidebar07NavItem[] = [];

    for (const item of orderItems) {
      if (item.visible && MASTER_NAV_MAIN[item.id]) {
        result.push(MASTER_NAV_MAIN[item.id]);
      }
    }
    return result;
  });

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.commandPalette.open();
    }
  }

  protected readonly navSecondary: readonly Sidebar07NavItem[] = [
    {
      title: 'Ayuda',
      url: '/ayuda',
      icon: MessageSquareIcon,
    },
    {
      title: 'Configuración',
      url: '/configuracion',
      icon: SettingsIcon,
    },
  ];
}
