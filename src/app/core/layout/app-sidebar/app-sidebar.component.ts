import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  lucideLayoutDashboard, 
  lucideShoppingCart, 
  lucidePackage, 
  lucideUsers, 
  lucideBarChart3, 
  lucideShieldCheck 
} from '@ng-icons/lucide';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIcon, ...ZardSidebarImports],
  viewProviders: [
    provideIcons({ 
      lucideLayoutDashboard, 
      lucideShoppingCart, 
      lucidePackage, 
      lucideUsers, 
      lucideBarChart3, 
      lucideShieldCheck 
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <z-sidebar zVariant="sidebar">
      <z-sidebar-header>
        <div class="flex items-center gap-2 px-4 py-4 font-bold text-lg">
          <div class="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
            <ng-icon name="lucideShoppingCart" class="size-5"></ng-icon>
          </div>
          <span>Sistema POS</span>
        </div>
      </z-sidebar-header>
      
      <z-sidebar-content>
        <z-sidebar-group>
          <z-sidebar-group-label>Módulos</z-sidebar-group-label>
          <z-sidebar-group-content>
            <ul z-sidebar-menu>
              @for (item of navItems; track item.path) {
                <li z-sidebar-menu-item>
                  <a z-sidebar-menu-button
                    [routerLink]="item.path" 
                    routerLinkActive="bg-accent text-accent-foreground font-medium" 
                    [routerLinkActiveOptions]="{exact: item.path === '/'}"
                  >
                    <ng-icon [name]="item.icon" class="size-4"></ng-icon>
                    <span>{{ item.label }}</span>
                  </a>
                </li>
              }
            </ul>
          </z-sidebar-group-content>
        </z-sidebar-group>
      </z-sidebar-content>
      <z-sidebar-footer>
         <div class="px-4 py-2 text-xs text-muted-foreground font-medium text-center opacity-60">v1.0.0</div>
      </z-sidebar-footer>
    </z-sidebar>
  `
})
export class AppSidebarComponent {
  navItems = [
    { label: 'Dashboard', path: '/', icon: 'lucideLayoutDashboard' },
    { label: 'Ventas', path: '/ventas', icon: 'lucideShoppingCart' },
    { label: 'Inventario', path: '/inventario', icon: 'lucidePackage' },
    { label: 'Clientes', path: '/clientes', icon: 'lucideUsers' },
    { label: 'Usuarios', path: '/usuarios', icon: 'lucideUsers' },
    { label: 'Reportes', path: '/reportes', icon: 'lucideBarChart3' },
    { label: 'Auditoría', path: '/auditoria', icon: 'lucideShieldCheck' },
  ];
}
