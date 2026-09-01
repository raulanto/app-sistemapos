import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAudioWaveform,
  lucideChevronsUpDown,
  lucideCommand,
  lucideGalleryVerticalEnd,
  lucidePlus,
} from '@ng-icons/lucide';

import type { ZardDropdownSide } from '../../../shared/components/dropdown/dropdown-positions';
import { ZardDropdownImports } from '../../../shared/components/dropdown/dropdown.imports';
import { ZardSidebarImports } from '../../../shared/components/sidebar/sidebar.imports';
import { ZardSidebarService } from '../../../shared/components/sidebar/sidebar.service';

export interface Sidebar07Team {
  readonly name: string;
  readonly logo: string;
  readonly plan: string;
}

@Component({
  selector: 'lib-sidebar-07-team-switcher',
  standalone: true,
  imports: [...ZardSidebarImports, ...ZardDropdownImports, NgIcon],
  viewProviders: [
    provideIcons({ lucideAudioWaveform, lucideChevronsUpDown, lucideCommand, lucideGalleryVerticalEnd, lucidePlus }),
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
            <ng-icon [name]="activeTeam()?.logo ?? ''" class="size-4" />
          </div>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{{ activeTeam()?.name }}</span>
            <span class="truncate text-xs">{{ activeTeam()?.plan }}</span>
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

          @for (team of teams(); track team.name; let index = $index) {
            <z-dropdown-menu-item class="gap-2 p-2" (click)="selectedTeam.set(team)">
              <div class="flex size-6 items-center justify-center rounded-md border">
                <ng-icon [name]="team.logo" class="size-3.5 shrink-0" />
              </div>
              {{ team.name }}
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
  protected readonly menuSide = computed<ZardDropdownSide>(() => (this.sidebar.isMobile() ? 'bottom' : 'right'));

  readonly teams = input<readonly Sidebar07Team[]>([]);
  protected readonly selectedTeam = signal<Sidebar07Team | null>(null);

  protected activeTeam(): Sidebar07Team | undefined {
    return this.selectedTeam() ?? this.teams()[0];
  }
}
