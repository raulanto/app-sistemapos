import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideStar, lucideTrash, lucideArrowUp, lucideArrowDown, lucideImageOff, lucideUpload } from '@ng-icons/lucide';

import { ProductoService } from '../../data-access/producto.service';
import { ImagenResponse, IMAGEN_MAX_BYTES, IMAGEN_TIPOS_PERMITIDOS, SubirImagenRequest } from '../../data-access/inventario.models';

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
 *
 * La carga es por archivo (`POST .../imagenes/upload`, multipart). Las URLs que
 * devuelve el backend salen prefirmadas y expiran (~1 h): `recargar()` en cada
 * apertura de la galería las refresca.
 */
@Component({
  selector: 'app-imagen-galeria',
  standalone: true,
  imports: [
    FormsModule,
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
  viewProviders: [
    provideIcons({ lucidePlus, lucideStar, lucideTrash, lucideArrowUp, lucideArrowDown, lucideImageOff, lucideUpload }),
  ],
})
export class ImagenGaleriaComponent {
  private productoService = inject(ProductoService);
  private sonner = inject(ZardSonnerService);

  readonly productoId = input.required<string>();
  readonly unidadId = input<string | null>(null);

  /** Se emite cuando cambia la galería (agregar/quitar/portada/orden), con la URL de la portada actual o null. */
  readonly cambio = output<string | null>();

  readonly imagenes = signal<ImagenResponse[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  /** Ids de imágenes cuyo <img> falló al cargar (thumbnail y original). */
  readonly rotas = signal<Set<string>>(new Set());
  /** Ids cuyo thumbnail falló: se cae a la imagen original (Lambda de miniaturas puede no existir en dev). */
  readonly thumbRoto = signal<Set<string>>(new Set());

  /** Archivo seleccionado, aún sin subir. */
  readonly archivo = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly altTexto = signal('');
  readonly comoPortada = signal(false);
  readonly errorArchivo = signal<string | null>(null);

  readonly ordenadas = computed(() =>
    [...this.imagenes()].sort((a, b) => a.orden - b.orden || (a.es_principal === b.es_principal ? 0 : a.es_principal ? -1 : 1)),
  );

  constructor() {
    // Recarga cada vez que cambian los ids de entrada (producto o presentación).
    effect(() => {
      this.productoId();
      this.unidadId();
      untracked(() => this.recargar());
    });
    inject(DestroyRef).onDestroy(() => this.revocarPreview());
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
        this.thumbRoto.set(new Set());
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error al cargar imágenes', err);
        this.cargando.set(false);
      },
    });
  }

  /** Fuente a mostrar: thumbnail si existe y no ha fallado; si falló, la imagen original. */
  miniatura(img: ImagenResponse): string | null {
    if (!this.thumbRoto().has(img.id) && img.thumbnail_url) return img.thumbnail_url;
    return img.url ?? null;
  }

  /** Al fallar un <img>: primero reintenta con el original; si ese también falla, se marca roto. */
  onImgError(img: ImagenResponse) {
    if (!this.thumbRoto().has(img.id) && img.thumbnail_url && img.url && img.url !== img.thumbnail_url) {
      this.thumbRoto.update(s => new Set(s).add(img.id));
      return;
    }
    this.marcarRota(img.id);
  }

  private urlPrincipal(): string | null {
    const principal = this.imagenes().find(i => i.es_principal) ?? this.imagenes()[0];
    return principal?.url ?? null;
  }

  private revocarPreview() {
    const prev = this.previewUrl();
    if (prev) URL.revokeObjectURL(prev);
  }

  setArchivo(file: File | null) {
    this.revocarPreview();
    this.errorArchivo.set(null);

    if (!file) {
      this.archivo.set(null);
      this.previewUrl.set(null);
      return;
    }
    if (!(IMAGEN_TIPOS_PERMITIDOS as readonly string[]).includes(file.type)) {
      this.archivo.set(null);
      this.previewUrl.set(null);
      this.errorArchivo.set('Formato no permitido. Usa JPG, PNG o WebP.');
      return;
    }
    if (file.size > IMAGEN_MAX_BYTES) {
      this.archivo.set(null);
      this.previewUrl.set(null);
      this.errorArchivo.set('La imagen supera 5 MiB.');
      return;
    }
    this.archivo.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  onFileInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.setArchivo(input.files?.[0] ?? null);
    input.value = ''; // permite volver a elegir el mismo archivo
  }

  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.setArchivo(ev.dataTransfer?.files?.[0] ?? null);
  }

  private ejecutar(obs: Observable<unknown>, okMsg: string, onOk?: () => void) {
    this.guardando.set(true);
    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.sonner.success(okMsg);
        onOk?.();
        // Recargar y notificar tras un pequeño respiro para que el backend confirme.
        setTimeout(() => {
          this.recargar();
          setTimeout(() => this.cambio.emit(this.urlPrincipal()), 300);
        }, 150);
      },
      error: err => {
        this.guardando.set(false);
        console.error(err);
        const msg = err?.status === 400
          ? 'Formato no permitido o imagen mayor a 5 MiB.'
          : 'No se pudo completar la operación con la imagen';
        this.sonner.error(msg);
      },
    });
  }

  agregar() {
    const file = this.archivo();
    if (!file || this.guardando()) return;

    const pid = this.productoId();
    const uid = this.unidadId();
    const primera = this.imagenes().length === 0;
    const payload: SubirImagenRequest = {
      file,
      alt_texto: this.altTexto().trim() || null,
      orden: this.imagenes().length,
      es_principal: this.comoPortada() || primera,
    };
    const obs = uid
      ? this.productoService.subirImagenUnidad(pid, uid, payload)
      : this.productoService.subirImagen(pid, payload);
    this.ejecutar(obs, 'Imagen subida', () => {
      this.setArchivo(null);
      this.altTexto.set('');
      this.comoPortada.set(false);
    });
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
