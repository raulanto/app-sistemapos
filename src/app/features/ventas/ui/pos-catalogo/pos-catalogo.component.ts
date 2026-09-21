import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideLayers,
  lucideLayoutGrid,
  lucideList,
  lucidePackage,
  lucidePlus,
  lucideScanBarcode,
  lucideSearch,
} from '@ng-icons/lucide';

import { CategoriaService } from '../../../inventario/data-access/services/categoria.service';
import { ProductoService } from '../../../inventario/data-access/producto.service';
import {
  CategoriaResponse,
  ProductoResponse,
  UnidadResponse,
} from '../../../inventario/data-access/inventario.models';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { ZardSonnerService } from '../../../../shared/components/sonner/sonner.service';

interface ItemCatalogo {
  key: string;
  producto: ProductoResponse;
  unidad: UnidadResponse | null;
}

@Component({
  selector: 'app-pos-catalogo',
  standalone: true,
  imports: [
    CurrencyPipe,
    TitleCasePipe,
    FormsModule,
    NgIconComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardEmptyComponent,
    ZardInputComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideLayers,
      lucideLayoutGrid,
      lucideList,
      lucidePackage,
      lucidePlus,
      lucideScanBarcode,
      lucideSearch,
    }),
  ],
  templateUrl: './pos-catalogo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class PosCatalogoComponent {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private sonner = inject(ZardSonnerService);

  /** Sucursal del turno activo; el catálogo se recarga cuando cambia. */
  readonly sucursalId = input<string | null>(null);
  /** Se incrementa desde el padre (p. ej. tras cobrar) para forzar una recarga. */
  readonly refrescarTick = input(0);

  readonly agregar = output<{ producto: ProductoResponse; unidad: UnidadResponse | null }>();

  readonly productos = signal<ProductoResponse[]>([]);
  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly categoriaSel = signal<string | null>(null);
  readonly cargandoCatalogo = signal(false);
  readonly q = signal('');
  readonly codigo = signal('');
  /** Disposición del catálogo: tarjetas (grid) o filas (lista). Se recuerda en localStorage. */
  readonly vista = signal<'grid' | 'lista'>(this.leerVista());
  /** ids de productos cuya imagen falló al cargar. */
  readonly imgRoto = signal<Set<string>>(new Set());

  readonly productosFiltrados = computed(() => {
    const t = this.q().trim().toLowerCase();
    const cat = this.categoriaSel();
    return this.productos().filter((p) => {
      if (cat && p.categoria_id !== cat) return false;
      if (!t) return true;
      return (
        p.nombre.toLowerCase().includes(t) ||
        p.sku.toLowerCase().includes(t) ||
        (p.codigo_barras ?? '').toLowerCase().includes(t)
      );
    });
  });

  /**
   * Catálogo agrupado por categoría (bloques). Cada presentación (unidad base +
   * cada unidad activa) es su propia tarjeta; "Sin categoría" al final.
   */
  readonly bloques = computed(() => {
    const nombrePorId = new Map(this.categorias().map((c) => [c.id, c.nombre]));
    const grupos = new Map<string, ItemCatalogo[]>();
    for (const p of this.productosFiltrados()) {
      const k = p.categoria_id ?? '';
      let lista = grupos.get(k);
      if (!lista) {
        lista = [];
        grupos.set(k, lista);
      }
      lista.push({ key: `${p.id}:base`, producto: p, unidad: null });
      for (const u of p.unidades ?? []) {
        if (u.activo) lista.push({ key: `${p.id}:${u.id}`, producto: p, unidad: u });
      }
    }
    return [...grupos.entries()]
      .map(([id, items]) => ({
        id: id || null,
        nombre: nombrePorId.get(id) ?? 'Sin categoría',
        items,
        count: new Set(items.map((i) => i.producto.id)).size,
      }))
      .sort((a, b) =>
        a.nombre === 'Sin categoría'
          ? 1
          : b.nombre === 'Sin categoría'
            ? -1
            : a.nombre.localeCompare(b.nombre),
      );
  });

  /** Chips: categorías que tienen al menos un producto en el catálogo. */
  readonly categoriasConProductos = computed(() => {
    const conProd = new Set(this.productos().map((p) => p.categoria_id));
    return this.categorias()
      .filter((c) => conProd.has(c.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  constructor() {
    // Recarga cada vez que cambia la sucursal del turno o el padre pide refrescar.
    effect(() => {
      this.sucursalId();
      this.refrescarTick();
      untracked(() => this.recargar());
    });
  }

  recargar() {
    // Catálogo acotado a la sucursal del turno: sólo productos con existencia ahí,
    // con su stock embebido (preset POS de la guía de ventas §2.0).
    const suc = this.sucursalId();
    this.cargandoCatalogo.set(true);
    this.productoService
      .listar({
        activo: true,
        page_size: 100,
        sort: 'nombre:asc',
        ...(suc ? { sucursal_id: [suc] } : {}),
        include: ['unidades', 'existencias'],
      })
      .subscribe({
        next: (res) => {
          this.productos.set(res.data);
          this.imgRoto.set(new Set());
          this.cargandoCatalogo.set(false);
        },
        error: (err) => {
          console.error('Error al cargar el catálogo', err);
          this.cargandoCatalogo.set(false);
        },
      });
    if (this.categorias().length === 0) {
      this.categoriaService.listar().subscribe({
        next: (cs) => this.categorias.set(cs.filter((c) => c.activo)),
        error: (err) => console.error('Error al cargar categorías', err),
      });
    }
  }

  seleccionarCategoria(id: string | null) {
    this.categoriaSel.set(this.categoriaSel() === id ? null : id);
  }

  /**
   * Foto de la tarjeta: portada de la presentación; si no tiene (o su URL falla), cae
   * a la del producto; si esa también falla, al icono. Prefiere la original sobre el
   * thumbnail (la miniatura la genera una Lambda que puede no existir y dar 404).
   */
  imgSrc(it: ItemCatalogo): string | null {
    const roto = this.imgRoto();
    const candidatos = [
      it.unidad?.imagen_principal?.url,
      it.unidad?.imagen_principal?.thumbnail_url,
      it.producto.imagen_principal?.url,
      it.producto.imagen_principal?.thumbnail_url,
    ];
    return candidatos.find((u): u is string => !!u && !roto.has(u)) ?? null;
  }
  /** La imagen `src` no cargó: se descarta y la tarjeta prueba el siguiente candidato. */
  marcarImgRota(src: string | null) {
    if (src) this.imgRoto.update((s) => new Set(s).add(src));
  }

  private leerVista(): 'grid' | 'lista' {
    try {
      return localStorage.getItem('pos-vista') === 'lista' ? 'lista' : 'grid';
    } catch {
      return 'grid';
    }
  }
  setVista(v: 'grid' | 'lista') {
    this.vista.set(v);
    try {
      localStorage.setItem('pos-vista', v);
    } catch {
      /* almacenamiento no disponible: la vista sólo dura la sesión */
    }
  }

  /**
   * Stock de la tarjeta en su propia unidad: unidad base para el producto,
   * `base / factor` (piezas enteras) para una presentación. `null` = no lleva
   * inventario (servicio, sobre pedido, kit).
   */
  stockDe(it: ItemCatalogo): number | null {
    const base = Number(it.producto.existencias?.[0]?.cantidad);
    if (!Number.isFinite(base)) return null;
    if (!it.unidad) return base;
    const f = Number(it.unidad.factor) || 1;
    return f > 0 ? Math.floor(base / f) : base;
  }

  escanear() {
    const cod = this.codigo().trim();
    if (!cod) return;
    this.productoService.resolverCodigo(cod).subscribe({
      next: (r) => {
        const prod = this.productos().find((p) => p.id === r.producto_id);
        if (!prod) {
          this.sonner.error('El código resolvió a un producto que no está en el catálogo cargado');
          return;
        }
        const uni = r.unidad_id
          ? ((prod.unidades ?? []).find((x) => x.id === r.unidad_id) ?? null)
          : null;
        this.agregar.emit({ producto: prod, unidad: uni });
        this.codigo.set('');
      },
      error: () => this.sonner.error('Código no encontrado'),
    });
  }
}
