import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTicket, lucideBan, lucidePlus } from '@ng-icons/lucide';

import { PromocionService } from '../../data-access/promocion.service';
import { CuponResponse, PromocionResponse } from '../../data-access/promociones.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../../shared/components/sonner/sonner.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';

export interface CuponSheetData {
  promocion: PromocionResponse;
}

@Component({
  selector: 'app-cupon-sheet',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    NgIconComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardEmptyComponent,
  ],
  viewProviders: [provideIcons({ lucideTicket, lucideBan, lucidePlus })],
  templateUrl: './cupon-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class CuponSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private promocionService = inject(PromocionService);
  private sonner = inject(ZardSonnerService);

  readonly data = injectSheetData<CuponSheetData>();

  readonly cupones = signal<CuponResponse[]>([]);
  readonly loading = signal(true);
  readonly guardando = signal(false);

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    vigente_desde: [''],
    vigente_hasta: [''],
    max_usos_total: [null as number | null],
    max_usos_por_persona: [null as number | null],
  });

  ngOnInit() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.promocionService.listarCupones(this.data.promocion.id).subscribe({
      next: cs => {
        this.cupones.set(cs);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar cupones', err);
        this.loading.set(false);
      },
    });
  }

  private toIso(v: string): string | null {
    const t = (v ?? '').trim();
    return t ? new Date(t).toISOString() : null;
  }
  private num(v: unknown): number | null {
    return v === '' || v == null ? null : Number(v);
  }

  crear() {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    const d = this.form.getRawValue();
    this.guardando.set(true);
    this.promocionService
      .crearCupon(this.data.promocion.id, {
        codigo: d.codigo!.trim(),
        vigente_desde: this.toIso(d.vigente_desde!),
        vigente_hasta: this.toIso(d.vigente_hasta!),
        max_usos_total: this.num(d.max_usos_total),
        max_usos_por_persona: this.num(d.max_usos_por_persona),
      })
      .subscribe({
        next: () => {
          this.sonner.success('Cupón creado');
          this.form.reset({ codigo: '', vigente_desde: '', vigente_hasta: '', max_usos_total: null, max_usos_por_persona: null });
          this.guardando.set(false);
          this.cargar();
        },
        error: err => {
          this.sonner.error(err?.error?.error?.message ?? 'No se pudo crear el cupón');
          this.guardando.set(false);
        },
      });
  }

  desactivar(c: CuponResponse) {
    this.promocionService.desactivarCupon(c.codigo).subscribe({
      next: () => {
        this.sonner.success('Cupón desactivado');
        this.cargar();
      },
      error: err => this.sonner.error(err?.error?.error?.message ?? 'No se pudo desactivar'),
    });
  }
}
