import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAudioWaveform,
  lucideChevronsUpDown,
  lucideCommand,
  lucideGalleryVerticalEnd,
  lucidePlus,
  lucideStore
} from '@ng-icons/lucide';

import type { ZardDropdownSide } from '../../../shared/components/dropdown/dropdown-positions';
import { ZardDropdownImports } from '../../../shared/components/dropdown/dropdown.imports';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';
import { ZardSidebarService } from '../../../shared/components/sidebar/sidebar.service';
import { SucursalService } from '../../sucursal/sucursal.service';

@Component({
  selector: 'lib-sidebar-07-team-switcher',
  standalone: true,
  imports: [...ZardSidebarImports, ...ZardDropdownImports, NgIcon],
  viewProviders: [
    provideIcons({ lucideAudioWaveform, lucideChevronsUpDown, lucideCommand, lucideGalleryVerticalEnd, lucidePlus, lucideStore }),
  ],
  template: `
    <ul z-sidebar-menu>
      <li z-sidebar-menu-item>
        <button
          z-sidebar-menu-button
          zSize="lg"
          z-dropdown
          [zDropdownMenu]="teamMenu"
          class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div
            class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
          >
            <ng-icon name="lucideStore" class="size-4" />
          </div>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{{ sucursalService.selectedSucursal()?.nombre }}</span>
            <span class="truncate text-xs">{{ sucursalService.selectedSucursal()?.direccion || 'Sin dirección' }}</span>
          </div>
          <ng-icon name="lucideChevronsUpDown" class="ml-auto" />
        </button>

        <z-dropdown-menu-content
          #teamMenu="zDropdownMenuContent"
          class="w-(--z-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          [zSide]="menuSide()"
          zAlign="start"
        >
          <z-dropdown-menu-label class="text-muted-foreground text-xs">Sucursales</z-dropdown-menu-label>

          @for (team of sucursalService.sucursales(); track team.id; let index = $index) {
            <z-dropdown-menu-item class="gap-2 p-2" (click)="sucursalService.setSucursalActiva(team.id)">
              <div class="flex size-6 items-center justify-center rounded-md border">
                <ng-icon name="lucideStore" class="size-3.5 shrink-0" />
              </div>
              {{ team.nombre }}
              <z-dropdown-menu-shortcut>⌘{{ index + 1 }}</z-dropdown-menu-shortcut>
            </z-dropdown-menu-item>
          }

          <z-dropdown-menu-separator />

          <z-dropdown-menu-item class="gap-2 p-2">
            <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
              <ng-icon name="lucidePlus" class="size-4" />
            </div>
            <div class="text-muted-foreground font-medium">Añadir Sucursal</div>
          </z-dropdown-menu-item>
        </z-dropdown-menu-content>
      </li>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSwitcherComponent {
  private readonly sidebar = inject(ZardSidebarService);
  protected readonly sucursalService = inject(SucursalService);
  protected readonly menuSide = computed<ZardDropdownSide>(() => (this.sidebar.isMobile() ? 'bottom' : 'right'));
}
