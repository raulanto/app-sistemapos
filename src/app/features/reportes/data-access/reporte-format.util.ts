/** Los montos/cantidades llegan como string Decimal (ver guía de reportes) — se formatean, no se suman en el cliente. */
export function fmtCurrency(n: number | string | null | undefined): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
}

export function fmtNum(n: number | string | null | undefined, maxDecimals = 0): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: maxDecimals }).format(Number(n) || 0);
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
