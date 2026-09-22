import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideAlertCircle,
  lucideFilter,
  lucideRefreshCw,
  lucideSearch,
  lucideShieldCheck,
  lucideUser,
  lucideLayers,
  lucideClock,
  lucideInfo,
  lucideGlobe,
  lucideTerminal,
  lucideX,
  lucideFileText,
  lucideLock,
} from '@ng-icons/lucide';

import { AuditoriaService } from '../data-access/auditoria.service';
import { AuditoriaLogResponse } from '../data-access/auditoria.models';
import { PaginationMeta } from '@core/api.model';

import { ZardCardImports } from '@/shared/components/card/card.imports';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardSelectImports } from '@/shared/components/select/select.imports';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';

import { ZardButtonComponent } from '@/shared/components/button/button.component';

@Component({
  selector: 'app-auditoria-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    NgIcon,
    ...ZardCardImports,
    ZardBadgeComponent,
    ...ZardTableImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardSkeletonComponent,
    ZardEmptyComponent,
    ZardButtonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideActivity,
      lucideAlertCircle,
      lucideFilter,
      lucideRefreshCw,
      lucideSearch,
      lucideShieldCheck,
      lucideUser,
      lucideLayers,
      lucideClock,
      lucideInfo,
      lucideGlobe,
      lucideTerminal,
      lucideX,
      lucideFileText,
      lucideLock,
    }),
  ],
  templateUrl: './auditoria-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditoriaListComponent implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);

  readonly logs = signal<AuditoriaLogResponse[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly cargando = signal(true);
  readonly logSeleccionado = signal<AuditoriaLogResponse | null>(null);

  readonly q = signal('');
  readonly moduloFiltro = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly modulosDisponibles = [
    { label: 'Todos los módulos', value: '' },
    { label: 'Ventas', value: 'ventas' },
    { label: 'Inventario', value: 'inventario' },
    { label: 'Caja', value: 'caja' },
    { label: 'Clientes', value: 'clientes' },
    { label: 'Usuarios', value: 'usuarios' },
    { label: 'Pedidos', value: 'pedidos' },
    { label: 'Promociones', value: 'promociones' },
    { label: 'Proveedores', value: 'proveedores' },
  ];

  ngOnInit(): void {
    this.cargarLogs();
  }

  cargarLogs(): void {
    this.cargando.set(true);
    this.auditoriaService
      .listar({
        q: this.q() || undefined,
        modulo: this.moduloFiltro() || undefined,
        page: this.page(),
        page_size: this.pageSize(),
        sort: 'fecha:desc',
        include: 'usuario',
      })
      .subscribe({
        next: (res) => {
          this.logs.set(res.data ?? []);
          this.meta.set(res.meta?.pagination ?? null);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error al cargar logs de auditoría:', err);
          this.logs.set([]);
          this.cargando.set(false);
        },
      });
  }

  buscar(val: string): void {
    this.q.set(val);
    this.page.set(1);
    this.cargarLogs();
  }

  filtrarModulo(modulo: string): void {
    this.moduloFiltro.set(modulo);
    this.page.set(1);
    this.cargarLogs();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || (this.meta() && nuevaPagina > this.meta()!.total_pages)) return;
    this.page.set(nuevaPagina);
    this.cargarLogs();
  }

  seleccionarLog(log: AuditoriaLogResponse): void {
    this.logSeleccionado.set(log);
  }

  cerrarDetalles(): void {
    this.logSeleccionado.set(null);
  }

  badgeModulo(modulo: string): 'default' | 'secondary' | 'outline' {
    switch (modulo.toLowerCase()) {
      case 'ventas':
      case 'caja':
        return 'default';
      case 'inventario':
      case 'pedidos':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  claseBadgeAccion(accion: string): string {
    const act = accion.toLowerCase();
    if (act.includes('anula') || act.includes('elimina') || act.includes('desactiva') || act.includes('cancel')) {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    if (act.includes('crea') || act.includes('abierto') || act.includes('activa')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    return 'bg-muted text-foreground border-border';
  }

  formatearDetalles(detalles: Record<string, unknown> | null | undefined): string {
    if (!detalles) return 'Sin detalles adicionales registrados.';
    try {
      return JSON.stringify(detalles, null, 2);
    } catch {
      return String(detalles);
    }
  }
}
