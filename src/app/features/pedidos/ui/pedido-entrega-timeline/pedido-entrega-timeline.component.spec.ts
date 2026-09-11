import { TestBed } from '@angular/core/testing';

import { PedidoEntregaTimelineComponent } from './pedido-entrega-timeline.component';

function crear(tipo: 'domicilio' | 'recoger', estado: string | null, siguientes: string[] = []) {
  const f = TestBed.createComponent(PedidoEntregaTimelineComponent);
  f.componentRef.setInput('tipo', tipo);
  f.componentRef.setInput('estado', estado);
  f.componentRef.setInput('siguientes', siguientes);
  return f.componentInstance;
}

/** Estados de cada paso, en orden, para el tipo/estado dados. */
function estados(tipo: 'domicilio' | 'recoger', estado: string | null): string[] {
  return crear(tipo, estado).pasos().map(p => p.estado);
}

describe('PedidoEntregaTimelineComponent · pasos()', () => {
  it('domicilio incluye 4 pasos; recoger salta «en reparto»', () => {
    expect(estados('domicilio', null)).toHaveLength(4);
    expect(estados('recoger', null)).toHaveLength(3);
  });

  it('marca hechos los anteriores, actual el vigente y pendientes los siguientes', () => {
    expect(estados('domicilio', 'en_reparto')).toEqual(['done', 'done', 'actual', 'pendiente']);
  });

  it('entregado deja todo el flujo como hecho', () => {
    expect(estados('domicilio', 'entregado')).toEqual(['done', 'done', 'done', 'done']);
  });

  it('fallido marca el último paso como fallido y el resto como intentado', () => {
    expect(estados('domicilio', 'fallido')).toEqual(['done', 'done', 'done', 'fallido']);
  });

  it('sin estado_entrega no hay ningún paso hecho', () => {
    expect(estados('domicilio', null)).toEqual(['pendiente', 'pendiente', 'pendiente', 'pendiente']);
  });

  it('sólo los pasos en `siguientes` son accionables', () => {
    const c = crear('domicilio', 'en_preparacion', ['en_reparto', 'fallido']);
    expect(c.pasos().filter(p => p.accionable).map(p => p.key)).toEqual(['en_reparto']);
    expect(c.puedeFallar()).toBe(true);
  });
});
