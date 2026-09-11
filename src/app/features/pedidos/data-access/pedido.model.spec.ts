import { mensajePedidoError, siguientesEstadosEntrega } from './models/pedido.model';

describe('siguientesEstadosEntrega', () => {
  it('domicilio: pendiente → en_preparacion → en_reparto → entregado', () => {
    expect(siguientesEstadosEntrega('pendiente', 'domicilio')).toEqual(['en_preparacion']);
    expect(siguientesEstadosEntrega('en_preparacion', 'domicilio')).toEqual(['en_reparto', 'fallido']);
    expect(siguientesEstadosEntrega('en_reparto', 'domicilio')).toEqual(['entregado', 'fallido']);
    expect(siguientesEstadosEntrega('entregado', 'domicilio')).toEqual([]);
  });

  it('recoger: sin en_reparto', () => {
    expect(siguientesEstadosEntrega('en_preparacion', 'recoger')).toEqual(['entregado', 'fallido']);
    expect(siguientesEstadosEntrega('fallido', 'recoger')).toEqual(['en_preparacion']);
  });

  it('fallido en domicilio se puede reintentar por preparación o reparto', () => {
    expect(siguientesEstadosEntrega('fallido', 'domicilio')).toEqual(['en_preparacion', 'en_reparto']);
  });

  it('mostrador / estado nulo no ofrece transiciones', () => {
    expect(siguientesEstadosEntrega(null, 'mostrador')).toEqual([]);
  });
});

describe('mensajePedidoError', () => {
  it('traduce el servicio sin responsable', () => {
    expect(mensajePedidoError('ServicioSinResponsable', 'fallback')).toContain('responsable');
  });

  it('traduce el error de dirección de domicilio', () => {
    expect(mensajePedidoError('Un pedido a domicilio necesita `direccion_texto`.', 'fallback')).toContain('dirección');
  });

  it('deja pasar mensajes desconocidos y cae al fallback si viene vacío', () => {
    expect(mensajePedidoError('Cupón vencido', 'fallback')).toBe('Cupón vencido');
    expect(mensajePedidoError(null, 'fallback')).toBe('fallback');
  });
});
