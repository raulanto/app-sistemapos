import { ChangeDetectionStrategy, Component, Directive, input, signal, type Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ChevronRightIcon } from 'ng-animated-icons';

import { ZardCollapsibleImports } from '../../../shared/components/collapsible/collapsible.imports';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';

export interface Sidebar07NavSubItem {
  readonly title: string;
  readonly url: string;
  /** Componente de `ng-animated-icons` (p. ej. `HistoryIcon`). */
  readonly icon: Type<unknown>;
}

export interface Sidebar07NavItem {
  readonly title: string;
  readonly url: string;
  /** Componente de `ng-animated-icons` (p. ej. `ShoppingCartIcon`). */
  readonly icon: Type<unknown>;
  readonly isActive?: boolean;
  readonly items?: readonly Sidebar07NavSubItem[];
}

/**
 * Expone `hovered()` para alimentar el input `animate` de los iconos de `ng-animated-icons`,
 * de modo que la animación se dispare al pasar por toda la fila y no sólo por el icono.
 */
@Directive({
  selector: '[navHover]',
  standalone: true,
  exportAs: 'navHover',
  host: {
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
    '(focusin)': 'hovered.set(true)',
    '(focusout)': 'hovered.set(false)',
  },
})
export class NavHoverDirective {
  readonly hovered = signal(false);
}

@Component({
  selector: 'lib-sidebar-07-nav-main',
  standalone: true,
  imports: [
    ...ZardSidebarImports,
    ...ZardCollapsibleImports,
    NgComponentOutlet,
    RouterLink,
    RouterLinkActive,
    ChevronRightIcon,
    NavHoverDirective,
  ],
  template: `
    <div z-sidebar-group>
      <div z-sidebar-group-label class="text-[0.7rem] font-semibold uppercase tracking-wider text-sidebar-foreground/80">Plataforma</div>

      <ul z-sidebar-menu>
        @for (item of items(); track item.title) {
          @if (item.items && item.items.length > 0) {
            <li z-sidebar-menu-item z-collapsible class="group/collapsible" [zOpen]="!!item.isActive">
              <button z-collapsible-trigger z-sidebar-menu-button class="transition-colors" navHover #hov="navHover" [zTooltip]="item.title">
                <ng-container [ngComponentOutlet]="item.icon" [ngComponentOutletInputs]="{ size: 16, animate: hov.hovered() }" />
                <span>{{ item.title }}</span>
                <i-chevron-right
                  [size]="16"
                  [animate]="hov.hovered()"
                  class="ml-auto transition-transform duration-300 ease-back group-data-[state=open]/collapsible:rotate-90"
                />
              </button>

              <z-collapsible-content>
                <ul z-sidebar-menu-sub>
                  @for (subItem of item.items; track subItem.title) {
                    <li z-sidebar-menu-sub-item>
                      <a z-sidebar-menu-sub-button class="transition-colors" navHover #hovSub="navHover" [routerLink]="subItem.url" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground font-medium" [routerLinkActiveOptions]="{ exact: true }">
                        <ng-container [ngComponentOutlet]="subItem.icon" [ngComponentOutletInputs]="{ size: 16, animate: hovSub.hovered() }" />
                        <span>{{ subItem.title }}</span>
                      </a>
                    </li>
                  }
                </ul>
              </z-collapsible-content>
            </li>
          } @else {
            <li z-sidebar-menu-item>
              <a z-sidebar-menu-button class="transition-colors" navHover #hov="navHover" [zTooltip]="item.title" [routerLink]="item.url" routerLinkActive="bg-sidebar-accent text-sidebar-accent-foreground font-medium" [routerLinkActiveOptions]="{exact: item.url === '/'}">
                <ng-container [ngComponentOutlet]="item.icon" [ngComponentOutletInputs]="{ size: 16, animate: hov.hovered() }" />
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
