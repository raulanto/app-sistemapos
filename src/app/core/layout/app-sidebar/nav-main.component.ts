import { Component, Directive, input, signal, type Type } from '@angular/core';
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
      <div z-sidebar-group-label class="text-[0.7rem] font-semibold uppercase tracking-wider text-sidebar-foreground/80">
        {{ groupLabel() }}
      </div>

      <ul z-sidebar-menu>
        @for (item of items(); track item.title) {
          @if (item.items && item.items.length > 0) {
            <li z-sidebar-menu-item z-collapsible class="group/collapsible" [zOpen]="!!item.isActive">
              <button z-collapsible-trigger z-sidebar-menu-button class="transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground" navHover #hov="navHover" [zTooltip]="item.title">
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
                      <a 
                        z-sidebar-menu-sub-button 
                        class="transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground" 
                        navHover 
                        #hovSub="navHover" 
                        [routerLink]="subItem.url" 
                        #rlaSub="routerLinkActive"
                        routerLinkActive="!bg-primary !text-primary-foreground [&_svg]:!text-primary-foreground [&_svg]:!stroke-primary-foreground [&>ng-icon]:!text-primary-foreground font-semibold shadow-sm" 
                        [routerLinkActiveOptions]="{ exact: true }"
                        [zActive]="rlaSub.isActive"
                      >
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
              <a 
                z-sidebar-menu-button 
                class="transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground" 
                navHover 
                #hov="navHover" 
                [zTooltip]="item.title" 
                [routerLink]="item.url" 
                #rla="routerLinkActive"
                routerLinkActive="!bg-primary !text-primary-foreground [&_svg]:!text-primary-foreground [&_svg]:!stroke-primary-foreground [&>ng-icon]:!text-primary-foreground font-semibold shadow-sm" 
                [routerLinkActiveOptions]="{exact: item.url === '/'}"
                [zActive]="rla.isActive"
              >
                <ng-container [ngComponentOutlet]="item.icon" [ngComponentOutletInputs]="{ size: 16, animate: hov.hovered() }" />
                <span>{{ item.title }}</span>
              </a>
            </li>
          }
        }
      </ul>
    </div>
  `,
  host: { class: 'contents' },
})
export class NavMainComponent {
  readonly items = input<readonly Sidebar07NavItem[]>([]);
  readonly groupLabel = input<string>('Plataforma');
}
