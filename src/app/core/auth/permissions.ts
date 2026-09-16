/**
 * Catálogo de permisos por módulo. Cada acción mapea a los códigos equivalentes
 * que el backend acepta (conviven la convención `modulo.accion` y la legada en mayúsculas).
 * AuthService.hasPermission acepta cualquiera de los códigos listados (OR).
 */
export const PERMISOS = {
  usuarios: {
    crear: ['usuarios.crear'],
    leer: ['usuarios.leer'],
    editar: ['usuarios.editar'],
    desactivar: ['usuarios.desactivar'],
  },
  roles: {
    gestionar: ['roles.gestionar', 'USR_ADMIN'],
  },
  inventario: {
    crear: ['inventario.crear'],
    editar: ['inventario.editar'],
    leer: ['inventario.leer', 'INV_VER'],
    movimiento: ['inventario.movimiento', 'INV_AJUSTE'],
  },
  clientes: {
    crear: ['clientes.crear', 'CLI_CREAR'],
    leer: ['clientes.leer'],
    editar: ['clientes.editar'],
    eliminar: ['clientes.eliminar'],
    credito: ['clientes.credito.gestionar', 'CLI_CREDITO'],
  },
  monedero: {
    /** Ajustar (cargar/corregir) saldos de monedero. Consultar saldo/ledger usa `clientes.leer`. */
    ajustar: ['monedero.ajustar'],
  },
  ventas: {
    crear: ['ventas.crear', 'VENTA_CREAR'],
    leer: ['ventas.leer'],
    anular: ['ventas.anular', 'VENTA_CANCELAR'],
    devolver: ['ventas.devolver'],
    /** Teclear descuento manual (`descuento_linea` / `descuento_total`) en la venta. */
    descuentoManual: ['ventas.descuento_manual'],
  },
  caja: {
    /** Abrir/cerrar turno, movimientos y arqueo. `ventas.crear` también lo habilita. */
    operar: ['caja.operar', 'ventas.crear', 'VENTA_CREAR'],
    /** Alta/baja/rename de terminales físicas. */
    administrar: ['caja.administrar'],
    /** Cerrar u operar el turno de otro cajero (turno abandonado). */
    forzarCierre: ['caja.forzar_cierre'],
    /** Conciliar un turno `cerrado_con_diferencia`. */
    autorizarDiferencia: ['caja.autorizar_diferencia'],
    /** Histórico de turnos y efectivo en tiempo real. */
    verHistorico: ['caja.ver_historico'],
  },
  promociones: {
    crear: ['promociones.crear'],
    editar: ['promociones.editar'],
    leer: ['promociones.leer', 'ventas.leer'],
  },
  pedidos: {
    crear: ['pedidos.crear'],
    leer: ['pedidos.leer'],
    editar: ['pedidos.editar'],
    confirmar: ['pedidos.confirmar'],
    cancelar: ['pedidos.cancelar'],
    /** Asignar repartidor y avanzar `estado_entrega`. */
    repartir: ['pedidos.repartir'],
    /** Emitir la venta de un pedido confirmado. */
    facturar: ['pedidos.facturar'],
  },
  agenda: {
    /** Alta/baja de recursos, calificar empleados, cargar horarios/excepciones. */
    administrar: ['agenda.administrar'],
    /** Crear, listar todas, reofertar, asignar manual, iniciar/completar/cancelar/no-show, facturar cualquier cita. */
    gestionar: ['citas.gestionar'],
    /** Ver sólo las citas propias (ofertadas o asignadas). */
    verPropias: ['citas.ver_propias', 'citas.gestionar'],
    /** Aceptar/rechazar una oferta propia; iniciar/completar la propia. */
    responderOferta: ['citas.responder_oferta'],
  },
  proveedores: {
    leer: ['proveedores.leer'],
    crear: ['proveedores.crear'],
    editar: ['proveedores.editar'],
    /** Vincular/desvincular productos a un proveedor, marcar principal. */
    productoProveedor: ['producto_proveedor.gestionar'],
  },
  pedidoProveedor: {
    leer: ['pedido_proveedor.leer'],
    gestionar: ['pedido_proveedor.gestionar'],
    /** Disparar el motor de reorden. */
    generarManual: ['pedido_proveedor.generar_manual'],
    /** Autorizar que el pedido salga (borrador -> enviado). Sólo admin/gerente. */
    confirmarEnvio: ['pedido_proveedor.confirmar_envio'],
  },
  recepcionProveedor: {
    leer: ['recepcion_proveedor.leer'],
    registrar: ['recepcion_proveedor.registrar'],
  },
  devolucionProveedor: {
    leer: ['devolucion_proveedor.leer'],
    gestionar: ['devolucion_proveedor.gestionar'],
  },
  reportes: {
    leer: ['reportes.leer', 'REP_VER'],
    /** Descargar cualquier reporte en CSV/Excel/PDF (`?formato=`). Sin esto la vista JSON sigue igual. */
    exportar: ['reportes.exportar'],
    /** CRUD de reportes programados (envío periódico por correo). */
    programar: ['reportes.programar'],
  },
  auditoria: {
    leer: ['auditoria.leer'],
  },
} as const;
