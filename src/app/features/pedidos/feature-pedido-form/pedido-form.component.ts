import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideLayers,
  lucideLayoutGrid,
  lucideList,
  lucideMapPin,
  lucideClock,
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
  lucideCheck,
  lucideTruck,
  lucideUser,
  lucideFileText,
  lucideChevronRight,
} from '@ng-icons/lucide';

import { ZardButtonComponent } from '../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../shared/components/badge/badge.component';
import { ZardInputComponent } from '../../../shared/components/input/input.component';
import { ZardTextareaComponent } from '../../../shared/components/textarea/textarea.component';
import { ZardSelectImports } from '../../../shared/components/select/select.imports';
import { ZardEmptyComponent } from '../../../shared/components/empty/empty.component';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

import { PedidoFormStore, LineaCarrito } from './pedido-form.store';
import { ProductoResponse, UnidadResponse } from '../../inventario/data-access/inventario.models';

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
  providers: [PedidoFormStore],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideLayers,
      lucideLayoutGrid,
      lucideList,
      lucideMapPin,
      lucideClock,
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
      lucideCheck,
      lucideTruck,
      lucideUser,
      lucideFileText,
      lucideChevronRight,
    }),
  ],
  templateUrl: './pedido-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly store = inject(PedidoFormStore);

  readonly pasoActivo = signal<number>(1);

  // --- Aliases for HTML compatibility ---
  readonly canDescuentoManual = this.store.canDescuentoManual;
  readonly tipos = this.store.tipos;
  readonly canales = this.store.canales;
  readonly pedidoId = this.store.pedidoId;
  readonly esEdicion = this.store.esEdicion;
  readonly cargando = this.store.cargando;
  readonly guardando = this.store.guardando;

  readonly tipo = this.store.tipo;
  readonly canal = this.store.canal;
  readonly telefono = this.store.telefono;
  readonly notas = this.store.notas;
  readonly codigoCupon = this.store.codigoCupon;
  readonly descuentoTotal = this.store.descuentoTotal;
  readonly motivoDescuento = this.store.motivoDescuento;
  readonly direccionTexto = this.store.direccionTexto;
  readonly referenciaDireccion = this.store.referenciaDireccion;
  readonly fechaPromesa = this.store.fechaPromesa;
  readonly cliente = this.store.cliente;

  readonly productos = this.store.productos;
  readonly categorias = this.store.categorias;
  readonly cargandoCatalogo = this.store.cargandoCatalogo;
  readonly q = this.store.q;
  readonly categoriaSel = this.store.categoriaSel;
  readonly vista = this.store.vista;
  readonly imgRoto = this.store.imgRoto;

  readonly carrito = this.store.carrito;
  readonly cotizacion = this.store.cotizacion;
  readonly cotizando = this.store.cotizando;
  readonly usuarios = this.store.usuarios;

  readonly esDomicilio = this.store.esDomicilio;
  readonly esEntrega = this.store.esEntrega;

  readonly subtotalLocal = this.store.subtotalLocal;
  readonly totalPromos = this.store.totalPromos;
  readonly totalMercancia = this.store.totalMercancia;
  readonly total = this.store.total;
  readonly hayDescuentoManual = this.store.hayDescuentoManual;
  readonly faltaMotivo = this.store.faltaMotivo;
  readonly hayLineaInvalida = this.store.hayLineaInvalida;
  readonly faltaDireccion = this.store.faltaDireccion;
  readonly faltaResponsable = this.store.faltaResponsable;
  readonly serviciosSinResponsable = this.store.serviciosSinResponsable;
  readonly puedeGuardar = this.store.puedeGuardar;

  readonly productosFiltrados = this.store.productosFiltrados;
  readonly bloques = this.store.bloques;
  readonly categoriasConProductos = this.store.categoriasConProductos;

  ngOnInit() {
    this.store.inicializar(this.route.snapshot.paramMap.get('id'));
  }

  // --- Delegated Methods ---
  lineaBruto(l: LineaCarrito): number { return this.store.lineaBruto(l); }
  lineaSubtotal(l: LineaCarrito): number { return this.store.lineaSubtotal(l); }
  seleccionarCategoria(id: string | null) { this.store.seleccionarCategoria(id); }
  imgSrc(it: { producto: ProductoResponse; unidad: UnidadResponse | null }): string | null { return this.store.imgSrc(it); }
  marcarImgRota(src: string | null) { this.store.marcarImgRota(src); }
  setVista(v: 'grid' | 'lista') { this.store.setVista(v); }
  precioDe(p: ProductoResponse, u: UnidadResponse | null) { return this.store.precioDe(p, u); }
  agregar(p: ProductoResponse, u: UnidadResponse | null = null) { this.store.agregar(p, u); }
  setAsignado(key: string, usuarioId: string | null) { this.store.setAsignado(key, usuarioId); }
  setCantidad(key: string, cantidad: number) { this.store.setCantidad(key, cantidad); }
  paso(key: string, delta: 1 | -1) { this.store.paso(key, delta); }
  setPrecio(key: string, precio: number) { this.store.setPrecio(key, precio); }
  setDescuentoLinea(key: string, d: number) { this.store.setDescuentoLinea(key, d); }
  quitar(key: string) { this.store.quitar(key); }
  setDescuentoTotal(v: number) { this.store.setDescuentoTotal(v); }
  promoDeLinea(l: LineaCarrito): { etiqueta: string; descuento: number } | null { return this.store.promoDeLinea(l); }
  sinStock(l: LineaCarrito): boolean { return this.store.sinStock(l); }
  guardar(confirmar = false) { this.store.guardar(confirmar); }
}
