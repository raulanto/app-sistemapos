import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBookOpen } from '@ng-icons/lucide';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { AyudaService } from '../data-access/ayuda.service';
import { AyudaArticulo, SupportTicketForm } from '../data-access/ayuda.models';
import { AyudaHeroBannerComponent } from '../ui/ayuda-hero-banner.component';
import { AyudaCategoriaFilterComponent } from '../ui/ayuda-categoria-filter.component';
import { AyudaArticuloCardComponent } from '../ui/ayuda-articulo-card.component';
import { AyudaArticuloDetailComponent } from '../ui/ayuda-articulo-detail.component';
import { AyudaFaqListComponent } from '../ui/ayuda-faq-list.component';
import { AyudaSoporteModalComponent } from '../ui/ayuda-soporte-modal.component';

@Component({
  selector: 'app-ayuda-center',
  imports: [
    CommonModule,
    NgIcon,
    ZardEmptyComponent,
    AyudaHeroBannerComponent,
    AyudaCategoriaFilterComponent,
    AyudaArticuloCardComponent,
    AyudaArticuloDetailComponent,
    AyudaFaqListComponent,
    AyudaSoporteModalComponent,
  ],
  viewProviders: [provideIcons({ lucideBookOpen })],
  template: `
    <div class="space-y-12 md:space-y-16 p-6 md:p-10 lg:p-12 max-w-9xl mx-auto">
      <!-- Detalle del Artículo Seleccionado -->
      @if (ayudaService.selectedArticulo(); as articulo) {
        <app-ayuda-articulo-detail
          [articulo]="articulo"
          [categoriaTitulo]="getCategoriaTitulo(articulo.categoriaId)"
          (back)="ayudaService.selectArticulo(null)"
          (openContacto)="abrirContactoModal()"
          (marcarUtil)="marcarUtil()"
        />
      } @else {
        <!-- Banner Hero con Buscador -->
        <app-ayuda-hero-banner
          [searchQuery]="ayudaService.searchQuery()"
          (searchQueryChange)="ayudaService.setSearchQuery($event)"
        />

        <!-- Filtro de Categorías -->
        <app-ayuda-categoria-filter
          [categorias]="ayudaService.categorias()"
          [selectedCategoriaId]="ayudaService.selectedCategoriaId()"
          (categoriaSelected)="ayudaService.selectCategoria($event)"
        />

        <!-- Listado de Artículos / Guías -->
        <div class="space-y-6 mt-4">
          <div class="flex items-center justify-between border-b border-border/60 pb-3">
            <div class="flex items-center gap-2.5">
              <ng-icon name="lucideBookOpen" class="text-primary text-lg" />
              <h2 class="text-xl font-bold tracking-tight">
                Guías y Artículos
                @if (ayudaService.searchQuery()) {
                  <span class="text-sm font-normal text-muted-foreground ml-2">
                    (Búsqueda: "{{ ayudaService.searchQuery() }}")
                  </span>
                }
              </h2>
            </div>
            <span class="text-sm font-medium text-muted-foreground">
              {{ ayudaService.articulosFiltrados().length }} artículo(s)
            </span>
          </div>

          @if (ayudaService.articulosFiltrados().length === 0) {
            <z-empty class="py-12">
              <ng-icon name="lucideBookOpen" class="text-4xl text-muted-foreground mb-3" />
              <p class="font-semibold text-base">No se encontraron artículos</p>
              <p class="text-sm text-muted-foreground mt-1">
                Prueba buscando con otros términos o elige otra categoría.
              </p>
            </z-empty>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              @for (art of ayudaService.articulosFiltrados(); track art.id) {
                <app-ayuda-articulo-card
                  [articulo]="art"
                  [categoriaTitulo]="getCategoriaTitulo(art.categoriaId)"
                  (articuloSelected)="ayudaService.selectArticulo($event)"
                />
              }
            </div>
          }
        </div>

        <!-- Preguntas Frecuentes (FAQ) -->
        <app-ayuda-faq-list [faqs]="ayudaService.faqs()" />

        <!-- Banner y Modal de Soporte -->
        <app-ayuda-soporte-modal
          [visible]="mostrarModalContacto()"
          [enviando]="enviando()"
          [enviado]="ticketEnviado()"
          (openModal)="abrirContactoModal()"
          (close)="mostrarModalContacto.set(false)"
          (submitForm)="enviarFormulario($event)"
        />
      }
    </div>
  `,
})
export class AyudaCenterComponent {
  readonly ayudaService = inject(AyudaService);

  readonly mostrarModalContacto = signal(false);
  readonly enviando = signal(false);
  readonly ticketEnviado = signal(false);

  getCategoriaTitulo(catId: string): string {
    const cat = this.ayudaService.categorias().find((c) => c.id === catId);
    return cat ? cat.titulo : 'General';
  }

  marcarUtil() {
    alert('¡Gracias por tus comentarios! Nos ayuda a mejorar el centro de ayuda.');
  }

  abrirContactoModal() {
    this.ticketEnviado.set(false);
    this.mostrarModalContacto.set(true);
  }

  async enviarFormulario(form: SupportTicketForm) {
    this.enviando.set(true);
    await this.ayudaService.enviarTicketSoporte(form);
    this.enviando.set(false);
    this.ticketEnviado.set(true);
  }
}
