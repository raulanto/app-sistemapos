import { AyudaArticulo } from '../../ayuda.models';

export const AGENDA_CITAS_ARTICULO: AyudaArticulo = {
  id: 'art-9',
  categoriaId: 'configuracion-usuarios',
  titulo: 'Guía de Agenda: Programación de Citas, Empleados y Recursos',
  resumen: 'Aprende a dar de alta servicios agendables con duración, ofertar turnos a personal capacitado, asignar recursos y cobrar citas en el POS.',
  contenidoMarkdown: `
# Guía de la Agenda y Agendamiento de Citas

El módulo de **Agenda** permite agendar servicios por horario, ofertar citas a empleados capacitados y controlar el uso de recursos físicos (cabinas, sillas, equipo médico o herramientas).

En esta guía comprenderás cómo funciona el flujo de ofertas, la asignación de recursos y el cobro final de un servicio.

---

## 1. Conceptos Fundamentales de la Agenda

- **Servicio Agendable**: Es un producto de tipo *Servicio* al cual se le asigna una **Duración en Minutos** (ej. *Corte de Cabello - 30 min* o *Masaje - 60 min*).
- **Recursos Físicos (Opcional)**: Instalaciones u herramientas necesarias para brindar el servicio (ej. *Silla 1, Cabina A, Sillón Dental*). El sistema impide automáticamente que dos citas ocupen el mismo recurso a la misma hora.
- **Ofertas a Empleados**: Al agendar una cita, el sistema notifica a todo el personal calificado. El primer empleado en **Aceptar** se adjudica la cita.

---

## 2. Cómo Agendar una Cita

1. Dirígete a **Agenda > Nueva Cita**.
2. **Selecciona el Servicio**: Elige el servicio agendable del catálogo.
3. **Selecciona la Fecha y Hora**: Define el horario de inicio. La hora de fin se calcula sola basada en la duración del servicio.
4. **Asigna Cliente y Recurso**: Selecciona el cliente y la cabina/equipo que se ocupará.
5. **Generar Ofertas**: Haz clic en **Agendar Cita**. La cita cambiará a estado *Por Asignar* y se enviará la alerta al personal disponible.

[IMAGEN: Pantalla de agendamiento de nueva cita y selección de horario]

---

## 3. Aceptar Citas por parte del Personal

- Los empleados pueden revisar sus alertas en la app o en **Agenda > Mis Citas**.
- **Aceptar Cita**: La cita pasa a estado **Confirmada** con el empleado asignado.
- **Asignación Manual**: Si nadie acepta la oferta a tiempo, un cajero o gerente puede forzar la asignación a un empleado capacitado.

[IMAGEN: Vista de citas ofertadas y asignación de personal]

---

## 4. Finalización y Cobro en Caja

1. Cuando el empleado termina de atender el servicio, cambia el estado a **Completado**.
2. En la lista de citas o desde el POS, haz clic en **Cobrar Cita**.
3. El sistema cargará el servicio en el carrito del POS con su precio configurado.
4. Procesa el pago en efectivo, tarjeta o monedero para cerrar el ciclo.
`,
  tags: ['agenda', 'citas', 'servicios', 'empleados', 'recursos', 'turnos'],
  ultimaActualizacion: '2026-09-16',
};
