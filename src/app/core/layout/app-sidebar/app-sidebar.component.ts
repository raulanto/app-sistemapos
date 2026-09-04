import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';
import { NavMainComponent, type Sidebar07NavItem } from './nav-main.component';
import { NavSecondaryComponent } from './nav-secondary.component';
import { NavUserComponent } from './nav-user.component';
import { TeamSwitcherComponent } from './team-switcher.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    ...ZardSidebarImports,
    TeamSwitcherComponent,
    NavMainComponent,
    NavSecondaryComponent,
    NavUserComponent,
  ],
  template: `
    <z-sidebar zCollapsible="icon">
      <div z-sidebar-header>
        <lib-sidebar-07-team-switcher />
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

  protected readonly navSecondary: readonly Sidebar07NavItem[] = [
    {
      title: 'Buscar',
      url: '/buscar',
      icon: 'lucideSearch',
    },
    {
      title: 'Sucursales',
      url: '/sucursales',
      icon: 'lucideStore',
    },
    {
      title: 'Configuración',
      url: '/config',
      icon: 'lucideSettings',
    },
  ];

  protected readonly navMain: readonly Sidebar07NavItem[] = [
    {
      title: 'Dashboard',
      url: '/',
      icon: 'lucideLayoutDashboard',
      isActive: true,
    },
    {
      title: 'Ventas',
      url: '/ventas',
      icon: 'lucideShoppingCart',
    },
    {
      title: 'Inventario',
      url: '/inventario',
      icon: 'lucidePackage',
      items: [
        { title: 'Productos', url: '/inventario/productos' },
        { title: 'Nuevo Producto', url: '/inventario/productos/nuevo' },
        { title: 'Categorías', url: '/inventario/categorias' },
      ],
    },
    {
      title: 'Clientes',
      url: '/clientes',
      icon: 'lucideUsers',
    },
    {
      title: 'Usuarios',
      url: '/usuarios',
      icon: 'lucideUsers',
    },
    {
      title: 'Reportes',
      url: '/reportes',
      icon: 'lucideBarChart3',
    },
    {
      title: 'Auditoría',
      url: '/auditoria',
      icon: 'lucideShieldCheck',
    },
  ];
}
