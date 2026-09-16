import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucidePhone,
  lucideReceiptText,
  lucideTicket,
  lucideX,
} from '@ng-icons/lucide';

import { ProductoResponse, UnidadResponse } from '../../inventario/data-access/inventario.models';
import { ClienteService } from '../../clientes/data-access/cliente.service';
import { CajaService } from '../data-access/caja.service';
import { VentaService } from '../data-access/venta.service';
import {
  CajaTurnoResponse,
  ClienteResponse,
  CotizacionVentaResponse,
  CrearVentaRequest,
  MetodoPago,
  VentaResponse,
} from '../data-access/ventas.models';
import { AuthService } from '@/core/auth/api/auth.service';
import { PERMISOS } from '@/core/auth/permissions';

import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ZardSheetService } from '../../../shared/components/sheet/sheet.service';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';
import { AbrirCajaSheetComponent } from '../ui/abrir-caja-sheet/abrir-caja-sheet.component';
import { CerrarCajaSheetComponent } from '../ui/cerrar-caja-sheet/cerrar-caja-sheet.component';
import { MovimientosCajaSheetComponent } from '../ui/movimientos-caja-sheet/movimientos-caja-sheet.component';
import { PosHeaderComponent } from '../ui/pos-header/pos-header.component';
import { PosTurnoVacioComponent } from '../ui/pos-turno-vacio/pos-turno-vacio.component';
import { PosCatalogoComponent } from '../ui/pos-catalogo/pos-catalogo.component';
import { PosCarritoComponent, type LineaVista } from '../ui/pos-carrito/pos-carrito.component';
import { PosPagosComponent } from '../ui/pos-pagos/pos-pagos.component';
import { PosClienteCreditoComponent } from '../ui/pos-cliente-credito/pos-cliente-credito.component';
import { PosTicketComponent } from '../ui/pos-ticket/pos-ticket.component';

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
    FormsModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardInputComponent,
    ZardSkeletonComponent,
    PosHeaderComponent,
    PosTurnoVacioComponent,
    PosCatalogoComponent,
    PosCarritoComponent,
    PosPagosComponent,
    PosClienteCreditoComponent,
    PosTicketComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideCircleCheck,
      lucidePhone,
      lucideReceiptText,
      lucideTicket,
      lucideX,
    }),
  ],
  templateUrl: './pos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosComponent {
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

  readonly turno = signal<CajaTurnoResponse | null>(null);
  readonly cargandoTurno = signal(true);

  private readonly posRoot = viewChild<ElementRef<HTMLElement>>('posRoot');
  readonly isFullscreen = signal(false);

  /** Sucursal del turno activo; el catálogo la usa para acotar sus productos. */
  readonly catalogoSucursalId = computed(() => this.turno()?.sucursal_id ?? null);
  /** Se incrementa para pedirle al catálogo que recargue (p. ej. tras cobrar). */
  readonly catalogoRefrescarTick = signal(0);

  readonly carrito = signal<LineaCarrito[]>([]);
  /** Línea con sus controles desplegados; el resto se muestra colapsado (acordeón). */
  readonly expandedLinea = signal<string | null>(null);
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

  /** Vista de sólo-lectura del carrito para `app-pos-carrito` (evita pasarle 6 funciones). */
  readonly lineasVista = computed<LineaVista[]>(() =>
    this.carrito().map(l => {
      const promo = this.promoDeLinea(l);
      return {
        key: l.key,
        producto: l.producto,
        unidad: l.unidad,
        cantidad: l.cantidad,
        precioUnitario: l.precio_unitario,
        descuentoLinea: l.descuento_linea,
        precioEfectivo: this.precioEfectivo(l),
        aplicaMayoreo: this.aplicaMayoreo(l),
        subtotalMostrado: this.lineaSubtotal(l) - (promo?.descuento ?? 0),
        promo,
        promos: this.promosDeLinea(l),
        sinStock: this.sinStock(l),
        invalida: !(l.cantidad > 0),
      };
    }),
  );

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
  /** Lo que el cliente entrega ahora (efectivo/tarjeta): el total menos lo cubierto por el monedero. */
  readonly aCobrar = computed(() => this.round(Math.max(0, this.total() - this.monederoUsado())));
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

    const fsAbort = new AbortController();
    document.addEventListener('fullscreenchange', () => this.isFullscreen.set(!!document.fullscreenElement), {
      signal: fsAbort.signal,
    });
    inject(DestroyRef).onDestroy(() => fsAbort.abort());

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
      },
      error: err => {
        console.error('Error al leer el turno', err);
        this.cargandoTurno.set(false);
      },
    });
  }

  // --- Pantalla completa ---

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.posRoot()?.nativeElement.requestFullscreen();
    }
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
    if (this.ventaOk()) this.nuevaVenta(); // tocar un producto tras cobrar arranca la siguiente venta
    const key = `${p.id}:${u?.id ?? 'base'}`;
    const existe = this.carrito().find(l => l.key === key);
    if (existe) {
      this.setCantidad(key, existe.cantidad + 1);
    } else {
      // Fraccionable (peso/volumen): arranca en 0 para forzar capturar el peso real, no "1 kg".
      const cantidad = p.permite_venta_fraccionada ? 0 : 1;
      this.carrito.update(list => [
        ...list,
        { key, producto: p, unidad: u, cantidad, precio_unitario: this.precioDe(p, u), descuento_linea: 0 },
      ]);
    }
    // La última línea tocada queda desplegada; las anteriores se colapsan para una lista limpia.
    this.expandedLinea.set(key);
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

  /** Despliega/colapsa los controles de una línea (acordeón: sólo una abierta). */
  toggleLinea(key: string) {
    this.expandedLinea.update(k => (k === key ? null : key));
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
    if (metodo === 'monedero') return this.usarMonedero();
    const falta = Math.max(0, this.saldoPendiente());
    const monto = this.round(falta || this.total());
    this.pagos.update(list => [...list, { monto, metodo_pago: metodo }]);
  }

  /**
   * El monedero se aplica como un vale contra la cuenta: consume el saldo disponible
   * (tope = total) y deja el resto listo para cobrar en efectivo. No es crédito.
   * Recalcula efectivo y un monedero previo; conserva tarjeta/transferencia.
   */
  private usarMonedero() {
    const usar = this.round(Math.min(this.monederoDisponible(), this.total()));
    if (usar <= 0) return;
    const otros = this.pagos().filter(p => p.metodo_pago !== 'monedero' && p.metodo_pago !== 'efectivo');
    const cubiertoOtros = otros.reduce((s, p) => s + (Number(p.monto) || 0), 0);
    const efectivo = this.round(this.total() - usar - cubiertoOtros);
    this.pagos.set([
      { monto: usar, metodo_pago: 'monedero' },
      ...otros,
      ...(efectivo > 0.009 ? [{ monto: efectivo, metodo_pago: 'efectivo' as MetodoPago }] : []),
    ]);
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
    const usar = this.round(this.monederoUsado());
    const efectivo = this.round(this.total() - usar);
    this.pagos.set([
      ...(usar > 0.009 ? [{ monto: usar, metodo_pago: 'monedero' as MetodoPago }] : []),
      ...(efectivo > 0.009 ? [{ monto: efectivo, metodo_pago: 'efectivo' as MetodoPago }] : []),
    ]);
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
        // Refresca el catálogo (stock embebido) mientras corre la animación del ticket,
        // así la siguiente venta arranca con existencias actualizadas.
        this.catalogoRefrescarTick.update(v => v + 1);
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
