import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideLayers,
  lucideLayoutGrid,
  lucideList,
  lucideMapPin,
  lucideMinus,
  lucidePackage,
  lucidePlus,
  lucideReceiptText,
  lucideSearch,
  lucideShoppingCart,
  lucideStickyNote,
  lucideTag,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';

import { PedidoService } from '../data-access/pedido.service';
import {
  ActualizarPedidoRequest,
  CANALES_PEDIDO,
  CanalPedido,
  CrearPedidoRequest,
  LineaPedidoRequest,
  mensajePedidoError,
  PedidoResponse,
  TIPOS_PEDIDO,
  TipoPedido,
} from '../data-access/pedidos.models';
import { ProductoService } from '../../inventario/data-access/producto.service';
import { CategoriaService } from '../../inventario/data-access/categoria.service';
import {
  CategoriaResponse,
  ProductoResponse,
  UnidadResponse,
} from '../../inventario/data-access/inventario.models';
import { VentaService } from '../../ventas/data-access/venta.service';
import { CotizacionVentaResponse } from '../../ventas/data-access/ventas.models';
import { UsuarioAdminService } from '../../usuarios/data-access/usuario-admin.service';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardTextareaComponent } from '../../../shared/components/textarea/textarea.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';

interface LineaCarrito {
  key: string;
  producto: ProductoResponse;
  unidad: UnidadResponse | null;
  cantidad: number;
  precio_unitario: number;
  descuento_linea: number;
  /** Producto de tipo `servicio` (envío, instalación…): necesita responsable para confirmar. */
  esServicio: boolean;
  asignadoA: string | null;
}

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [
    CurrencyPipe,
    TitleCasePipe,
    FormsModule,
    RouterLink,
    NgIconComponent,
    ...ZardSelectImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardInputComponent,
    ZardTextareaComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideLayers,
      lucideLayoutGrid,
      lucideList,
      lucideMapPin,
      lucideMinus,
      lucidePackage,
      lucidePlus,
      lucideReceiptText,
      lucideSearch,
      lucideShoppingCart,
      lucideStickyNote,
      lucideTag,
      lucideTrash2,
      lucideX,
    }),
  ],
  templateUrl: './pedido-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pedidoService = inject(PedidoService);
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private ventaService = inject(VentaService);
  private usuarioService = inject(UsuarioAdminService);
  private sonner = inject(ZardSonnerService);
  private authService = inject(AuthService);

  readonly canDescuentoManual = computed(() => this.authService.hasPermission(...PERMISOS.ventas.descuentoManual));

  readonly tipos = TIPOS_PEDIDO;
  readonly canales = CANALES_PEDIDO;

  /** id del pedido cuando estamos editando (`/pedidos/:id/editar`). */
  readonly pedidoId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly esEdicion = computed(() => !!this.pedidoId());
  readonly cargando = signal(this.esEdicion());
  readonly guardando = signal(false);

  // --- Datos del pedido ---
  readonly tipo = signal<TipoPedido>('mostrador');
  readonly canal = signal<CanalPedido>('pos');
  readonly telefono = signal('');
  readonly notas = signal('');
  readonly codigoCupon = signal('');
  readonly descuentoTotal = signal(0);
  readonly motivoDescuento = signal('');
  readonly direccionTexto = signal('');
  readonly referenciaDireccion = signal('');
  readonly fechaPromesa = signal('');

  // --- Catálogo (se carga una vez y se filtra en memoria, como la tienda) ---
  readonly productos = signal<ProductoResponse[]>([]);
  readonly categorias = signal<CategoriaResponse[]>([]);
  readonly cargandoCatalogo = signal(true);
  readonly q = signal('');
  readonly categoriaSel = signal<string | null>(null);
  readonly vista = signal<'grid' | 'lista'>(this.leerVista());
  /** urls de imagen que fallaron al cargar. */
  readonly imgRoto = signal<Set<string>>(new Set());

  readonly carrito = signal<LineaCarrito[]>([]);
  readonly cotizacion = signal<CotizacionVentaResponse | null>(null);
  readonly cotizando = signal(false);
  /** Usuarios activos para asignar como responsable de una línea de servicio. */
  readonly usuarios = signal<{ id: string; nombre: string }[]>([]);

  private idemKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;

  /** Pedido tal como llegó del backend (edición): base para mandar sólo lo que cambió en el PATCH. */
  private original: PedidoResponse | null = null;

  readonly esDomicilio = computed(() => this.tipo() === 'domicilio');
  readonly esEntrega = computed(() => this.tipo() !== 'mostrador');

  private round(n: number) {
    return Math.round(n * 100) / 100;
  }

  // --- Totales (preview local, respaldado por la cotización del backend) ---
  lineaBruto(l: LineaCarrito): number {
    return Math.max(0, l.cantidad) * l.precio_unitario;
  }
  lineaSubtotal(l: LineaCarrito): number {
    return Math.max(0, this.lineaBruto(l) - Math.min(l.descuento_linea, this.lineaBruto(l)));
  }
  readonly subtotalLocal = computed(() => this.carrito().reduce((s, l) => s + this.lineaSubtotal(l), 0));
  readonly totalPromos = computed(() => Number(this.cotizacion()?.total_promociones) || 0);
  readonly totalMercancia = computed(() => {
    const c = this.cotizacion();
    const base = c ? Number(c.total) || 0 : this.subtotalLocal();
    return this.round(base - Math.min(Math.max(0, this.descuentoTotal()), base));
  });
  /** El envío ya es una línea de servicio más — no hay costo aparte. */
  readonly total = computed(() => this.totalMercancia());

  readonly hayDescuentoManual = computed(
    () => this.descuentoTotal() > 0.009 || this.carrito().some(l => l.descuento_linea > 0.009),
  );
  readonly faltaMotivo = computed(() => this.hayDescuentoManual() && !this.motivoDescuento().trim());
  readonly hayLineaInvalida = computed(() => this.carrito().some(l => !(l.cantidad > 0)));
  readonly faltaDireccion = computed(() => this.esDomicilio() && !this.direccionTexto().trim());
  /** Líneas de servicio sin responsable: bloquea «Guardar y confirmar» (400 ServicioSinResponsable). */
  readonly faltaResponsable = computed(() => this.carrito().some(l => l.esServicio && !l.asignadoA));
  readonly serviciosSinResponsable = computed(() => this.carrito().filter(l => l.esServicio && !l.asignadoA).length);

  readonly puedeGuardar = computed(
    () =>
      this.carrito().length > 0 &&
      !this.hayLineaInvalida() &&
      !this.faltaMotivo() &&
      !this.faltaDireccion() &&
      !this.guardando(),
  );

  // --- Catálogo filtrado (en memoria, como el POS) ---
  readonly productosFiltrados = computed(() => {
    const t = this.q().trim().toLowerCase();
    const cat = this.categoriaSel();
    return this.productos().filter(p => {
      if (cat && p.categoria_id !== cat) return false;
      if (!t) return true;
      return (
        p.nombre.toLowerCase().includes(t) ||
        p.sku.toLowerCase().includes(t) ||
        (p.codigo_barras ?? '').toLowerCase().includes(t)
      );
    });
  });

  /** Catálogo agrupado por categoría; cada presentación activa es su propia tarjeta. */
  readonly bloques = computed(() => {
    const nombrePorId = new Map(this.categorias().map(c => [c.id, c.nombre]));
    const grupos = new Map<string, { key: string; producto: ProductoResponse; unidad: UnidadResponse | null }[]>();
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
        count: new Set(items.map(i => i.producto.id)).size,
      }))
      .sort((a, b) =>
        a.nombre === 'Sin categoría' ? 1 : b.nombre === 'Sin categoría' ? -1 : a.nombre.localeCompare(b.nombre),
      );
  });

  readonly categoriasConProductos = computed(() => {
    const conProd = new Set(this.productos().map(p => p.categoria_id));
    return this.categorias()
      .filter(c => conProd.has(c.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  /** Huella del carrito + hints: dispara una nueva cotización cuando cambia algo relevante. */
  private readonly fingerprint = computed(() =>
    JSON.stringify({
      d: this.round(this.descuentoTotal()),
      l: this.carrito().map(l => [l.producto.id, l.unidad?.id ?? null, l.cantidad, l.precio_unitario, l.descuento_linea]),
      c: this.codigoCupon().trim(),
      t: this.telefono().trim(),
    }),
  );

  constructor() {
    if (this.esEdicion()) this.cargarPedido();
    this.cargarCatalogo();

    this.usuarioService.listar({ sort: 'nombre:asc' }).subscribe({
      next: res => this.usuarios.set(res.data.filter(u => u.activo).map(u => ({ id: u.id, nombre: u.nombre }))),
      error: () => {},
    });

    // Cotización en vivo (mayoreo + promos + hay_stock por línea).
    toObservable(this.fingerprint)
      .pipe(
        debounceTime(350),
        switchMap(() => {
          const lineas = this.carrito().filter(l => l.cantidad > 0);
          if (lineas.length === 0) {
            this.cotizacion.set(null);
            return of(null);
          }
          this.cotizando.set(true);
          return this.ventaService
            .cotizar({
              descuento_total: this.round(this.descuentoTotal()),
              lineas: lineas.map(l => this.aLineaRequest(l)),
              ...(this.codigoCupon().trim() ? { codigo_cupon: this.codigoCupon().trim() } : {}),
              ...(this.telefono().trim() ? { telefono: this.telefono().trim() } : {}),
            })
            .pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe(res => {
        this.cotizando.set(false);
        this.cotizacion.set(res);
      });
  }

  private cargarCatalogo() {
    this.cargandoCatalogo.set(true);
    this.productoService
      .listar({ activo: true, page_size: 100, sort: 'nombre:asc', include: ['unidades'] })
      .subscribe({
        next: res => {
          this.productos.set(res.data);
          this.imgRoto.set(new Set());
          this.cargandoCatalogo.set(false);
        },
        error: () => {
          this.sonner.error('No se pudo cargar el catálogo de productos.');
          this.cargandoCatalogo.set(false);
        },
      });
    this.categoriaService.listar().subscribe({
      next: cs => this.categorias.set(cs.filter(c => c.activo)),
      error: () => {},
    });
  }

  seleccionarCategoria(id: string | null) {
    this.categoriaSel.set(this.categoriaSel() === id ? null : id);
  }

  /** Portada de la presentación → la del producto → icono. Descarta urls que fallaron. */
  imgSrc(it: { producto: ProductoResponse; unidad: UnidadResponse | null }): string | null {
    const roto = this.imgRoto();
    const candidatos = [
      it.unidad?.imagen_principal?.url,
      it.unidad?.imagen_principal?.thumbnail_url,
      it.producto.imagen_principal?.url,
      it.producto.imagen_principal?.thumbnail_url,
    ];
    return candidatos.find((u): u is string => !!u && !roto.has(u)) ?? null;
  }
  marcarImgRota(src: string | null) {
    if (src) this.imgRoto.update(s => new Set(s).add(src));
  }

  private leerVista(): 'grid' | 'lista' {
    try {
      return localStorage.getItem('pedido-vista') === 'lista' ? 'lista' : 'grid';
    } catch {
      return 'grid';
    }
  }
  setVista(v: 'grid' | 'lista') {
    this.vista.set(v);
    try {
      localStorage.setItem('pedido-vista', v);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private cargarPedido() {
    this.pedidoService.obtener(this.pedidoId()!).subscribe({
      next: p => {
        if (p.estado !== 'borrador') {
          this.sonner.error(
            p.estado === 'confirmado'
              ? 'Este pedido está confirmado. Usa «Reabrir» antes de editarlo.'
              : `No se puede editar un pedido ${p.estado}.`,
          );
          this.router.navigate(['/pedidos', p.id]);
          return;
        }
        this.hidratar(p);
      },
      error: () => {
        this.sonner.error('No se pudo cargar el pedido.');
        this.router.navigate(['/pedidos']);
      },
    });
  }

  /** Rellena el formulario desde un pedido existente (edición). Cada línea trae su producto por id. */
  private hidratar(p: PedidoResponse) {
    this.original = p;
    this.tipo.set(p.tipo);
    this.canal.set(p.canal);
    this.telefono.set(p.telefono ?? '');
    this.notas.set(p.notas ?? '');
    this.codigoCupon.set(p.codigo_cupon ?? '');
    this.descuentoTotal.set(Number(p.descuento_total) || 0);
    this.motivoDescuento.set(p.motivo_descuento ?? '');
    this.direccionTexto.set(p.direccion_texto ?? '');
    this.referenciaDireccion.set(p.referencia_direccion ?? '');
    this.fechaPromesa.set(p.fecha_promesa ? p.fecha_promesa.slice(0, 16) : '');

    const lineas = p.lineas ?? [];
    const ids = [...new Set(lineas.map(l => l.producto_id))];
    if (ids.length === 0) {
      this.carrito.set([]);
      this.cargando.set(false);
      return;
    }

    // Trae cada producto por id (con sus presentaciones), sin depender del catálogo
    // ni de que sigan activos. Un 404 (producto borrado) no tumba el resto.
    forkJoin(
      ids.map(id => this.productoService.obtenerPorId(id, 'unidades').pipe(catchError(() => of(null)))),
    ).subscribe({
      next: prods => {
        const porId = new Map<string, ProductoResponse>();
        for (const pr of prods) if (pr) porId.set(pr.id, pr);

        const cart = lineas
          .map(l => {
            const producto = porId.get(l.producto_id);
            if (!producto) return null;
            const unidad = l.producto_unidad_id
              ? (producto.unidades ?? []).find(u => u.id === l.producto_unidad_id) ?? null
              : null;
            return {
              key: `${producto.id}:${unidad?.id ?? 'base'}`,
              producto,
              unidad,
              cantidad: Number(l.cantidad) || 0,
              precio_unitario: Number(l.precio_unitario) || 0,
              descuento_linea: Number(l.descuento_linea) || 0,
              esServicio: l.es_servicio ?? producto.tipo === 'servicio',
              asignadoA: l.asignado_a ?? null,
            } as LineaCarrito;
          })
          .filter((l): l is LineaCarrito => !!l);

        this.carrito.set(cart);
        this.cargando.set(false);
        if (cart.length < lineas.length) {
          this.sonner.warning('Algunos productos del pedido ya no existen y no se cargaron.');
        }
      },
      error: () => {
        this.sonner.error('No se pudieron cargar los productos del pedido.');
        this.cargando.set(false);
      },
    });
  }

  private aLineaRequest(l: LineaCarrito): LineaPedidoRequest {
    return {
      producto_id: l.producto.id,
      cantidad: l.cantidad,
      precio_unitario: this.round(l.precio_unitario),
      descuento_linea: this.round(l.descuento_linea),
      impuesto_tasa: Number(l.producto.impuesto_tasa) || 0,
      producto_unidad_id: l.unidad?.id ?? null,
    };
  }

  // --- Carrito ---
  precioDe(p: ProductoResponse, u: UnidadResponse | null) {
    return Number(u ? u.precio_venta : p.precio_venta) || 0;
  }

  agregar(p: ProductoResponse, u: UnidadResponse | null = null) {
    const key = `${p.id}:${u?.id ?? 'base'}`;
    const existe = this.carrito().find(l => l.key === key);
    if (existe) {
      this.setCantidad(key, existe.cantidad + 1);
      return;
    }
    this.carrito.update(list => [
      ...list,
      {
        key,
        producto: p,
        unidad: u,
        cantidad: 1,
        precio_unitario: this.precioDe(p, u),
        descuento_linea: 0,
        esServicio: p.tipo === 'servicio',
        asignadoA: null,
      },
    ]);
  }

  setAsignado(key: string, usuarioId: string | null) {
    this.carrito.update(list => list.map(l => (l.key === key ? { ...l, asignadoA: usuarioId || null } : l)));
  }

  setCantidad(key: string, cantidad: number) {
    const n = Number(cantidad);
    this.carrito.update(list => list.map(l => (l.key === key ? { ...l, cantidad: Number.isFinite(n) ? n : 0 } : l)));
  }
  paso(key: string, delta: 1 | -1) {
    this.carrito.update(list =>
      list.map(l => {
        if (l.key !== key) return l;
        const min = l.producto.permite_venta_fraccionada ? 0.001 : 1;
        return { ...l, cantidad: Math.max(min, this.round(l.cantidad + delta)) };
      }),
    );
  }
  setPrecio(key: string, precio: number) {
    this.carrito.update(list => list.map(l => (l.key === key ? { ...l, precio_unitario: Math.max(0, Number(precio) || 0) } : l)));
  }
  setDescuentoLinea(key: string, d: number) {
    this.carrito.update(list =>
      list.map(l => {
        if (l.key !== key) return l;
        const tope = this.lineaBruto(l);
        return { ...l, descuento_linea: Math.min(Math.max(0, Number(d) || 0), tope) };
      }),
    );
  }
  quitar(key: string) {
    this.carrito.update(list => list.filter(l => l.key !== key));
  }
  setDescuentoTotal(v: number) {
    this.descuentoTotal.set(Math.max(0, Number(v) || 0));
  }

  /** Promo aplicada a una línea según la última cotización. */
  promoDeLinea(l: LineaCarrito): { etiqueta: string; descuento: number } | null {
    const m = this.cotizacion()?.lineas.find(
      x => x.producto_id === l.producto.id && (x.producto_unidad_id ?? null) === (l.unidad?.id ?? null),
    );
    const desc = m ? Number(m.promo_descuento) || 0 : 0;
    return desc > 0 && m?.promo_etiqueta ? { etiqueta: m.promo_etiqueta, descuento: desc } : null;
  }
  sinStock(l: LineaCarrito): boolean {
    const m = this.cotizacion()?.lineas.find(
      x => x.producto_id === l.producto.id && (x.producto_unidad_id ?? null) === (l.unidad?.id ?? null),
    );
    return !!m && m.hay_stock === false;
  }

  // --- Guardar ---
  private construirLineas(): LineaPedidoRequest[] {
    return this.carrito().map(l => ({
      ...this.aLineaRequest(l),
      // El responsable sólo cuenta en líneas de servicio; el backend lo ignora en el resto.
      ...(l.esServicio ? { asignado_a: l.asignadoA || null } : {}),
    }));
  }

  /** Payload de creación: todo el pedido. `tipo` y `canal` se añaden en `guardar()`. */
  private baseRequest() {
    const domicilio = this.esDomicilio();
    return {
      lineas: this.construirLineas(),
      telefono: this.telefono().trim() || null,
      descuento_total: this.round(Math.max(0, this.descuentoTotal())),
      motivo_descuento: this.motivoDescuento().trim() || null,
      codigo_cupon: this.codigoCupon().trim() || null,
      notas: this.notas().trim() || null,
      fecha_promesa: this.fechaPromesa() ? new Date(this.fechaPromesa()).toISOString() : null,
      direccion_texto: domicilio ? this.direccionTexto().trim() || null : null,
      referencia_direccion: domicilio ? this.referenciaDireccion().trim() || null : null,
    };
  }

  /**
   * PATCH parcial (edición): `lineas` siempre (es el objetivo de la edición) y de los
   * escalares sólo los que cambiaron. Se puede cambiar `tipo`/`canal`; al pasar a
   * `domicilio` el diff manda también `direccion_texto` en el mismo request.
   */
  private cambiosPedido(): ActualizarPedidoRequest {
    const o = this.original;
    const domicilio = this.esDomicilio();
    const req: ActualizarPedidoRequest = { lineas: this.construirLineas() };

    if (this.tipo() !== o?.tipo) req.tipo = this.tipo();
    if (this.canal() !== o?.canal) req.canal = this.canal();

    const telefono = this.telefono().trim() || null;
    if (telefono !== (o?.telefono ?? null)) req.telefono = telefono;

    const descuento = this.round(Math.max(0, this.descuentoTotal()));
    if (descuento !== Number(o?.descuento_total ?? 0)) req.descuento_total = descuento;

    const motivo = this.motivoDescuento().trim() || null;
    if (motivo !== (o?.motivo_descuento ?? null)) req.motivo_descuento = motivo;

    const cupon = this.codigoCupon().trim() || null;
    if (cupon !== (o?.codigo_cupon ?? null)) req.codigo_cupon = cupon;

    const notas = this.notas().trim() || null;
    if (notas !== (o?.notas ?? null)) req.notas = notas;

    const dir = domicilio ? this.direccionTexto().trim() || null : null;
    if (dir !== (o?.direccion_texto ?? null)) req.direccion_texto = dir;

    const refDir = domicilio ? this.referenciaDireccion().trim() || null : null;
    if (refDir !== (o?.referencia_direccion ?? null)) req.referencia_direccion = refDir;

    const fechaVieja = o?.fecha_promesa ? o.fecha_promesa.slice(0, 16) : '';
    if (this.fechaPromesa() !== fechaVieja) {
      req.fecha_promesa = this.fechaPromesa() ? new Date(this.fechaPromesa()).toISOString() : null;
    }

    return req;
  }

  guardar(confirmar = false) {
    if (!this.puedeGuardar()) {
      if (this.faltaDireccion()) this.sonner.error('La dirección es obligatoria para envío a domicilio.');
      else if (this.faltaMotivo()) this.sonner.error('Captura el motivo del descuento manual.');
      else if (this.hayLineaInvalida()) this.sonner.error('Hay líneas con cantidad 0.');
      return;
    }
    if (confirmar && this.faltaResponsable()) {
      this.sonner.error('Asigna un responsable a cada línea de servicio antes de confirmar.');
      return;
    }
    this.guardando.set(true);

    if (this.esEdicion()) {
      this.pedidoService.actualizar(this.pedidoId()!, this.cambiosPedido()).subscribe({
        next: p => this.alGuardar(p, 'Pedido actualizado'),
        error: err => this.errorGuardar(err),
      });
      return;
    }

    const req: CrearPedidoRequest = { tipo: this.tipo(), canal: this.canal(), confirmar, ...this.baseRequest() };
    this.pedidoService.crear(req, this.idemKey).subscribe({
      next: p => this.alGuardar(p, confirmar ? 'Pedido creado y confirmado' : 'Pedido guardado en borrador'),
      error: err => this.errorGuardar(err),
    });
  }

  private alGuardar(p: PedidoResponse, msg: string) {
    this.guardando.set(false);
    this.sonner.success(msg);
    this.router.navigate(['/pedidos', p.id]);
  }
  private errorGuardar(err: unknown) {
    this.guardando.set(false);
    const e = err as { error?: { error?: { message?: string; code?: string } } };
    const code = e?.error?.error?.code;
    if (code === 'DireccionEnvioRequerida') this.sonner.error('La dirección es obligatoria para envío a domicilio.');
    else if (code === 'MotivoDescuentoRequerido') this.sonner.error('Captura el motivo del descuento manual.');
    else if (code === 'PedidoSinLineas') this.sonner.error('El pedido no tiene líneas.');
    else if (code === 'PedidoNoEditable') this.sonner.error('El pedido ya no está en borrador. Usa «Reabrir» para editarlo.');
    else if (code === 'ServicioSinResponsable')
      this.sonner.error('Asigna un responsable a cada línea de servicio antes de confirmar.');
    else if (code === 'ResponsableInvalido')
      this.sonner.error('El responsable elegido no es un usuario activo, o esa línea no es un servicio.');
    else if (code === 'TransicionPedidoInvalida') this.sonner.error('Ese cambio de estado no está permitido ahora.');
    else this.sonner.error(mensajePedidoError(e?.error?.error?.message, 'No se pudo guardar el pedido'));
  }
}
