import { AyudaPreguntaFrecuente } from '../ayuda.models';

export const AYUDA_FAQS: AyudaPreguntaFrecuente[] = [
  {
    id: 'faq-1',
    categoriaId: 'ventas-caja',
    pregunta: '¿Qué hago si se interrumpe la conexión a internet durante una venta?',
    respuesta: 'El sistema POS cuenta con caché local para registrar ventas en modo fuera de línea. Cuando se restablezca la conexión, las transacciones se sincronizarán automáticamente con el servidor.',
  },
  {
    id: 'faq-2',
    categoriaId: 'inventario-productos',
    pregunta: '¿Cómo realizo un ajuste de inventario por merma o producto dañado?',
    respuesta: 'Ve a Inventario > Productos, selecciona el producto deseado y haz clic en "Ajustar Stock". Selecciona el motivo ("Merma", "Daño" o "Auditoría") e ingresa la cantidad a descontar.',
  },
  {
    id: 'faq-3',
    categoriaId: 'configuracion-usuarios',
    pregunta: '¿Cómo cambio los permisos de un cajero para restringir descuentos?',
    respuesta: 'Ingresa a Usuarios > Roles y Permisos. Edita el rol de Cajero y desmarca la casilla "Ventas: Descuento Manual". Los cambios se aplicarán inmediatamente en el siguiente inicio de sesión.',
  },
  {
    id: 'faq-4',
    categoriaId: 'reportes-analitica',
    pregunta: '¿Puedo programar el envío del corte de caja diario por correo electrónico?',
    respuesta: 'Sí, desde el módulo Reportes > Programados puedes crear una regla automática para recibir el resumen de ventas e inventario al cierre del día.',
  },
];
