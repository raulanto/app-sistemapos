export interface AyudaCategoria {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  articulosCount: number;
}

export interface AyudaArticulo {
  id: string;
  categoriaId: string;
  titulo: string;
  resumen: string;
  contenidoMarkdown: string;
  tags: string[];
  ultimaActualizacion: string;
}

export interface AyudaPreguntaFrecuente {
  id: string;
  categoriaId: string;
  pregunta: string;
  respuesta: string;
}

export interface SupportTicketForm {
  nombre: string;
  email: string;
  asunto: string;
  categoria: string;
  mensaje: string;
}
