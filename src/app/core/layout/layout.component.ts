import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZardSidebarImports } from '../../shared/components/sidebar/sidebar.imports';
import { AppSidebarComponent } from './app-sidebar/app-sidebar.component';
import { AppHeaderComponent } from './app-header/app-header.component';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    ...ZardSidebarImports,
    AppSidebarComponent,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <z-sidebar-provider>
      <app-sidebar></app-sidebar>
      <z-sidebar-inset class="flex flex-col flex-1 w-full min-h-screen relative">
        <app-header></app-header>
        <main class="flex-1 w-full p-4 md:p-6 bg-muted/20 relative">
          <router-outlet></router-outlet>
        </main>
      </z-sidebar-inset>
    </z-sidebar-provider>
  `
})
export class LayoutComponent {}
