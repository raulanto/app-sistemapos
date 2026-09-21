import { Injectable, computed, signal } from '@angular/core';
import { AyudaArticulo, AyudaCategoria, AyudaPreguntaFrecuente, SupportTicketForm } from './ayuda.models';
import { AYUDA_CATEGORIAS } from './mock/ayuda-categorias.mock';
import { AYUDA_ARTICULOS } from './mock/ayuda-articulos.mock';
import { AYUDA_FAQS } from './mock/ayuda-faqs.mock';

@Injectable({
  providedIn: 'root',
})
export class AyudaService {
  readonly searchQuery = signal<string>('');
  readonly selectedCategoriaId = signal<string | null>(null);
  readonly selectedArticulo = signal<AyudaArticulo | null>(null);

  readonly categorias = signal<AyudaCategoria[]>(AYUDA_CATEGORIAS);
  readonly articulos = signal<AyudaArticulo[]>(AYUDA_ARTICULOS);
  readonly faqs = signal<AyudaPreguntaFrecuente[]>(AYUDA_FAQS);

  readonly articulosFiltrados = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const catId = this.selectedCategoriaId();
    let result = this.articulos();

    if (catId) {
      result = result.filter((a) => a.categoriaId === catId);
    }

    if (query) {
      result = result.filter(
        (a) =>
          a.titulo.toLowerCase().includes(query) ||
          a.resumen.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result;
  });

  selectCategoria(catId: string | null) {
    this.selectedCategoriaId.set(catId);
    this.selectedArticulo.set(null);
  }

  selectArticulo(articulo: AyudaArticulo | null) {
    this.selectedArticulo.set(articulo);
  }

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  enviarTicketSoporte(form: SupportTicketForm): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 800);
    });
  }
}
