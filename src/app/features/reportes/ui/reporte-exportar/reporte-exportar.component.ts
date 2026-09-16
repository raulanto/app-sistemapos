import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideDownload } from '@ng-icons/lucide';

import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardSonnerService } from '@/shared/components/sonner/sonner.service';

import { FormatoExport } from '../../data-access/reporte.models';
import { ReporteService } from '../../data-access/reporte.service';

/** Botones de exportación (CSV/Excel/PDF) para un reporte — se ocultan solos sin `reportes.exportar`. */
@Component({
  selector: 'app-reporte-exportar',
  standalone: true,
  imports: [NgIcon, ZardButtonComponent],
  viewProviders: [provideIcons({ lucideDownload })],
  templateUrl: './reporte-exportar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteExportarComponent {
  private readonly reporteService = inject(ReporteService);
  private readonly authService = inject(AuthService);
  private readonly sonner = inject(ZardSonnerService);

  /** Ruta relativa a `/reportes`, ej. "ventas" o "corte-caja/<uuid>". */
  readonly path = input.required<string>();
  /** Los mismos query params que la vista JSON ya está usando (sin `page`/`formato`). */
  readonly query = input<object>({});
  readonly disabled = input(false);

  readonly puedeExportar = computed(() => this.authService.hasPermission(...PERMISOS.reportes.exportar));
  readonly exportando = signal<FormatoExport | null>(null);

  exportar(formato: FormatoExport) {
    if (this.disabled() || this.exportando()) return;
    this.exportando.set(formato);
    this.reporteService.exportar(this.path(), this.query(), formato).subscribe({
      next: res => this.descargar(res.body!, res.headers.get('Content-Disposition'), formato),
      error: () => {
        this.exportando.set(null);
        this.sonner.error('No se pudo exportar el reporte');
      },
    });
  }

  private descargar(blob: Blob, contentDisposition: string | null, formato: FormatoExport) {
    this.exportando.set(null);
    const extension = formato === 'excel' ? 'xlsx' : formato;
    // `Content-Disposition` no siempre llega expuesto en CORS (falta Access-Control-Expose-Headers
    // del lado del backend) — el nombre de la ruta es un fallback igual de bueno que el real.
    const base = this.path().split('/')[0];
    const nombre = /filename="?([^";]+)"?/.exec(contentDisposition ?? '')?.[1] ?? `${base}.${extension}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
