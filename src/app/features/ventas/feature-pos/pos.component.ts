import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
} from '@ng-icons/lucide';

import { ProductoService } from '../../inventario/data-access/producto.service';
import { ProductoResponse, UnidadResponse } from '../../inventario/data-access/inventario.models';
import { CajaService } from '../data-access/caja.service';
import { VentaService } from '../data-access/venta.service';
import {
  CajaTurnoResponse,
  ClienteResponse,
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
    }),
  ],
  templateUrl: './pos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosComponent {
  private productoService = inject(ProductoService);
  private cajaService = inject(CajaService);
  private ventaService = inject(VentaService);
  private sheetService = inject(ZardSheetService);
  private sonner = inject(ZardSonnerService);
  private authService = inject(AuthService);

  readonly canVender = computed(() => this.authService.hasPermission(...PERMISOS.ventas.crear));

  readonly metodosPago = METODOS_PAGO;

  readonly turno = signal<CajaTurnoResponse | null>(null);
  readonly cargandoTurno = signal(true);

  readonly productos = signal<ProductoResponse[]>([]);
  readonly cargandoCatalogo = signal(false);
  readonly q = signal('');
  readonly codigo = signal('');

  readonly carrito = signal<LineaCarrito[]>([]);
  readonly descuentoTotal = signal(0);
  readonly pagos = signal<{ monto: number; metodo_pago: MetodoPago }[]>([]);

  readonly clienteBusqueda = signal('');
  readonly clientesEncontrados = signal<ClienteResponse[]>([]);
  readonly cliente = signal<ClienteResponse | null>(null);

  readonly cobrando = signal(false);
  readonly ventaOk = signal<VentaResponse | null>(null);
  /** Un UUID por intento de cobro; se reusa en reintentos y se renueva tras vender. */
  private idemKey = this.nuevoIdem();

  private nuevoIdem() {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  }

  readonly productosFiltrados = computed(() => {
    const t = this.q().trim().toLowerCase();
    const list = this.productos();
    if (!t) return list;
    return list.filter(
      p =>
        p.nombre.toLowerCase().includes(t) ||
        p.sku.toLowerCase().includes(t) ||
        (p.codigo_barras ?? '').toLowerCase().includes(t),
    );
  });

  readonly subtotal = computed(() =>
    this.carrito().reduce((s, l) => s + (l.cantidad * l.precio_unitario - l.descuento_linea), 0),
  );
  readonly total = computed(() => Math.max(0, this.subtotal() - this.descuentoTotal()));
  readonly pagado = computed(() => this.pagos().reduce((s, p) => s + (Number(p.monto) || 0), 0));
  readonly saldoPendiente = computed(() => this.round(this.total() - this.pagado()));
  readonly requiereCliente = computed(() => this.saldoPendiente() > 0.009);
  readonly puedeCobrar = computed(
    () => this.carrito().length > 0 && this.total() > 0 && (!this.requiereCliente() || !!this.cliente()),
  );

  private round(n: number) {
    return Math.round(n * 100) / 100;
  }

  constructor() {
    this.cargarTurno();
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
    this.cargandoCatalogo.set(true);
    this.productoService.listar({ activo: true, page_size: 100, sort: 'nombre:asc', include: ['unidades'] }).subscribe({
      next: res => {
        this.productos.set(res.data);
        this.cargandoCatalogo.set(false);
      },
      error: err => {
        console.error('Error al cargar el catálogo', err);
        this.cargandoCatalogo.set(false);
      },
    });
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
              this.sonner.success(
                dif === 0 ? 'Turno cerrado, la caja cuadra' : `Turno cerrado · diferencia ${dif > 0 ? '+' : ''}${dif.toFixed(2)}`,
              );
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

  setCantidad(key: string, cantidad: number) {
    this.carrito.update(list =>
      list.map(l => {
        if (l.key !== key) return l;
        const min = l.producto.permite_venta_fraccionada ? 0.001 : 1;
        return { ...l, cantidad: Math.max(min, Number(cantidad) || min) };
      }),
    );
  }

  setPrecio(key: string, precio: number) {
    this.carrito.update(list => list.map(l => (l.key === key ? { ...l, precio_unitario: Math.max(0, Number(precio) || 0) } : l)));
  }

  setDescuentoLinea(key: string, d: number) {
    this.carrito.update(list => list.map(l => (l.key === key ? { ...l, descuento_linea: Math.max(0, Number(d) || 0) } : l)));
  }

  quitar(key: string) {
    this.carrito.update(list => list.filter(l => l.key !== key));
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
    this.pagos.update(list => [...list, { monto: this.round(falta || this.total()), metodo_pago: metodo }]);
  }

  setMontoPago(i: number, monto: number) {
    this.pagos.update(list => list.map((p, idx) => (idx === i ? { ...p, monto: Math.max(0, Number(monto) || 0) } : p)));
  }

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

  // --- Cobrar ---

  cobrar() {
    const t = this.turno();
    if (!t || !this.puedeCobrar() || this.cobrando()) return;

    const req: CrearVentaRequest = {
      caja_turno_id: t.id,
      cliente_id: this.requiereCliente() ? this.cliente()!.id : this.cliente()?.id ?? null,
      descuento_total: this.round(this.descuentoTotal()),
      lineas: this.carrito().map(l => ({
        producto_id: l.producto.id,
        cantidad: l.cantidad,
        precio_unitario: this.round(l.precio_unitario),
        descuento_linea: this.round(l.descuento_linea),
        impuesto_tasa: Number(l.producto.impuesto_tasa) || 0,
        producto_unidad_id: l.unidad?.id ?? null,
      })),
      pagos: this.pagos()
        .filter(p => p.monto > 0)
        .map(p => ({ monto: this.round(p.monto), metodo_pago: p.metodo_pago })),
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
        else if (code === 'CajaNoAbierta') {
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
    this.cliente.set(null);
    this.clienteBusqueda.set('');
    this.clientesEncontrados.set([]);
  }

  nuevaVenta() {
    this.ventaOk.set(null);
    this.idemKey = this.nuevoIdem();
  }
}
