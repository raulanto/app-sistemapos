import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';

import { SucursalResponse } from '../../data-access/sucursal.models';

/** Mapa de solo lectura con un marcador por sucursal georreferenciada. */
@Component({
  selector: 'app-sucursal-mapa-lista',
  standalone: true,
  template: `
    <div #mapa class="relative isolate h-140 w-full overflow-hidden rounded-xl border bg-muted"></div>
    @if (conCoords().length === 0) {
      <p class="mt-2 text-center text-sm text-muted-foreground">
        Ninguna sucursal tiene coordenadas registradas todavía.
      </p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SucursalMapaListaComponent {
  private readonly el = viewChild.required<ElementRef<HTMLDivElement>>('mapa');
  private readonly router = inject(Router);

  readonly sucursales = input<SucursalResponse[]>([]);

  private map?: L.Map;
  private layer?: L.LayerGroup;

  conCoords = () =>
    this.sucursales().filter(
      s => s.latitud != null && s.longitud != null && Number.isFinite(+s.latitud) && Number.isFinite(+s.longitud),
    );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.map?.remove());
    afterNextRender(() => this.init());
    effect(() => {
      this.sucursales();
      if (this.map) this.pintar();
    });
  }

  private init() {
    this.map = L.map(this.el().nativeElement, { attributionControl: false }).setView([23.6, -102.5], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.map);
    this.pintar();
    setTimeout(() => this.map?.invalidateSize(), 60);
    setTimeout(() => this.map?.invalidateSize(), 400);
  }

  private pintar() {
    if (!this.map) return;
    this.layer?.remove();
    this.layer = L.layerGroup().addTo(this.map);

    const puntos: L.LatLngTuple[] = [];
    for (const s of this.conCoords()) {
      const p: L.LatLngTuple = [+s.latitud!, +s.longitud!];
      puntos.push(p);
      L.circleMarker(p, {
        radius: 8,
        color: s.activo ? '#16a34a' : '#dc2626',
        fillColor: s.activo ? '#16a34a' : '#dc2626',
        fillOpacity: 0.9,
        weight: 2,
      })
        .bindTooltip(s.nombre)
        .on('click', () => this.router.navigate(['/sucursales', s.id]))
        .addTo(this.layer!);
    }

    if (puntos.length) this.map.fitBounds(L.latLngBounds(puntos).pad(0.2), { maxZoom: 15 });
  }
}
