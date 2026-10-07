import { Component, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';

import { NavHoverDirective, type Sidebar07NavItem } from './nav-main.component';

@Component({
  selector: 'lib-sidebar-07-nav-secondary',
  imports: [
    ...ZardSidebarImports,
    NgComponentOutlet,
    NavHoverDirective,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    <div z-sidebar-group [class]="class()">
      <div z-sidebar-group-content>
        <ul z-sidebar-menu>
          @for (item of items(); track item.title) {
            <li z-sidebar-menu-item>
              <a
                z-sidebar-menu-button
                class="transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground"
                navHover
                #hov="navHover"
                [routerLink]="item.url"
                #rla="routerLinkActive"
                routerLinkActive="!bg-primary !text-primary-foreground [&_svg]:!text-primary-foreground [&_svg]:!stroke-primary-foreground [&>ng-icon]:!text-primary-foreground font-semibold shadow-sm"
                [zActive]="rla.isActive"
              >
                <ng-container [ngComponentOutlet]="item.icon" [ngComponentOutletInputs]="{ size: 16, animate: hov.hovered() }" />
                <span>{{ item.title }}</span>
              </a>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  host: { class: 'contents' },
})
export class NavSecondaryComponent {
  readonly items = input<readonly Sidebar07NavItem[]>([]);
  readonly class = input<string>('');
}
