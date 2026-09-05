import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideStar, lucideTrash, lucideArrowUp, lucideArrowDown, lucideImageOff } from '@ng-icons/lucide';

import { ProductoService } from '../../data-access/producto.service';
import { ImagenResponse, AgregarImagenRequest } from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardEmptyComponent } from '../../../../shared/components/empty/empty.component';
import { ZardSonnerService } from '../../../../shared/components/sonner/sonner.service';

/**
 * Galería de imágenes reutilizable para un producto o para una de sus presentaciones.
 * - Sin `unidadId` => imágenes del producto (`/productos/{id}/imagenes`).
 * - Con `unidadId`  => imágenes de la presentación (`/productos/{id}/unidades/{unidadId}/imagenes`).
 */
@Component({
  selector: 'app-imagen-galeria',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIconComponent,
    ...ZardFieldImports,
    ZardInputComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardCheckboxComponent,
    ZardEmptyComponent,
  ],
  templateUrl: './imagen-galeria.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucidePlus, lucideStar, lucideTrash, lucideArrowUp, lucideArrowDown, lucideImageOff })],
})
export class ImagenGaleriaComponent {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private sonner = inject(ZardSonnerService);

  readonly productoId = input.required<string>();
  readonly unidadId = input<string | null>(null);

  /** Se emite cuando cambia la galería (agregar/quitar/portada/orden), con la URL de la portada actual o null. */
  readonly cambio = output<string | null>();

  readonly imagenes = signal<ImagenResponse[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  /** Ids de imágenes cuyo <img> falló al cargar. */
  readonly rotas = signal<Set<string>>(new Set());

  readonly ordenadas = computed(() =>
    [...this.imagenes()].sort((a, b) => a.orden - b.orden || (a.es_principal === b.es_principal ? 0 : a.es_principal ? -1 : 1)),
  );

  form = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
    alt_texto: [''],
    es_principal: [false],
  });

  constructor() {
    // Recarga cada vez que cambian los ids de entrada (producto o presentación).
    effect(() => {
      this.productoId();
      this.unidadId();
      untracked(() => this.recargar());
    });
  }

  recargar() {
    const pid = this.productoId();
    if (!pid) return;
    this.cargando.set(true);
    const obs = this.unidadId()
      ? this.productoService.listarImagenesUnidad(pid, this.unidadId()!)
      : this.productoService.listarImagenes(pid);
    obs.subscribe({
      next: imgs => {
        this.imagenes.set(imgs);
        this.rotas.set(new Set());
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error al cargar imágenes', err);
        this.cargando.set(false);
      },
    });
  }

  private urlPrincipal(): string | null {
    return this.imagenes().find(i => i.es_principal)?.url ?? this.imagenes()[0]?.url ?? null;
  }

  private ejecutar(obs: Observable<unknown>, okMsg: string) {
    this.guardando.set(true);
    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.sonner.success(okMsg);
        // Recargar y notificar tras un pequeño respiro para que el backend confirme.
        setTimeout(() => {
          this.recargar();
          setTimeout(() => this.cambio.emit(this.urlPrincipal()), 300);
        }, 150);
      },
      error: err => {
        this.guardando.set(false);
        console.error(err);
        this.sonner.error('No se pudo completar la operación con la imagen');
      },
    });
  }

  agregar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const pid = this.productoId();
    const uid = this.unidadId();
    const payload: AgregarImagenRequest = {
      url: this.form.value.url!.trim(),
      alt_texto: this.form.value.alt_texto?.trim() || null,
      orden: this.imagenes().length,
      es_principal: !!this.form.value.es_principal || this.imagenes().length === 0,
    };
    const obs = uid
      ? this.productoService.agregarImagenUnidad(pid, uid, payload)
      : this.productoService.agregarImagen(pid, payload);
    this.ejecutar(obs, 'Imagen agregada');
    this.form.reset({ url: '', alt_texto: '', es_principal: false });
  }

  marcarPrincipal(img: ImagenResponse) {
    if (img.es_principal) return;
    const pid = this.productoId();
    const uid = this.unidadId();
    const obs = uid
      ? this.productoService.actualizarImagenUnidad(pid, uid, img.id, { es_principal: true })
      : this.productoService.actualizarImagen(pid, img.id, { es_principal: true });
    this.ejecutar(obs, 'Portada actualizada');
  }

  mover(img: ImagenResponse, delta: -1 | 1) {
    const lista = this.ordenadas();
    const i = lista.findIndex(x => x.id === img.id);
    const j = i + delta;
    if (j < 0 || j >= lista.length) return;
    const pid = this.productoId();
    const uid = this.unidadId();
    // Intercambia el `orden` de ambas.
    const a = lista[i];
    const b = lista[j];
    const patchA = uid
      ? this.productoService.actualizarImagenUnidad(pid, uid, a.id, { orden: b.orden })
      : this.productoService.actualizarImagen(pid, a.id, { orden: b.orden });
    patchA.subscribe({
      next: () => {
        const patchB = uid
          ? this.productoService.actualizarImagenUnidad(pid, uid, b.id, { orden: a.orden })
          : this.productoService.actualizarImagen(pid, b.id, { orden: a.orden });
        this.ejecutar(patchB, 'Orden actualizado');
      },
      error: err => {
        console.error(err);
        this.sonner.error('No se pudo reordenar');
      },
    });
  }

  eliminar(img: ImagenResponse) {
    const pid = this.productoId();
    const uid = this.unidadId();
    const obs = uid
      ? this.productoService.eliminarImagenUnidad(pid, uid, img.id)
      : this.productoService.eliminarImagen(pid, img.id);
    this.ejecutar(obs, 'Imagen eliminada');
  }

  marcarRota(id: string) {
    this.rotas.update(s => new Set(s).add(id));
  }
}
