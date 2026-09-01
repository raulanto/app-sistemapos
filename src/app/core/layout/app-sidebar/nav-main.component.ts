import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  lucideLayoutDashboard, 
  lucideShoppingCart, 
  lucidePackage, 
  lucideUsers, 
  lucideBarChart3, 
  lucideShieldCheck,
  lucideChevronRight 
} from '@ng-icons/lucide';

import { ZardCollapsibleImports } from '../../../shared/components/collapsible/collapsible.imports';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';

export interface Sidebar07NavSubItem {
  readonly title: string;
  readonly url: string;
}

export interface Sidebar07NavItem {
  readonly title: string;
  readonly url: string;
  readonly icon: string;
  readonly isActive?: boolean;
  readonly items?: readonly Sidebar07NavSubItem[];
}

@Component({
  selector: 'lib-sidebar-07-nav-main',
  standalone: true,
  imports: [...ZardSidebarImports, ...ZardCollapsibleImports, NgIcon, RouterLink, RouterLinkActive],
  viewProviders: [
    provideIcons({ 
      lucideLayoutDashboard, 
      lucideShoppingCart, 
      lucidePackage, 
      lucideUsers, 
      lucideBarChart3, 
      lucideShieldCheck,
      lucideChevronRight 
    }),
  ],
  template: `
    <div z-sidebar-group>
      <div z-sidebar-group-label>Plataforma</div>

      <ul z-sidebar-menu>
        @for (item of items(); track item.title) {
          @if (item.items && item.items.length > 0) {
            <li z-sidebar-menu-item z-collapsible class="group/collapsible" [zOpen]="!!item.isActive">
              <button z-collapsible-trigger z-sidebar-menu-button [zTooltip]="item.title">
                <ng-icon [name]="item.icon" />
                <span>{{ item.title }}</span>
                <ng-icon
                  name="lucideChevronRight"
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </button>

              <z-collapsible-content>
                <ul z-sidebar-menu-sub>
                  @for (subItem of item.items; track subItem.title) {
                    <li z-sidebar-menu-sub-item>
                      <a z-sidebar-menu-sub-button [routerLink]="subItem.url" routerLinkActive="bg-accent text-accent-foreground font-medium">
                        <span>{{ subItem.title }}</span>
                      </a>
                    </li>
                  }
                </ul>
              </z-collapsible-content>
            </li>
          } @else {
            <li z-sidebar-menu-item>
              <a z-sidebar-menu-button [zTooltip]="item.title" [routerLink]="item.url" routerLinkActive="bg-accent text-accent-foreground font-medium" [routerLinkActiveOptions]="{exact: item.url === '/'}">
                <ng-icon [name]="item.icon" />
                <span>{{ item.title }}</span>
              </a>
            </li>
          }
        }
      </ul>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class NavMainComponent {
  readonly items = input<readonly Sidebar07NavItem[]>([]);
}
