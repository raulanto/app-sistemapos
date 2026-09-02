import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SucursalResponse {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
  links?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SucursalService {
  private http = inject(HttpClient);
  
  private readonly _sucursales = signal<SucursalResponse[]>([]);
  private readonly _selectedSucursalId = signal<string | null>(null);

  readonly sucursales = this._sucursales.asReadonly();
  
  readonly selectedSucursal = computed(() => {
    const id = this._selectedSucursalId();
    if (id && this._sucursales().length > 0) {
      return this._sucursales().find(s => s.id === id) || this._sucursales()[0];
    }
    return this._sucursales()[0] || null;
  });

  readonly selectedSucursalId = computed(() => this.selectedSucursal()?.id);

  constructor() {
    this.cargarSucursales();
  }

  cargarSucursales() {
    this.http.get<ApiResponse<SucursalResponse[]>>(`${environment.apiUrl}/sucursales`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this._sucursales.set(res.data);
          
          // Establecer la primera sucursal como activa si no hay ninguna seleccionada
          if (!this._selectedSucursalId() && res.data.length > 0) {
            this._selectedSucursalId.set(res.data[0].id);
          }
        }
      },
      error: (err) => console.error('Error cargando sucursales:', err)
    });
  }

  setSucursalActiva(id: string) {
    this._selectedSucursalId.set(id);
  }

  setSucursales(sucursales: SucursalResponse[]) {
    this._sucursales.set(sucursales);
  }
}
