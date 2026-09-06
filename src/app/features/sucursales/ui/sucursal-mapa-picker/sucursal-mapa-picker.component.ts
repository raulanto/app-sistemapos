import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';

import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLocateFixed } from '@ng-icons/lucide';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

export interface Coords {
  lat: number;
  lon: number;
}

const DEFAULT: Coords = { lat: 19.4326, lon: -99.1332 }; // CDMX

/** Mapa Leaflet para elegir lat/lon con clic. Marcador SVG (circleMarker), sin assets de iconos. */
@Component({
  selector: 'app-sucursal-mapa-picker',
  standalone: true,
  imports: [NgIconComponent, ZardButtonComponent],
  viewProviders: [provideIcons({ lucideLocateFixed })],
  template: `
    <div class="relative isolate overflow-hidden rounded-md border">
      <div #mapa class="h-64 w-full bg-muted"></div>
      @if (editable()) {
        <button z-button type="button" zType="secondary" zSize="sm" class="absolute right-2 top-2 z-500 shadow" (click)="ubicarme()">
          <ng-icon name="lucideLocateFixed" class="mr-1.5 size-4" /> Mi ubicación
        </button>
      }
    </div>
    @if (editable()) {
      <p class="mt-1.5 text-[0.8rem] text-muted-foreground">Haz clic en el mapa para fijar la ubicación.</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SucursalMapaPickerComponent {
  private readonly el = viewChild.required<ElementRef<HTMLDivElement>>('mapa');

  readonly lat = input<number | null>(null);
  readonly lon = input<number | null>(null);
  readonly editable = input(true);

  readonly coordsChange = output<Coords>();

  private map?: L.Map;
  private marker?: L.CircleMarker;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.map?.remove());

    afterNextRender(() => this.init());

    // Cambios externos de lat/lon (edición manual de los inputs): mueve el marcador sin recentrar.
    effect(() => {
      const lat = this.lat();
      const lon = this.lon();
      if (this.map && lat != null && lon != null) this.setMarker(lat, lon);
    });
  }

  private init() {
    const c: Coords = this.lat() != null && this.lon() != null ? { lat: this.lat()!, lon: this.lon()! } : DEFAULT;

    this.map = L.map(this.el().nativeElement, { attributionControl: false }).setView(
      [c.lat, c.lon],
      this.lat() != null ? 15 : 11,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.map);

    if (this.lat() != null && this.lon() != null) this.setMarker(this.lat()!, this.lon()!);

    if (this.editable()) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const lat = +e.latlng.lat.toFixed(6);
        const lon = +e.latlng.lng.toFixed(6);
        this.setMarker(lat, lon);
        this.coordsChange.emit({ lat, lon });
      });
    }

    // El contenedor puede montarse mid-transición (sheet): un par de recálculos y basta.
    setTimeout(() => this.map?.invalidateSize(), 60);
    setTimeout(() => this.map?.invalidateSize(), 400);
  }

  private setMarker(lat: number, lon: number) {
    if (!this.map) return;
    if (this.marker) {
      this.marker.setLatLng([lat, lon]);
    } else {
      this.marker = L.circleMarker([lat, lon], {
        radius: 8,
        color: '#dc2626',
        fillColor: '#dc2626',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(this.map);
    }
    if (!this.map.getBounds().contains([lat, lon])) this.map.panTo([lat, lon]);
  }

  ubicarme() {
    navigator.geolocation?.getCurrentPosition(pos => {
      const lat = +pos.coords.latitude.toFixed(6);
      const lon = +pos.coords.longitude.toFixed(6);
      this.map?.setView([lat, lon], 15);
      this.setMarker(lat, lon);
      this.coordsChange.emit({ lat, lon });
    });
  }
}
