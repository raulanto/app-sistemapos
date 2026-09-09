import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideScanBarcode,
  lucideSearch,
  lucidePlus,
  lucideMinus,
  lucideTrash,
  lucideShoppingCart,
  lucideLockKeyhole,
  lucideReceiptText,
  lucideUserPlus,
  lucideX,
  lucideCircleCheck,
  lucideBanknote,
  lucideHistory,
  lucidePackage,
  lucideLayers,
  lucidePrinter,
  lucideLayoutGrid,
  lucideList,
  lucideTag,
  lucideTrash2,
  lucidePhone,
  lucideWallet,
  lucideTicket,
  lucideArrowLeftRight,
} from '@ng-icons/lucide';

import { ProductoService } from '../../inventario/data-access/producto.service';
import { CategoriaService } from '../../inventario/data-access/categoria.service';
import { ProductoResponse, UnidadResponse, CategoriaResponse } from '../../inventario/data-access/inventario.models';
import { ClienteService } from '../../clientes/data-access/cliente.service';
import { CajaService } from '../data-access/caja.service';
import { VentaService } from '../data-access/venta.service';
import {
  CajaTurnoResponse,
  ClienteResponse,
  CotizacionVentaResponse,
  CrearVentaRequest,
  MetodoPago,
  METODOS_PAGO,
  VentaResponse,
} from '../data-access/ventas.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { AbrirCajaSheetComponent } from '../ui/abrir-caja-sheet/abrir-caja-sheet.component';
import { CerrarCajaSheetComponent } from '../ui/cerrar-caja-sheet/cerrar-caja-sheet.component';
import { MovimientosCajaSheetComponent } from '../ui/movimientos-caja-sheet/movimientos-caja-sheet.component';

interface LineaCarrito {
  key: string;
  producto: ProductoResponse;
  unidad: UnidadResponse | null;
  cantidad: number;
  precio_unitario: number;
  descuento_linea: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    FormsModule,
    RouterLink,
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardInputComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideScanBarcode,
      lucideSearch,
      lucidePlus,
      lucideMinus,
      lucideTrash,
      lucideShoppingCart,
      lucideLockKeyhole,
      lucideReceiptText,
      lucideUserPlus,
      lucideX,
      lucideCircleCheck,
      lucideBanknote,
      lucideHistory,
      lucidePackage,
      lucideLayers,
      lucidePrinter,
      lucideLayoutGrid,
      lucideList,
      lucideTag,
      lucideTrash2,
      lucidePhone,
      lucideWallet,
      lucideTicket,
      lucideArrowLeftRight,
    }),
  ],
  templateUrl: './pos.component.html',
  styles: [
    `
    @keyframes pos-feed {
      from { clip-path: inset(100% 0 0 0); }
      to { clip-path: inset(0 0 0 0); }
    }
    @keyframes pos-drop {
      0% { transform: translateY(-8px); }
      55% { transform: translateY(4px); }
      100% { transform: translateY(0); }
    }
    @keyframes pos-slot {
      0%, 100% { opacity: .35; transform: scaleX(.9); }
      50% { opacity: .9; transform: scaleX(1); }
    }
    @keyframes pos-actions-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .pos-slot { animation: pos-slot 1s ease-in-out 3; }
    .pos-ticket {
      transform-origin: top center;
      animation: pos-feed 1s cubic-bezier(.2, .9, .25, 1) both, pos-drop .5s ease-out .95s both;
      --tooth: 12px;
      -webkit-mask:
        conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / var(--tooth) var(--tooth) repeat-x,
        linear-gradient(#000 0 0) top / 100% calc(100% - var(--tooth)) no-repeat;
      mask:
        conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / var(--tooth) var(--tooth) repeat-x,
        linear-gradient(#000 0 0) top / 100% calc(100% - var(--tooth)) no-repeat;
    }
    .pos-ticket-actions { animation: pos-actions-in .3s ease-out 1.35s both; }
    @media (prefers-reduced-motion: reduce) {
      .pos-ticket, .pos-ticket-actions, .pos-slot { animation: none; }
    }
  `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosComponent {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private clienteService = inject(ClienteService);
  private cajaService = inject(CajaService);
  private ventaService = inject(VentaService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private authService = inject(AuthService);

  readonly canVender = computed(() => this.authService.hasPermission(...PERMISOS.ventas.crear));
  readonly canOperarCaja = computed(() => this.authService.hasPermission(...PERMISOS.caja.operar));
  /** Sin este permiso el POS no ofrece descuento manual (por línea ni total). */
  readonly canDescuentoManual = computed(() => this.authService.hasPermission(...PERMISOS.ventas.descuentoManual));

  readonly metodosPago = METODOS_PAGO;

  readonly turno = signal<CajaTurnoResponse | null>(null);
  readonly cargandoTurno = signal(true);

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

  readonly carrito = signal<LineaCarrito[]>([]);
  readonly descuentoTotal = signal(0);
  readonly pagos = signal<{ monto: number; metodo_pago: MetodoPago; monto_recibido?: number }[]>([]);

  readonly clienteBusqueda = signal('');
  readonly clientesEncontrados = signal<ClienteResponse[]>([]);
  readonly cliente = signal<ClienteResponse | null>(null);

  /** Cupón que habilita una promo `requiere_cupon`. Se valida contra el backend antes de cobrar. */
  readonly codigoCupon = signal('');
  readonly cuponEstado = signal<'idle' | 'validando' | 'ok' | 'error'>('idle');
  readonly cuponMsg = signal('');

  /** Motivo del descuento manual (obligatorio si hay `descuento_linea` / `descuento_total`). */
  readonly motivoDescuento = signal('');

  /** Teléfono para monedero (cashback) + historial. Independiente del cliente/crédito. */
  readonly telefono = signal('');
  /** Saldo del monedero del teléfono; null = teléfono incompleto o sin consultar. */
  readonly monederoSaldo = signal<number | null>(null);
  readonly consultandoMonedero = signal(false);

  readonly cobrando = signal(false);
  readonly ventaOk = signal<VentaResponse | null>(null);
  /** Un UUID por intento de cobro; se reusa en reintentos y se renueva tras vender. */
  private idemKey = this.nuevoIdem();

  /** Previsualización de promos + mayoreo (POST /ventas/cotizar). null = sin datos → cálculo local. */
  readonly cotizacion = signal<CotizacionVentaResponse | null>(null);
  readonly cotizando = signal(false);

  /** Huella del carrito: dispara una nueva cotización cuando cambia algo relevante. */
  private readonly fingerprint = computed(() =>
    JSON.stringify({
      d: this.round(this.descuentoTotal()),
      l: this.carrito().map(l => [l.producto.id, l.unidad?.id ?? null, l.cantidad, l.precio_unitario, l.descuento_linea]),
      // Hints de promociones: método de pago, segmento, cupón y teléfono cambian qué promos aplican.
      m: [...new Set(this.pagos().map(p => p.metodo_pago))].sort(),
      s: this.cliente()?.segmento ?? '',
      c: this.codigoCupon().trim(),
      t: this.telefono().trim(),
    }),
  );

  private nuevoIdem() {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  }

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

  /**
   * Catálogo agrupado por categoría (bloques). Cada presentación (unidad base +
   * cada unidad activa) es su propia tarjeta; "Sin categoría" al final.
   */
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
      .sort((a, b) => (a.nombre === 'Sin categoría' ? 1 : b.nombre === 'Sin categoría' ? -1 : a.nombre.localeCompare(b.nombre)));
  });

  /** Chips: categorías que tienen al menos un producto en el catálogo. */
  readonly categoriasConProductos = computed(() => {
    const conProd = new Set(this.productos().map(p => p.categoria_id));
    return this.categorias().filter(c => conProd.has(c.id)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  // --- Precios y descuentos ---

  /** Precio real que cobrará el backend: mayoreo si la línea es por unidad base y llega al mínimo. */
  precioEfectivo(l: LineaCarrito): number {
    if (this.aplicaMayoreo(l)) return Number(l.producto.precio_mayoreo) || l.precio_unitario;
    return l.precio_unitario;
  }
  /** cantidad × precio efectivo (antes de descuento de línea). */
  lineaBruto(l: LineaCarrito): number {
    return Math.max(0, l.cantidad) * this.precioEfectivo(l);
  }
  /** cantidad × precio − descuento de línea (nunca negativo). */
  lineaSubtotal(l: LineaCarrito): number {
    return Math.max(0, this.lineaBruto(l) - Math.min(l.descuento_linea, this.lineaBruto(l)));
  }

  readonly subtotalLineas = computed(() => this.carrito().reduce((s, l) => s + this.lineaSubtotal(l), 0));
  /** Descuento total efectivamente aplicado (no puede pasar del subtotal de líneas). */
  readonly descTotalAplicado = computed(() => Math.min(Math.max(0, this.descuentoTotal()), this.subtotalLineas()));
  /** Descuento por promociones (viene de la cotización del backend; 0 si no hay). */
  readonly totalPromociones = computed(() => {
    const c = this.cotizacion();
    return c ? Number(c.total_promociones) || 0 : 0;
  });
  /** Total real: el de la cotización si está fresca, si no el cálculo local. */
  readonly total = computed(() => {
    const c = this.cotizacion();
    if (c) return this.round(Number(c.total));
    return this.round(this.subtotalLineas() - this.descTotalAplicado());
  });

  private cotizLinea(l: LineaCarrito) {
    return this.cotizacion()?.lineas.find(
      x => x.producto_id === l.producto.id && (x.producto_unidad_id ?? null) === (l.unidad?.id ?? null),
    );
  }

  /** Promo aplicada a una línea del carrito (según la última cotización). */
  promoDeLinea(l: LineaCarrito): { etiqueta: string; descuento: number } | null {
    const m = this.cotizLinea(l);
    const desc = m ? Number(m.promo_descuento) || 0 : 0;
    return desc > 0 && m?.promo_etiqueta ? { etiqueta: m.promo_etiqueta, descuento: desc } : null;
  }

  /** Desglose de promos apiladas en una línea (cuando el backend aplicó más de una). */
  promosDeLinea(l: LineaCarrito): { promo_etiqueta: string; monto: string }[] {
    return this.cotizLinea(l)?.promos_aplicadas ?? [];
  }

  /** true si la cotización marcó esta línea sin stock suficiente. */
  sinStock(l: LineaCarrito): boolean {
    const m = this.cotizLinea(l);
    return !!m && m.hay_stock === false;
  }
  readonly hayLineaSinStock = computed(() => {
    const c = this.cotizacion();
    return !!c && this.carrito().some(l => this.sinStock(l));
  });
  readonly pagado = computed(() => this.pagos().reduce((s, p) => s + (Number(p.monto) || 0), 0));
  readonly saldoPendiente = computed(() => this.round(this.total() - this.pagado()));
  readonly requiereCliente = computed(() => this.saldoPendiente() > 0.009);
  readonly hayLineaInvalida = computed(() => this.carrito().some(l => !(l.cantidad > 0)));

  // --- Descuento manual ---
  /** Hay descuento manual si el total o alguna línea traen un descuento tecleado. */
  readonly hayDescuentoManual = computed(
    () => this.descTotalAplicado() > 0.009 || this.carrito().some(l => l.descuento_linea > 0.009),
  );
  /** El motivo es obligatorio cuando hay descuento manual. */
  readonly faltaMotivo = computed(() => this.hayDescuentoManual() && !this.motivoDescuento().trim());

  // --- Monedero ---
  /** Sólo dígitos del teléfono; se considera válido con 7+ dígitos. */
  private telDigitos = computed(() => this.telefono().replace(/\D/g, ''));
  readonly telefonoValido = computed(() => this.telDigitos().length >= 7);
  readonly monederoDisponible = computed(() => this.monederoSaldo() ?? 0);
  /** Cashback que generaría la venta (de la cotización) — sólo aplica si hay teléfono. */
  readonly monederoAGenerar = computed(() => {
    if (!this.telefono().trim()) return 0;
    const v = Number(this.cotizacion()?.monedero_a_generar);
    return Number.isFinite(v) && v > 0 ? this.round(v) : 0;
  });
  readonly monederoUsado = computed(() =>
    this.pagos().filter(p => p.metodo_pago === 'monedero').reduce((s, p) => s + (Number(p.monto) || 0), 0),
  );
  readonly hayPagoMonedero = computed(() => this.monederoUsado() > 0);
  readonly faltaTelefonoMonedero = computed(() => this.hayPagoMonedero() && !this.telefono().trim());
  readonly excesoMonedero = computed(() => this.monederoUsado() > this.monederoDisponible() + 0.009);

  readonly puedeCobrar = computed(
    () =>
      this.carrito().length > 0 &&
      !this.hayLineaInvalida() &&
      !this.hayLineaSinStock() &&
      this.total() > 0 &&
      !this.faltaTelefonoMonedero() &&
      !this.excesoMonedero() &&
      !this.faltaMotivo() &&
      (!this.requiereCliente() || !!this.cliente()),
  );

  private round(n: number) {
    return Math.round(n * 100) / 100;
  }

  constructor() {
    this.cargarTurno();

    // Cotización en vivo: cada cambio del carrito re-pide el total con promos + mayoreo.
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
          const metodos = [...new Set(this.pagos().map(p => p.metodo_pago))];
          return this.ventaService
            .cotizar({
              descuento_total: this.round(this.descuentoTotal()),
              lineas: lineas.map(l => ({
                producto_id: l.producto.id,
                cantidad: l.cantidad,
                precio_unitario: this.round(l.precio_unitario),
                descuento_linea: this.round(l.descuento_linea),
                producto_unidad_id: l.unidad?.id ?? null,
              })),
              ...(metodos.length ? { metodos_pago: metodos } : {}),
              ...(this.cliente()?.segmento ? { cliente_segmento: this.cliente()!.segmento ?? null } : {}),
              ...(this.codigoCupon().trim() ? { codigo_cupon: this.codigoCupon().trim() } : {}),
              ...(this.telefono().trim() ? { telefono: this.telefono().trim() } : {}),
            })
            .pipe(catchError(() => of(null))); // error de red / permiso → cálculo local
        }),
        takeUntilDestroyed(),
      )
      .subscribe(res => {
        this.cotizando.set(false);
        this.cotizacion.set(res);
      });

    // Saldo de monedero: al escribir un teléfono válido, se consulta (404 / sin permiso → 0).
    toObservable(this.telefono)
      .pipe(
        debounceTime(400),
        switchMap(() => {
          this.monederoSaldo.set(null);
          if (!this.telefonoValido()) return of(null);
          this.consultandoMonedero.set(true);
          return this.clienteService.monederoSaldo(this.telefono().trim()).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(),
      )
      .subscribe(m => {
        this.consultandoMonedero.set(false);
        this.monederoSaldo.set(this.telefonoValido() ? (m ? Number(m.saldo) || 0 : 0) : null);
      });
  }

  private cargarTurno() {
    this.cargandoTurno.set(true);
    this.cajaService.actual().subscribe({
      next: t => {
        this.turno.set(t);
        this.cargandoTurno.set(false);
        if (t) this.cargarCatalogo();
      },
      error: err => {
        console.error('Error al leer el turno', err);
        this.cargandoTurno.set(false);
      },
    });
  }

  private cargarCatalogo() {
    // Catálogo acotado a la sucursal del turno: sólo productos con existencia ahí,
    // con su stock embebido (preset POS de la guía de ventas §2.0).
    const suc = this.turno()?.sucursal_id;
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
      next: res => {
        this.productos.set(res.data);
        this.imgRoto.set(new Set());
        this.cargandoCatalogo.set(false);
      },
      error: err => {
        console.error('Error al cargar el catálogo', err);
        this.cargandoCatalogo.set(false);
      },
    });
    if (this.categorias().length === 0) {
      this.categoriaService.listar().subscribe({
        next: cs => this.categorias.set(cs.filter(c => c.activo)),
        error: err => console.error('Error al cargar categorías', err),
      });
    }
  }

  seleccionarCategoria(id: string | null) {
    this.categoriaSel.set(this.categoriaSel() === id ? null : id);
  }

  /** Foto de la tarjeta: portada de la presentación si tiene; si no, cae a la del producto. */
  imgSrc(it: { key: string; producto: ProductoResponse; unidad: UnidadResponse | null }): string | null {
    if (this.imgRoto().has(it.key)) return null;
    const img = it.unidad?.imagen_principal ?? it.producto.imagen_principal;
    return img?.url ?? img?.thumbnail_url ?? null;
  }
  marcarImgRota(key: string) {
    this.imgRoto.update(s => new Set(s).add(key));
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
  stockDe(it: { producto: ProductoResponse; unidad: UnidadResponse | null }): number | null {
    const base = Number(it.producto.existencias?.[0]?.cantidad);
    if (!Number.isFinite(base)) return null;
    if (!it.unidad) return base;
    const f = Number(it.unidad.factor) || 1;
    return f > 0 ? Math.floor(base / f) : base;
  }

  // --- Caja ---

  abrirCaja() {
    this.sheetService.create({
      zTitle: 'Abrir caja',
      zDescription: 'Inicia un turno para poder registrar ventas.',
      zContent: AbrirCajaSheetComponent,
      zOkText: 'Abrir',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (turno: CajaTurnoResponse) => {
              this.turno.set(turno);
              this.cargarCatalogo();
              this.sonner.success('Caja abierta');
              resolve();
            },
            error: (err: any) => {
              this.sonner.error(err?.error?.error?.message ?? 'No se pudo abrir la caja');
              reject(err);
            },
          });
        });
      },
    });
  }

  abrirMovimientos() {
    const t = this.turno();
    if (!t) return;
    this.sheetService.create({
      zTitle: 'Movimientos de caja',
      zDescription: 'Retiros, ingresos y gastos del turno.',
      zContent: MovimientosCajaSheetComponent,
      zSize: 'lg',
      zData: { turnoId: t.id },
      zOkText: null,
      zCancelText: 'Cerrar',
    });
  }

  cerrarCaja() {
    const t = this.turno();
    if (!t) return;
    this.sheetService.create({
      zTitle: 'Cerrar caja',
      zDescription: 'Cuenta el efectivo del cajón y decláralo.',
      zContent: CerrarCajaSheetComponent,
      zData: { turnoId: t.id },
      zOkText: 'Cerrar turno',
      zCancelText: 'Cancelar',
      zOnOk: (instance: any) => {
        const obs = instance.save();
        if (!obs) return false;
        return new Promise<void>((resolve, reject) => {
          obs.subscribe({
            next: (turno: CajaTurnoResponse) => {
              const dif = Number(turno.diferencia ?? 0);
              if (turno.estado === 'cerrado_con_diferencia') {
                this.sonner.warning(`Turno cerrado con diferencia ${dif > 0 ? '+' : ''}${dif.toFixed(2)} · pendiente de conciliar`);
              } else {
                this.sonner.success(
                  dif === 0 ? 'Turno cerrado, la caja cuadra' : `Turno cerrado · diferencia ${dif > 0 ? '+' : ''}${dif.toFixed(2)}`,
                );
              }
              this.turno.set(null);
              this.limpiarVenta();
              resolve();
            },
            error: (err: any) => {
              this.sonner.error(err?.error?.error?.message ?? 'No se pudo cerrar la caja');
              reject(err);
            },
          });
        });
      },
    });
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
      { key, producto: p, unidad: u, cantidad: 1, precio_unitario: this.precioDe(p, u), descuento_linea: 0 },
    ]);
  }

  escanear() {
    const cod = this.codigo().trim();
    if (!cod) return;
    this.productoService.resolverCodigo(cod).subscribe({
      next: r => {
        const prod = this.productos().find(p => p.id === r.producto_id);
        if (!prod) {
          this.sonner.error('El código resolvió a un producto que no está en el catálogo cargado');
          return;
        }
        const uni = r.unidad_id ? (prod.unidades ?? []).find(x => x.id === r.unidad_id) ?? null : null;
        this.agregar(prod, uni);
        this.codigo.set('');
      },
      error: () => this.sonner.error('Código no encontrado'),
    });
  }

  /** Valor libre mientras se escribe; el mínimo se valida al cobrar (evita bloquear "0.5" al teclear). */
  setCantidad(key: string, cantidad: number) {
    const n = Number(cantidad);
    this.carrito.update(list =>
      list.map(l => (l.key === key ? { ...l, cantidad: Number.isFinite(n) ? n : 0 } : l)),
    );
  }

  /** Botones +/−: nunca dejan la cantidad por debajo del paso mínimo del producto. */
  pasoCantidad(key: string, delta: 1 | -1) {
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

  /** El descuento de línea nunca puede superar cantidad × precio efectivo. */
  setDescuentoLinea(key: string, d: number) {
    this.carrito.update(list =>
      list.map(l => {
        if (l.key !== key) return l;
        const tope = this.lineaBruto(l);
        return { ...l, descuento_linea: Math.min(Math.max(0, Number(d) || 0), tope) };
      }),
    );
  }

  /** El descuento total nunca puede superar el subtotal de las líneas. */
  setDescuentoTotal(v: number) {
    this.descuentoTotal.set(Math.min(Math.max(0, Number(v) || 0), this.subtotalLineas()));
  }

  quitar(key: string) {
    this.carrito.update(list => list.filter(l => l.key !== key));
  }

  /** Vacía sólo el carrito (deja pagos/cliente/cupón como están). */
  vaciarCarrito() {
    this.carrito.set([]);
    this.descuentoTotal.set(0);
    this.motivoDescuento.set('');
  }

  aplicaMayoreo(l: LineaCarrito) {
    return (
      !l.unidad &&
      !!l.producto.precio_mayoreo &&
      !!l.producto.cantidad_minima_mayoreo &&
      l.cantidad >= Number(l.producto.cantidad_minima_mayoreo)
    );
  }

  // --- Pagos ---

  agregarPago(metodo: MetodoPago) {
    const falta = Math.max(0, this.saldoPendiente());
    let monto = this.round(falta || this.total());
    // El monedero no puede exceder el saldo disponible del teléfono.
    if (metodo === 'monedero') monto = this.round(Math.min(monto, this.monederoDisponible()));
    this.pagos.update(list => [...list, { monto, metodo_pago: metodo }]);
  }

  setMontoPago(i: number, monto: number) {
    this.pagos.update(list =>
      list.map((p, idx) => {
        if (idx !== i) return p;
        let m = Math.max(0, Number(monto) || 0);
        if (p.metodo_pago === 'monedero') m = Math.min(m, this.monederoDisponible());
        return { ...p, monto: m };
      }),
    );
  }

  /** Efectivo: con cuánto pagó el cliente (para calcular el cambio). */
  setRecibido(i: number, v: number) {
    const n = Number(v);
    this.pagos.update(list =>
      list.map((p, idx) => (idx === i ? { ...p, monto_recibido: Number.isFinite(n) && n > 0 ? n : undefined } : p)),
    );
  }

  cambioPago(p: { monto: number; metodo_pago: MetodoPago; monto_recibido?: number }): number {
    if (p.metodo_pago !== 'efectivo' || !p.monto_recibido) return 0;
    return Math.max(0, this.round(p.monto_recibido - p.monto));
  }
  readonly cambioTotal = computed(() => this.pagos().reduce((s, p) => s + this.cambioPago(p), 0));

  quitarPago(i: number) {
    this.pagos.update(list => list.filter((_, idx) => idx !== i));
  }

  pagoExacto() {
    this.pagos.set([{ monto: this.round(this.total()), metodo_pago: 'efectivo' }]);
  }

  // --- Cliente (crédito) ---

  buscarClientes() {
    const q = this.clienteBusqueda().trim();
    if (q.length < 2) {
      this.clientesEncontrados.set([]);
      return;
    }
    this.ventaService.buscarClientes(q).subscribe({
      next: cs => this.clientesEncontrados.set(cs),
      error: () => this.clientesEncontrados.set([]),
    });
  }

  elegirCliente(c: ClienteResponse) {
    this.cliente.set(c);
    this.clientesEncontrados.set([]);
    this.clienteBusqueda.set('');
  }

  quitarCliente() {
    this.cliente.set(null);
  }

  // --- Cupón ---

  validarCupon() {
    const cod = this.codigoCupon().trim();
    if (!cod) {
      this.quitarCupon();
      return;
    }
    this.cuponEstado.set('validando');
    this.ventaService.validarCupon(cod, this.cliente()?.id ?? null).subscribe({
      next: r => {
        if (r.valido) {
          this.cuponEstado.set('ok');
          this.cuponMsg.set('Cupón aplicado');
        } else {
          this.cuponEstado.set('error');
          this.cuponMsg.set('El cupón no aplica a esta venta');
        }
      },
      error: err => {
        const code = err?.error?.error?.code;
        this.cuponEstado.set('error');
        this.cuponMsg.set(
          code === 'CuponVencido'
            ? 'Cupón vencido o desactivado'
            : code === 'CuponAgotado'
              ? 'El cupón agotó sus usos'
              : code === 'CuponNoEncontrado'
                ? 'El cupón no existe'
                : (err?.error?.error?.message ?? 'No se pudo validar el cupón'),
        );
      },
    });
  }

  quitarCupon() {
    this.codigoCupon.set('');
    this.cuponEstado.set('idle');
    this.cuponMsg.set('');
  }

  // --- Cobrar ---

  cobrar() {
    const t = this.turno();
    if (!t || this.cobrando()) return;
    if (this.hayLineaInvalida()) {
      this.sonner.error('Hay líneas con cantidad 0. Ajusta las cantidades antes de cobrar.');
      return;
    }
    if (!this.puedeCobrar()) return;

    if (this.faltaMotivo()) {
      this.sonner.error('Captura el motivo del descuento manual.');
      return;
    }

    const req: CrearVentaRequest = {
      caja_turno_id: t.id,
      cliente_id: this.cliente()?.id ?? null,
      ...(this.telefono().trim() ? { telefono: this.telefono().trim() } : {}),
      ...(this.codigoCupon().trim() ? { codigo_cupon: this.codigoCupon().trim() } : {}),
      ...(this.motivoDescuento().trim() ? { motivo_descuento: this.motivoDescuento().trim() } : {}),
      // Se manda el descuento total ya acotado al subtotal (el backend recalcula igual).
      descuento_total: this.round(this.descTotalAplicado()),
      lineas: this.carrito().map(l => ({
        producto_id: l.producto.id,
        cantidad: l.cantidad,
        // Precio efectivo: si aplica mayoreo mandamos ese (el backend lo revalida y fuerza).
        precio_unitario: this.round(this.precioEfectivo(l)),
        descuento_linea: this.round(Math.min(l.descuento_linea, this.lineaBruto(l))),
        impuesto_tasa: Number(l.producto.impuesto_tasa) || 0,
        producto_unidad_id: l.unidad?.id ?? null,
      })),
      pagos: this.pagos()
        .filter(p => p.monto > 0)
        .map(p => ({
          monto: this.round(p.monto),
          metodo_pago: p.metodo_pago,
          ...(p.metodo_pago === 'efectivo' && p.monto_recibido && p.monto_recibido >= p.monto
            ? { monto_recibido: this.round(p.monto_recibido) }
            : {}),
        })),
    };

    this.cobrando.set(true);
    this.ventaService.crear(req, this.idemKey).subscribe({
      next: venta => {
        this.cobrando.set(false);
        this.ventaOk.set(venta);
        this.limpiarVenta();
        this.idemKey = this.nuevoIdem();
      },
      error: err => {
        this.cobrando.set(false);
        const code = err?.error?.error?.code;
        const msg = err?.error?.error?.message;
        if (code === 'StockInsuficiente') this.sonner.error(msg ?? 'Stock insuficiente en una línea. La venta no se registró.');
        else if (code === 'LimiteCreditoExcedido') this.sonner.error(msg ?? 'La deuda supera el límite de crédito del cliente.');
        else if (code === 'VentaCreditoSinCliente') this.sonner.error('Falta seleccionar cliente para la parte a crédito.');
        else if (code === 'SaldoMonederoInsuficiente') this.sonner.error(msg ?? 'El monedero no cubre ese pago. La venta no se registró.');
        else if (code === 'MovimientoMonederoInvalido') this.sonner.error(msg ?? 'Para pagar con monedero hay que capturar el teléfono.');
        else if (code === 'DescuentoManualNoAutorizado') this.sonner.error(msg ?? 'No tienes permiso para aplicar descuento manual.');
        else if (code === 'MotivoDescuentoRequerido') this.sonner.error('Captura el motivo del descuento manual.');
        else if (code === 'DescuentoManualExcedeTope') this.sonner.error(msg ?? 'El descuento manual supera el tope permitido para tu rol.');
        else if (code === 'CuponVencido') {
          this.cuponEstado.set('error');
          this.cuponMsg.set('Cupón vencido o desactivado');
          this.sonner.error(msg ?? 'El cupón está vencido. La venta no se registró.');
        } else if (code === 'CuponNoEncontrado') {
          this.cuponEstado.set('error');
          this.cuponMsg.set('El cupón no existe');
          this.sonner.error('El cupón no existe. La venta no se registró.');
        } else if (code === 'CuponAgotado') {
          this.cuponEstado.set('error');
          this.cuponMsg.set('El cupón agotó sus usos');
          this.sonner.error(msg ?? 'El cupón agotó sus usos. La venta no se registró.');
        } else if (code === 'CajaNoAbierta') {
          this.sonner.error('El turno de caja ya no está abierto.');
          this.turno.set(null);
        } else this.sonner.error(msg ?? 'No se pudo registrar la venta');
      },
    });
  }

  private limpiarVenta() {
    this.carrito.set([]);
    this.pagos.set([]);
    this.descuentoTotal.set(0);
    this.cotizacion.set(null);
    this.cliente.set(null);
    this.clienteBusqueda.set('');
    this.clientesEncontrados.set([]);
    this.telefono.set('');
    this.monederoSaldo.set(null);
    this.motivoDescuento.set('');
    this.quitarCupon();
  }

  nuevaVenta() {
    this.ventaOk.set(null);
    this.idemKey = this.nuevoIdem();
  }

  /** Ahorro total por promociones de una venta ya registrada (para el ticket). */
  ahorroPromo(v: VentaResponse): number {
    return (v.lineas ?? []).reduce((s, l) => s + (Number(l.promo_descuento) || 0), 0);
  }

  /** Filas de promo para el ticket: el desglose si viene, si no la etiqueta única. */
  promosTicket(v: VentaResponse): { promo_etiqueta: string; monto: string }[] {
    return (v.lineas ?? []).flatMap(l => {
      if (l.promos_aplicadas?.length) return l.promos_aplicadas;
      if (l.promo_etiqueta && Number(l.promo_descuento) > 0) {
        return [{ promo_etiqueta: l.promo_etiqueta, monto: l.promo_descuento ?? '0' }];
      }
      return [];
    });
  }

  imprimirTicket(ventaId: string) {
    this.ventaService.ticketPdf(ventaId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => this.sonner.error('No se pudo generar el ticket'),
    });
  }
}
