export interface ClienteResponse {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  limite_credito: string;
  saldo_credito: string;
  activo: boolean;
}
