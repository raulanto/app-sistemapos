import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthService } from '@/core/auth/api/auth.service';

import { RangoQuery } from './reporte.models';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Filtros compartidos (fecha + sucursal) entre las vistas de reportes: viven en un servicio
 * `root` para no perderse al navegar entre `/reportes/ventas`, `/reportes/vendedores`, etc.
 */
@Injectable({ providedIn: 'root' })
export class ReporteFiltrosService {
  private readonly authService = inject(AuthService);

  private readonly hace30 = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return isoDate(d);
  })();
  private readonly hoy = isoDate(new Date());

  readonly desde = signal(this.hace30);
  readonly hasta = signal(this.hoy);
  readonly sucursalId = signal('');

  /** Sólo admin/gerente eligen sucursal; al resto el backend le fuerza la propia. */
  readonly esGlobal = computed(() => {
    const codigo = this.authService.currentUser()?.rol?.codigo;
    return codigo === 'admin' || codigo === 'gerente';
  });

  setDesde(v: string) {
    this.desde.set(v);
  }
  setHasta(v: string) {
    this.hasta.set(v);
  }
  setSucursal(v: string) {
    this.sucursalId.set(v);
  }

  sucursalParaQuery(): string | undefined {
    return this.esGlobal() ? this.sucursalId() || undefined : undefined;
  }

  rango(): RangoQuery {
    return {
      desde: this.desde() ? `${this.desde()}T00:00:00` : undefined,
      hasta: this.hasta() ? `${this.hasta()}T23:59:59` : undefined,
      sucursal_id: this.sucursalParaQuery(),
    };
  }
}
