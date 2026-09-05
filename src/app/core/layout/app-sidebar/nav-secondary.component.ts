import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleHelp, lucideSearch, lucideSettings } from '@ng-icons/lucide';

import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';

import type { Sidebar07NavItem } from './nav-main.component';

@Component({
  selector: 'lib-sidebar-07-nav-secondary',
  standalone: true,
  imports: [...ZardSidebarImports, NgIcon],
  viewProviders: [provideIcons({ lucideCircleHelp, lucideSearch, lucideSettings })],
  template: `
    <div z-sidebar-group [class]="class()">
      <div z-sidebar-group-content>
        <ul z-sidebar-menu>
          @for (item of items(); track item.title) {
            <li z-sidebar-menu-item>
              <a z-sidebar-menu-button [href]="item.url">
                <ng-icon [name]="item.icon" /> 
                <span>{{ item.title }}</span>
              </a>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class NavSecondaryComponent {
  readonly items = input<readonly Sidebar07NavItem[]>([]);
  readonly class = input<string>('');
}
