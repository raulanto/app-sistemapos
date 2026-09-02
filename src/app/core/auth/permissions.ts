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
  ventas: {
    crear: ['ventas.crear', 'VENTA_CREAR'],
    leer: ['ventas.leer'],
    anular: ['ventas.anular', 'VENTA_CANCELAR'],
  },
  reportes: {
    leer: ['reportes.leer', 'REP_VER'],
  },
  auditoria: {
    leer: ['auditoria.leer'],
  },
} as const;
