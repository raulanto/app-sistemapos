import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, min, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX, lucidePlus } from '@ng-icons/lucide';

import { PromocionService } from '../../data-access/promocion.service';
import {
  ActualizarPromocionRequest,
  CrearPromocionRequest,
  DIAS_SEMANA,
  METODOS_PAGO_PROMO,
  ObjetivoRequest,
  PromocionResponse,
  TipoPromocion,
  TIPOS_PROMOCION,
} from '../../data-access/promociones.models';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { ProductoService } from '../../../inventario/data-access/producto.service';
import { CategoriaService } from '../../../inventario/data-access/categoria.service';
import { CategoriaResponse, ProductoResponse } from '../../../inventario/data-access/inventario.models';
import { SucursalService } from '../../../../core/sucursal/sucursal.service';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardSwitchComponent } from '../../../../shared/components/switch/switch.component';

export interface PromocionSheetData {
  promocion?: PromocionResponse;
}

interface Objetivo {
  producto_id: string | null;
  producto_unidad_id: string | null;
  categoria_id: string | null;
  label: string;
}

interface PromocionFormValue {
  nombre: string;
  tipo: TipoPromocion;
  prioridad: number;
  combinable: boolean;
  nxm_lleva: number | null;
  nxm_paga: number | null;
  descuento_pct: number | null;
  precio_fijo: number | null;
  cantidad_minima: number | null;
  tope_descuento: number | null;
  monto_minimo_compra: number | null;
  metodo_pago_requerido: string;
  cliente_segmento: string;
  requiere_cupon: boolean;
  vigente_desde: string;
  vigente_hasta: string;
  hora_desde: string;
  hora_hasta: string;
}

const PROMOCION_FORM_INICIAL: PromocionFormValue = {
  nombre: '',
  tipo: 'nxm',
  prioridad: 100,
  combinable: false,
  nxm_lleva: 2,
  nxm_paga: 1,
  descuento_pct: null,
  precio_fijo: null,
  cantidad_minima: null,
  tope_descuento: null,
  monto_minimo_compra: null,
  metodo_pago_requerido: '',
  cliente_segmento: '',
  requiere_cupon: false,
  vigente_desde: '',
  vigente_hasta: '',
  hora_desde: '',
  hora_hasta: '',
};

@Component({
  selector: 'app-promocion-form-sheet',
  standalone: true,
  imports: [
    FormField,
    NgIconComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardSwitchComponent,
  ],
  viewProviders: [provideIcons({ lucideSearch, lucideX, lucidePlus })],
  templateUrl: './promocion-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'promocionFormSheet',
  host: { style: 'display: contents' },
})
export class PromocionFormSheetComponent implements OnInit {
  private promocionService = inject(PromocionService);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  public sucursalService = inject(SucursalService);

  public sheetData = injectSheetData<PromocionSheetData | undefined>();

  readonly tipos = TIPOS_PROMOCION;
  readonly metodosPago = METODOS_PAGO_PROMO;
  readonly dias = DIAS_SEMANA;
  isEditing = false;

  readonly productos = signal<ProductoResponse[]>([]);
  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly filtro = signal('');
  readonly objetivos = signal<Objetivo[]>([]);
  /** Producto expandido en el buscador para elegir base o presentación. */
  readonly expandido = signal<string | null>(null);

  /** Bitmask de días activos (0 = todos). Se edita con los toggles. */
  readonly diasBits = signal(0);
  private diasDirty = false;
  /** Ids de sucursal seleccionadas (vacío = todas). */
  readonly sucursalesSel = signal<Set<string>>(new Set());
  private sucursalesDirty = false;

  private readonly model = signal<PromocionFormValue>({ ...PROMOCION_FORM_INICIAL });

  protected readonly promForm = form(this.model, path => {
    required(path.nombre, { message: 'El nombre es obligatorio y único.' });
    maxLength(path.nombre, 100, { message: 'Máximo 100 caracteres.' });
    required(path.tipo, { message: 'Selecciona el tipo de promoción.' });
    required(path.prioridad, { message: 'La prioridad es obligatoria.' });
    min(path.prioridad, 0, { message: 'No puede ser negativa.' });
  });

  readonly tipoSel = computed(() => this.model().tipo);

  readonly productosFiltrados = computed(() => {
    const t = this.filtro().trim().toLowerCase();
    if (!t) return this.productos().slice(0, 20);
    return this.productos()
      .filter(p => p.nombre.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t))
      .slice(0, 20);
  });

  /** Sólo una de las dos horas cargada: hay que completar o vaciar ambas. */
  readonly horarioIncompleto = computed(() => {
    const d = !!this.model().hora_desde?.trim();
    const h = !!this.model().hora_hasta?.trim();
    return d !== h;
  });

  ngOnInit() {
    this.productoService
      .listar({ activo: true, page_size: 100, sort: 'nombre:asc', include: ['unidades'] })
      .subscribe({
        next: res => {
          this.productos.set(res.data);
          if (this.sheetData?.promocion) this.hidratarObjetivos(this.sheetData.promocion.objetivos);
        },
        error: err => console.error('Error al cargar productos', err),
      });
    this.categoriaService.listar().subscribe({
      next: cs => {
        this.categorias.set(cs.filter(c => c.activo));
        if (this.sheetData?.promocion) this.hidratarObjetivos(this.sheetData.promocion.objetivos);
      },
      error: err => console.error('Error al cargar categorías', err),
    });

    const promo = this.sheetData?.promocion;
    this.isEditing = !!promo;
    if (!promo) return;

    this.diasBits.set(promo.dias_semana ?? 0);
    this.sucursalesSel.set(
      new Set((promo.sucursales ?? []).map((s: any) => (typeof s === 'string' ? s : s?.id)).filter(Boolean)),
    );
    this.model.set({
      nombre: promo.nombre,
      tipo: promo.tipo,
      prioridad: promo.prioridad,
      combinable: promo.combinable,
      nxm_lleva: promo.nxm_lleva,
      nxm_paga: promo.nxm_paga,
      descuento_pct: promo.descuento_pct != null ? Number(promo.descuento_pct) : null,
      precio_fijo: promo.precio_fijo != null ? Number(promo.precio_fijo) : null,
      cantidad_minima: promo.cantidad_minima != null ? Number(promo.cantidad_minima) : null,
      tope_descuento: promo.tope_descuento != null ? Number(promo.tope_descuento) : null,
      monto_minimo_compra: promo.monto_minimo_compra != null ? Number(promo.monto_minimo_compra) : null,
      metodo_pago_requerido: promo.metodo_pago_requerido ?? '',
      cliente_segmento: promo.cliente_segmento ?? '',
      requiere_cupon: promo.requiere_cupon,
      vigente_desde: (promo.vigente_desde ?? '').slice(0, 16),
      vigente_hasta: (promo.vigente_hasta ?? '').slice(0, 16),
      hora_desde: (promo.hora_desde ?? '').slice(0, 5),
      hora_hasta: (promo.hora_hasta ?? '').slice(0, 5),
    });
  }

  // --- Días de la semana (bitmask) ---
  diaActivo(bit: number) {
    return (this.diasBits() & bit) !== 0;
  }
  toggleDia(bit: number) {
    this.diasBits.update(b => b ^ bit);
    this.diasDirty = true;
  }

  // --- Sucursales ---
  sucursalActiva(id: string) {
    return this.sucursalesSel().has(id);
  }
  toggleSucursal(id: string) {
    this.sucursalesSel.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    this.sucursalesDirty = true;
  }

  // --- Objetivos ---
  private hidratarObjetivos(objs: PromocionResponse['objetivos']) {
    this.objetivos.set(
      objs.map(o => ({
        producto_id: o.producto_id,
        producto_unidad_id: o.producto_unidad_id,
        categoria_id: o.categoria_id,
        label: this.labelObjetivo(o.producto_id, o.producto_unidad_id, o.categoria_id),
      })),
    );
  }

  private labelObjetivo(productoId: string | null, unidadId: string | null, categoriaId: string | null): string {
    if (categoriaId) {
      const c = this.categorias().find(x => x.id === categoriaId);
      return c ? `Categoría · ${c.nombre}` : 'Categoría';
    }
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

  yaEsObjetivo(productoId: string | null, unidadId: string | null, categoriaId: string | null): boolean {
    return this.objetivos().some(
      o => o.producto_id === productoId && o.producto_unidad_id === unidadId && o.categoria_id === categoriaId,
    );
  }

  agregarObjetivo(productoId: string | null, unidadId: string | null, categoriaId: string | null = null) {
    if (this.yaEsObjetivo(productoId, unidadId, categoriaId)) return;
    this.objetivos.update(list => [
      ...list,
      {
        producto_id: productoId,
        producto_unidad_id: unidadId,
        categoria_id: categoriaId,
        label: this.labelObjetivo(productoId, unidadId, categoriaId),
      },
    ]);
    this.expandido.set(null);
    this.filtro.set('');
  }

  agregarCategoria(id: string) {
    if (id) this.agregarObjetivo(null, null, id);
  }

  quitarObjetivo(i: number) {
    this.objetivos.update(list => list.filter((_, idx) => idx !== i));
  }

  /** NxM no puede mezclar unidad base y presentación (el backend lo rechaza con 400). */
  readonly nxmMezclaObjetivos = computed(() => {
    if (this.tipoSel() !== 'nxm') return false;
    const objs = this.objetivos();
    return objs.some(o => o.producto_id) && objs.some(o => o.producto_unidad_id);
  });

  private num(v: unknown): number | null {
    return v === '' || v == null ? null : Number(v);
  }
  /** datetime-local (YYYY-MM-DDTHH:mm) → ISO UTC. */
  private toIso(v: string): string | null {
    const t = (v ?? '').trim();
    return t ? new Date(t).toISOString() : null;
  }
  /** `<input type=time>` da "HH:mm"; el backend quiere "HH:mm:ss". */
  private toHora(v: string): string | null {
    const t = (v ?? '').trim();
    if (!t) return null;
    return t.length === 5 ? `${t}:00` : t;
  }

  save(): Observable<PromocionResponse> | void {
    const objetivosReq: ObjetivoRequest[] = this.objetivos().map(o =>
      o.categoria_id
        ? { categoria_id: o.categoria_id }
        : o.producto_unidad_id
          ? { producto_unidad_id: o.producto_unidad_id }
          : { producto_id: o.producto_id },
    );

    const root = this.promForm();
    if (!root.valid() || objetivosReq.length === 0 || this.horarioIncompleto() || this.nxmMezclaObjetivos()) {
      root.markAsTouched();
      return;
    }

    const d = this.model();
    const f = this.promForm;
    const tipo = d.tipo;

    const comun = {
      nombre: d.nombre,
      tipo,
      prioridad: Number(d.prioridad) || 100,
      combinable: !!d.combinable,
      nxm_lleva: tipo === 'nxm' ? this.num(d.nxm_lleva) : null,
      nxm_paga: tipo === 'nxm' ? this.num(d.nxm_paga) : null,
      descuento_pct: tipo === 'porcentaje' ? this.num(d.descuento_pct) : null,
      precio_fijo: tipo === 'precio_fijo' ? this.num(d.precio_fijo) : null,
      cantidad_minima: tipo === 'nxm' ? null : this.num(d.cantidad_minima),
    };

    const dias = this.diasBits() || null;
    const sucursales = [...this.sucursalesSel()];

    if (this.isEditing && this.sheetData?.promocion) {
      const payload: ActualizarPromocionRequest = {
        ...comun,
        objetivos: objetivosReq,
        tope_descuento: this.num(d.tope_descuento),
        monto_minimo_compra: this.num(d.monto_minimo_compra),
        cambiar_topes: f.tope_descuento().dirty() || f.monto_minimo_compra().dirty(),
        metodo_pago_requerido: (d.metodo_pago_requerido || null) as ActualizarPromocionRequest['metodo_pago_requerido'],
        cliente_segmento: d.cliente_segmento?.trim() || null,
        requiere_cupon: !!d.requiere_cupon,
        cambiar_condiciones: f.metodo_pago_requerido().dirty() || f.cliente_segmento().dirty() || f.requiere_cupon().dirty(),
        sucursales,
        cambiar_sucursales: this.sucursalesDirty,
        vigente_desde: this.toIso(d.vigente_desde),
        vigente_hasta: this.toIso(d.vigente_hasta),
        cambiar_vigencia: f.vigente_desde().dirty() || f.vigente_hasta().dirty(),
        hora_desde: this.toHora(d.hora_desde),
        hora_hasta: this.toHora(d.hora_hasta),
        dias_semana: dias,
        cambiar_horario: f.hora_desde().dirty() || f.hora_hasta().dirty() || this.diasDirty,
        cambiar_cantidad_minima: f.cantidad_minima().dirty(),
      };
      return this.promocionService.actualizar(this.sheetData.promocion.id, payload);
    }

    const payload: CrearPromocionRequest = {
      ...comun,
      objetivos: objetivosReq,
      tope_descuento: this.num(d.tope_descuento),
      monto_minimo_compra: this.num(d.monto_minimo_compra),
      metodo_pago_requerido: (d.metodo_pago_requerido || null) as CrearPromocionRequest['metodo_pago_requerido'],
      cliente_segmento: d.cliente_segmento?.trim() || null,
      requiere_cupon: !!d.requiere_cupon,
      sucursales,
      vigente_desde: this.toIso(d.vigente_desde),
      vigente_hasta: this.toIso(d.vigente_hasta),
      hora_desde: this.toHora(d.hora_desde),
      hora_hasta: this.toHora(d.hora_hasta),
      dias_semana: dias,
    };
    return this.promocionService.crear(payload);
  }
}
