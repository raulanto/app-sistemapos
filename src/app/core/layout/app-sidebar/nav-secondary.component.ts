import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';

import { NavHoverDirective, type Sidebar07NavItem } from './nav-main.component';

@Component({
  selector: 'lib-sidebar-07-nav-secondary',
  standalone: true,
  imports: [...ZardSidebarImports, NgComponentOutlet, NavHoverDirective],
  template: `
    <div z-sidebar-group [class]="class()">
      <div z-sidebar-group-content>
        <ul z-sidebar-menu>
          @for (item of items(); track item.title) {
            <li z-sidebar-menu-item>
              <a z-sidebar-menu-button class="transition-colors" navHover #hov="navHover" [href]="item.url">
                <ng-container [ngComponentOutlet]="item.icon" [ngComponentOutletInputs]="{ size: 16, animate: hov.hovered() }" />
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
