import { email, maxLength, required, schema } from '@angular/forms/signals';

export type TipoSucursal = 'bodega_central' | 'tienda' | 'almacen' | 'cedis' | 'oficina';

export const TIPOS_SUCURSAL: { value: TipoSucursal; label: string }[] = [
  { value: 'tienda', label: 'Tienda' },
  { value: 'bodega_central', label: 'Bodega central' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'cedis', label: 'CEDIS' },
  { value: 'oficina', label: 'Oficina' },
];

export interface SucursalResponse {
  id: string;
  codigo: string | null;
  nombre: string;
  tipo: TipoSucursal;
  descripcion: string | null;
  direccion: string;
  colonia: string | null;
  ciudad: string | null;
  estado: string | null;
  codigo_postal: string | null;
  pais: string | null;
  latitud: string | null;
  longitud: string | null;
  telefono: string;
  email: string | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  sucursal_padre_id: string | null;
  permite_ventas: boolean;
  activo: boolean;
  created_at: string;
  imagen_fachada_key: string | null;
  imagen_fachada_url: string | null;
}

export interface CrearSucursalRequest {
  nombre: string;
  direccion: string;
  telefono: string;
  tipo?: TipoSucursal;
  codigo?: string | null;
  descripcion?: string | null;
  colonia?: string | null;
  ciudad?: string | null;
  estado?: string | null;
  codigo_postal?: string | null;
  pais?: string | null;
  latitud?: number | string | null;
  longitud?: number | string | null;
  email?: string | null;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  permite_ventas?: boolean;
}

/**
 * PATCH parcial: los campos opcionales solo se tocan si su flag `cambiar_*`
 * viene en `true` (nombre/direccion/telefono/tipo/permite_ventas van directos).
 */
export interface ActualizarSucursalRequest {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  tipo?: TipoSucursal;
  permite_ventas?: boolean;
  codigo?: string | null;
  cambiar_codigo?: boolean;
  descripcion?: string | null;
  cambiar_descripcion?: boolean;
  colonia?: string | null;
  cambiar_colonia?: boolean;
  ciudad?: string | null;
  cambiar_ciudad?: boolean;
  estado?: string | null;
  cambiar_estado?: boolean;
  codigo_postal?: string | null;
  cambiar_codigo_postal?: boolean;
  pais?: string | null;
  cambiar_pais?: boolean;
  latitud?: number | string | null;
  longitud?: number | string | null;
  cambiar_geo?: boolean;
  email?: string | null;
  cambiar_email?: boolean;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  cambiar_horario?: boolean;
}

/** '' → null tras trim. Para campos de texto opcionales. */
export const limpiar = (v: string | null | undefined): string | null => {
  const t = (v ?? '').trim();
  return t === '' ? null : t;
};

/** Normaliza `HH:mm` de un <input type="time"> a `HH:mm:ss` que espera el backend. */
export const normalizarHora = (v: string | null | undefined): string | null => {
  const t = limpiar(v);
  return t && t.length === 5 ? `${t}:00` : t;
};

/** Valores del formulario de sucursal. Alta y edición comparten forma y reglas. */
export interface SucursalFormValue {
  nombre: string;
  codigo: string;
  tipo: TipoSucursal;
  descripcion: string;
  permite_ventas: boolean;
  telefono: string;
  email: string;
  direccion: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
  latitud: number | null;
  longitud: number | null;
  horario_apertura: string;
  horario_cierre: string;
}

export const SUCURSAL_FORM_INICIAL: SucursalFormValue = {
  nombre: '',
  codigo: '',
  tipo: 'tienda',
  descripcion: '',
  permite_ventas: true,
  telefono: '',
  email: '',
  direccion: '',
  colonia: '',
  ciudad: '',
  estado: '',
  codigo_postal: '',
  pais: 'México',
  latitud: null,
  longitud: null,
  horario_apertura: '',
  horario_cierre: '',
};

/** Reglas de validación compartidas por el sheet de edición y la vista de alta. */
export const sucursalFormSchema = schema<SucursalFormValue>(path => {
  required(path.nombre, { message: 'El nombre es obligatorio.' });
  maxLength(path.nombre, 100, { message: 'Máximo 100 caracteres.' });
  maxLength(path.codigo, 20, { message: 'Máximo 20 caracteres.' });
  required(path.tipo, { message: 'Selecciona un tipo.' });
  required(path.telefono, { message: 'El teléfono es obligatorio.' });
  maxLength(path.telefono, 20, { message: 'Máximo 20 caracteres.' });
  email(path.email, { message: 'Correo inválido.' });
  required(path.direccion, { message: 'La dirección es obligatoria.' });
  maxLength(path.direccion, 255, { message: 'Máximo 255 caracteres.' });
  maxLength(path.colonia, 100, { message: 'Máximo 100 caracteres.' });
  maxLength(path.ciudad, 100, { message: 'Máximo 100 caracteres.' });
  maxLength(path.estado, 100, { message: 'Máximo 100 caracteres.' });
  maxLength(path.codigo_postal, 10, { message: 'Máximo 10 caracteres.' });
  maxLength(path.pais, 60, { message: 'Máximo 60 caracteres.' });
});

export interface SucursalQuery {
  /** Busca en nombre, código, dirección y teléfono. */
  q?: string | null;
  activo?: boolean | null;
  tipo?: TipoSucursal | null;
  page?: number;
  page_size?: number;
  /** `campo:asc|desc`. Campos: codigo, created_at, nombre. */
  sort?: string;
}
