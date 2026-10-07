import { ChangeDetectionStrategy, Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideCheck, lucideCheckCheck, lucideCalendar, lucideInfo } from '@ng-icons/lucide';
import { NotificacionService } from '../services/notificacion.service';
import { Notificacion } from '../models/notificacion.model';
import { ZardPopoverImports } from '@/shared/components/popover/popover.imports';
import { ZardTabsImports } from '@/shared/components/tabs/tabs.imports';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';

@Component({
  selector: 'app-notificaciones-popover',
  imports: [
    CommonModule,
    DatePipe,
    NgIconComponent,
    ...ZardPopoverImports,
    ...ZardTabsImports,
    ZardButtonComponent,
    ZardBadgeComponent,
  ],
  providers: [
    provideIcons({
      lucideBell,
      lucideCheck,
      lucideCheckCheck,
      lucideCalendar,
      lucideInfo,
    }),
  ],
  template: `
    <button
      type="button"
      zPopover
      [zContent]="popoverTpl"
      zPlacement="bottom"
      zAlign="end"
      class="relative flex items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
      title="Notificaciones"
      (click)="abrirPopover()"
    >
      <ng-icon name="lucideBell" class="size-4" />
      @if (unreadCount() > 0) {
        <span class="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
          {{ unreadCount() > 9 ? '9+' : unreadCount() }}
        </span>
      }
    </button>

    <ng-template #popoverTpl>
      <div class="w-80 sm:w-96 p-4 bg-popover text-popover-foreground rounded-lg border shadow-md">
        <div class="flex items-center justify-between pb-3 border-b border-border mb-2">
          <div class="flex items-center gap-2">
            <h4 class="font-semibold text-sm">Notificaciones</h4>
            @if (unreadCount() > 0) {
              <z-badge zType="danger">{{ unreadCount() }} nuevas</z-badge>
            }
          </div>
          @if (unreadCount() > 0) {
            <button
              z-button
              zType="ghost"
              zSize="sm"
              class="h-7 text-xs text-muted-foreground hover:text-foreground"
              (click)="marcarTodasLeidas()"
            >
              <ng-icon name="lucideCheckCheck" class="mr-1 size-3.5" />
              Marcar leídas
            </button>
          }
        </div>

        @if (loading()) {
          <div class="py-8 text-center text-sm text-muted-foreground">
            Cargando notificaciones...
          </div>
        } @else {
          <z-tab-group class="w-full mt-2">
            <z-tab label="Nuevas">
              @if (nuevas().length === 0) {
                <div class="py-8 text-center text-sm text-muted-foreground">
                  <ng-icon name="lucideBell" class="size-8 mx-auto mb-2 opacity-40" />
                  No tienes notificaciones nuevas.
                </div>
              } @else {
                <div class="max-h-80 overflow-y-auto space-y-1 pr-1 mt-3">
                  @for (item of nuevas(); track item.id) {
                    <ng-container *ngTemplateOutlet="notifItem; context: { item: item }" />
                  }
                </div>
              }
            </z-tab>
            <z-tab label="Leídas">
              @if (leidas().length === 0) {
                <div class="py-8 text-center text-sm text-muted-foreground">
                  <ng-icon name="lucideCheck" class="size-8 mx-auto mb-2 opacity-40" />
                  No tienes notificaciones leídas recientes.
                </div>
              } @else {
                <div class="max-h-80 overflow-y-auto space-y-1 pr-1 mt-3">
                  @for (item of leidas(); track item.id) {
                    <ng-container *ngTemplateOutlet="notifItem; context: { item: item }" />
                  }
                </div>
              }
            </z-tab>
          </z-tab-group>
        }
      </div>
    </ng-template>

    <ng-template #notifItem let-item="item">
      <div
        class="p-2.5 rounded-lg text-xs transition-colors cursor-pointer border border-transparent hover:bg-accent/60"
        [class.bg-muted/40]="!item.leida"
        [class.font-medium]="!item.leida"
        (click)="clickNotificacion(item)"
      >
        <div class="flex items-start justify-between gap-2 mb-1">
          <span class="font-semibold text-foreground flex items-center gap-1">
            @if (!item.leida) {
              <span class="size-2 rounded-full bg-primary inline-block"></span>
            }
            {{ item.titulo }}
          </span>
          <span class="text-[10px] text-muted-foreground whitespace-nowrap">
            {{ item.created_at | date:'shortTime' }}
          </span>
        </div>
        <p class="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
          {{ item.mensaje }}
        </p>
      </div>
    </ng-template>
  `,
})
export class NotificacionesPopoverComponent implements OnInit {
  private notifService = inject(NotificacionService);
  private router = inject(Router);

  readonly unreadCount = this.notifService.unreadCount;
  readonly notificaciones = this.notifService.notificaciones;
  readonly loading = this.notifService.loading;

  readonly nuevas = computed(() => this.notificaciones().filter(n => !n.leida));
  readonly leidas = computed(() => this.notificaciones().filter(n => n.leida));

  ngOnInit(): void {
    this.notifService.cargarResumen().subscribe();
    this.notifService.cargarNotificaciones().subscribe();
  }

  abrirPopover(): void {
    // La carga inicial ya se hace en ngOnInit,
    // y los deltas se mantienen por WebSocket.
  }

  marcarTodasLeidas(): void {
    this.notifService.marcarTodasComoLeidas().subscribe();
  }

  clickNotificacion(item: Notificacion): void {
    if (!item.leida) {
      this.notifService.marcarComoLeida(item.id).subscribe();
    }
    if (item.modulo === 'agenda' && item.entidad_id) {
      this.router.navigate(['/agenda', item.entidad_id]);
    }
  }
}
