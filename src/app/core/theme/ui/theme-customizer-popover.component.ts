import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucidePalette,
  lucideSun,
  lucideMoon,
  lucideMonitor,
} from '@ng-icons/lucide';
import { ThemeService } from '../theme.service';
import { ThemeCustomizerComponent } from './theme-customizer.component';
import { ZardPopoverImports } from '../../../shared/components/popover/popover.imports';

@Component({
  selector: 'app-theme-customizer-popover',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    ...ZardPopoverImports,
    ThemeCustomizerComponent,
  ],
  providers: [
    provideIcons({
      lucidePalette,
      lucideSun,
      lucideMoon,
      lucideMonitor,
    }),
  ],
  template: `
    <button
      type="button"
      zPopover
      [zContent]="popoverTpl"
      zPlacement="bottom"
      zAlign="end"
      class="relative flex items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group"
      title="Personalizar tema y colores"
      aria-label="Personalizar tema y colores"
    >
      <!-- Icono dinámico según el modo -->
      @if (themeService.mode() === 'light') {
        <ng-icon name="lucideSun" class="size-4 transition-transform group-hover:scale-110" />
      } @else if (themeService.mode() === 'dark') {
        <ng-icon name="lucideMoon" class="size-4 transition-transform group-hover:scale-110" />
      } @else {
        <ng-icon name="lucidePalette" class="size-4 transition-transform group-hover:scale-110" />
      }

      <!-- Indicador visual del color de acento actual -->
      <span
        class="absolute bottom-1 right-1 size-2 rounded-full ring-1 ring-background shadow-xs"
        [style.background-color]="themeService.currentColorOption().badgeHex"
      ></span>
    </button>

    <ng-template #popoverTpl>
      <div class="w-80 sm:w-96 p-4 bg-popover text-popover-foreground rounded-lg border border-border shadow-xl">
        <app-theme-customizer />
      </div>
    </ng-template>
  `,
})
export class ThemeCustomizerPopoverComponent {
  readonly themeService = inject(ThemeService);
}
