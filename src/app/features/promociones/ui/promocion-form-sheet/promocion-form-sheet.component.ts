import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX, lucidePlus } from '@ng-icons/lucide';

import { PromocionService } from '../../data-access/promocion.service';
import {
  ActualizarPromocionRequest,
  CrearPromocionRequest,
  ObjetivoRequest,
  PromocionResponse,
  TipoPromocion,
  TIPOS_PROMOCION,
} from '../../data-access/promociones.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ProductoService } from '../../../inventario/data-access/producto.service';
import { ProductoResponse } from '../../../inventario/data-access/inventario.models';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';

export interface PromocionSheetData {
  promocion?: PromocionResponse;
}

interface Objetivo {
  producto_id: string | null;
  producto_unidad_id: string | null;
  label: string;
}

@Component({
  selector: 'app-promocion-form-sheet',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardBadgeComponent,
  ],
  viewProviders: [provideIcons({ lucideSearch, lucideX, lucidePlus })],
  templateUrl: './promocion-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'promocionFormSheet',
  host: { style: 'display: contents' },
})
export class PromocionFormSheetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private promocionService = inject(PromocionService);
  private productoService = inject(ProductoService);
  public sucursalService = inject(SucursalService);

  public sheetData = injectSheetData<PromocionSheetData | undefined>();

  readonly tipos = TIPOS_PROMOCION;
  isEditing = false;

  readonly productos = signal<ProductoResponse[]>([]);
  readonly filtro = signal('');
  readonly objetivos = signal<Objetivo[]>([]);
  /** Producto expandido en el buscador para elegir base o presentación. */
  readonly expandido = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['nxm' as TipoPromocion, Validators.required],
    prioridad: [100, [Validators.required, Validators.min(0)]],
    sucursal_id: [''],
    vigente_desde: [''],
    vigente_hasta: [''],
    nxm_lleva: [2 as number | null],
    nxm_paga: [1 as number | null],
    descuento_pct: [null as number | null],
    precio_fijo: [null as number | null],
    cantidad_minima: [null as number | null],
  });

  readonly tipoSel = signal<TipoPromocion>('nxm');

  readonly productosFiltrados = computed(() => {
    const t = this.filtro().trim().toLowerCase();
    if (!t) return this.productos().slice(0, 20);
    return this.productos()
      .filter(p => p.nombre.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t))
      .slice(0, 20);
  });

  ngOnInit() {
    this.productoService.listar({ activo: true, page_size: 100, sort: 'nombre:asc', include: ['unidades'] }).subscribe({
      next: res => {
        this.productos.set(res.data);
        // Resolver labels de objetivos ya cargados (edición) ahora que hay catálogo.
        if (this.sheetData?.promocion) this.hidratarObjetivos(this.sheetData.promocion.objetivos);
      },
      error: err => console.error('Error al cargar productos', err),
    });

    const promo = this.sheetData?.promocion;
    this.isEditing = !!promo;
    if (!promo) return;

    this.tipoSel.set(promo.tipo);
    this.form.patchValue({
      nombre: promo.nombre,
      tipo: promo.tipo,
      prioridad: promo.prioridad,
      sucursal_id: promo.sucursal_id ?? '',
      vigente_desde: (promo.vigente_desde ?? '').slice(0, 16),
      vigente_hasta: (promo.vigente_hasta ?? '').slice(0, 16),
      nxm_lleva: promo.nxm_lleva,
      nxm_paga: promo.nxm_paga,
      descuento_pct: promo.descuento_pct != null ? Number(promo.descuento_pct) : null,
      precio_fijo: promo.precio_fijo != null ? Number(promo.precio_fijo) : null,
      cantidad_minima: promo.cantidad_minima != null ? Number(promo.cantidad_minima) : null,
    });
  }

  constructor() {
    this.form.controls.tipo.valueChanges.subscribe(v => this.tipoSel.set((v as TipoPromocion) ?? 'nxm'));
  }

  private hidratarObjetivos(objs: { producto_id: string | null; producto_unidad_id: string | null }[]) {
    this.objetivos.set(objs.map(o => ({ ...o, label: this.labelObjetivo(o.producto_id, o.producto_unidad_id) })));
  }

  private labelObjetivo(productoId: string | null, unidadId: string | null): string {
    if (unidadId) {
      for (const p of this.productos()) {
        const u = (p.unidades ?? []).find(x => x.id === unidadId);
        if (u) return `${p.nombre} · ${u.nombre}`;
      }
      return 'Presentación';
    }
    const p = this.productos().find(x => x.id === productoId);
    return p ? `${p.nombre} (unidad base)` : 'Producto';
  }

  toggleExpandido(id: string) {
    this.expandido.set(this.expandido() === id ? null : id);
  }

  yaEsObjetivo(productoId: string | null, unidadId: string | null): boolean {
    return this.objetivos().some(o => o.producto_id === productoId && o.producto_unidad_id === unidadId);
  }

  agregarObjetivo(productoId: string | null, unidadId: string | null) {
    if (this.yaEsObjetivo(productoId, unidadId)) return;
    this.objetivos.update(list => [
      ...list,
      { producto_id: productoId, producto_unidad_id: unidadId, label: this.labelObjetivo(productoId, unidadId) },
    ]);
    this.expandido.set(null);
    this.filtro.set('');
  }

  quitarObjetivo(i: number) {
    this.objetivos.update(list => list.filter((_, idx) => idx !== i));
  }

  private num(v: unknown): number | null {
    return v === '' || v == null ? null : Number(v);
  }
  /** datetime-local (YYYY-MM-DDTHH:mm) → ISO UTC. */
  private toIso(v: string): string | null {
    const t = (v ?? '').trim();
    return t ? new Date(t).toISOString() : null;
  }

  save(): Observable<PromocionResponse> | void {
    const objetivosReq: ObjetivoRequest[] = this.objetivos().map(o =>
      o.producto_unidad_id ? { producto_unidad_id: o.producto_unidad_id } : { producto_id: o.producto_id },
    );

    if (this.form.invalid || objetivosReq.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const d = this.form.getRawValue();
    const tipo = d.tipo as TipoPromocion;

    const comun = {
      nombre: d.nombre!,
      tipo,
      prioridad: Number(d.prioridad) || 100,
      nxm_lleva: tipo === 'nxm' ? this.num(d.nxm_lleva) : null,
      nxm_paga: tipo === 'nxm' ? this.num(d.nxm_paga) : null,
      descuento_pct: tipo === 'porcentaje' ? this.num(d.descuento_pct) : null,
      precio_fijo: tipo === 'precio_fijo' ? this.num(d.precio_fijo) : null,
      cantidad_minima: tipo === 'nxm' ? null : this.num(d.cantidad_minima),
    };

    if (this.isEditing && this.sheetData?.promocion) {
      const payload: ActualizarPromocionRequest = {
        ...comun,
        objetivos: objetivosReq,
        sucursal_id: d.sucursal_id || null,
        cambiar_sucursal: this.form.controls.sucursal_id.dirty,
        vigente_desde: this.toIso(d.vigente_desde!),
        vigente_hasta: this.toIso(d.vigente_hasta!),
        cambiar_vigencia: this.form.controls.vigente_desde.dirty || this.form.controls.vigente_hasta.dirty,
        cambiar_cantidad_minima: this.form.controls.cantidad_minima.dirty,
      };
      return this.promocionService.actualizar(this.sheetData.promocion.id, payload);
    }

    const payload: CrearPromocionRequest = {
      ...comun,
      objetivos: objetivosReq,
      sucursal_id: d.sucursal_id || null,
      vigente_desde: this.toIso(d.vigente_desde!),
      vigente_hasta: this.toIso(d.vigente_hasta!),
    };
    return this.promocionService.crear(payload);
  }
}
