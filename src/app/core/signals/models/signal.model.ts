export interface SignalEvent<T = any> {
  modulo: string;
  evento: string;
  data: T;
}
