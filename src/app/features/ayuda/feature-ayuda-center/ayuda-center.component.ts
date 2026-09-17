import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBookOpen,
  lucideBoxes,
  lucideChartColumn,
  lucideCheckCircle2,
  lucideChevronRight,
  lucideClipboardList,
  lucideHelpCircle,
  lucideLifeBuoy,
  lucideMail,
  lucideMessageSquare,
  lucidePhoneCall,
  lucideSearch,
  lucideShoppingCart,
  lucideSparkles,
  lucideThumbsUp,
  lucideUserCog,
  lucideUserRound,
  lucideX,
} from '@ng-icons/lucide';

import { ZardCardImports } from '@/shared/components/card/card.imports';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardInputComponent } from '@/shared/components/input/input.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';

import { AyudaService } from '../data-access/ayuda.service';
import { AyudaArticulo, SupportTicketForm } from '../data-access/ayuda.models';

@Component({
  selector: 'app-ayuda-center',
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    ...ZardCardImports,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardInputComponent,
    ZardEmptyComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideSearch,
      lucideHelpCircle,
      lucideBookOpen,
      lucideMessageSquare,
      lucideChevronRight,
      lucideArrowLeft,
      lucidePhoneCall,
      lucideMail,
      lucideCheckCircle2,
      lucideSparkles,
      lucideThumbsUp,
      lucideShoppingCart,
      lucideBoxes,
      lucideClipboardList,
      lucideUserRound,
      lucideChartColumn,
      lucideUserCog,
      lucideLifeBuoy,
      lucideX,
    }),
  ],
  template: `
    <div class="space-y-8 p-6 max-w-7xl mx-auto">
      <!-- Vista Detalle de Artículo -->
      @if (ayudaService.selectedArticulo(); as articulo) {
        <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
          <div class="flex items-center justify-between">
            <button
              z-button
              zType="ghost"
              (click)="ayudaService.selectArticulo(null)"
              class="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ng-icon name="lucideArrowLeft" />
              <span>Volver a la lista de artículos</span>
            </button>

            <span class="text-xs text-muted-foreground">
              Ayuda / {{ getCategoriaTitulo(articulo.categoriaId) }}
            </span>
          </div>

          <z-card class="p-8 md:p-12 space-y-8 shadow-sm border border-border/60">
            <div class="border-b border-border/60 pb-6 space-y-4">
              <div class="flex flex-wrap items-center gap-3">
                <z-badge zVariant="secondary" class="px-3 py-1 font-medium">{{ getCategoriaTitulo(articulo.categoriaId) }}</z-badge>
                <span class="text-xs text-muted-foreground">Actualizado: {{ articulo.ultimaActualizacion }}</span>
              </div>
              <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {{ articulo.titulo }}
              </h1>
              <p class="text-muted-foreground text-base md:text-lg leading-relaxed">
                {{ articulo.resumen }}
              </p>
            </div>

            <!-- Visualización directa del documento con typeset (sin contenedores o bordes anidados) -->
            <div class="typeset typeset-docs">
              <div [innerHTML]="getParsedHtml(articulo.contenidoMarkdown)"></div>
            </div>

            <div class="pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etiquetas:</span>
                @for (tag of articulo.tags; track tag) {
                  <z-badge zVariant="outline" class="text-xs">#{{ tag }}</z-badge>
                }
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-muted-foreground">¿Te fue útil este artículo?</span>
                <button z-button zType="outline" zSize="sm" (click)="marcarUtil()">
                  <ng-icon name="lucideThumbsUp" class="mr-1" />
                  <span>Sí</span>
                </button>
                <button z-button zType="outline" zSize="sm" (click)="abrirContactoModal()">
                  <ng-icon name="lucideMail" class="mr-1" />
                  <span>Contacto</span>
                </button>
              </div>
            </div>
          </z-card>
        </div>
      } @else {
        <!-- Banner / Header Hero (versión compacta y elegante) -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground p-6 md:p-8 shadow-md">
          <div class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div class="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium tracking-wide">
              <ng-icon name="lucideSparkles" class="text-amber-300" />
              <span>Centro de Ayuda y Guías POS</span>
            </div>

            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">
              ¿En qué podemos ayudarte?
            </h1>

            <!-- Search Bar -->
            <div class="relative max-w-xl mx-auto">
              <ng-icon name="lucideSearch" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg" />
              <input
                z-input
                type="text"
                [ngModel]="ayudaService.searchQuery()"
                (ngModelChange)="ayudaService.setSearchQuery($event)"
                placeholder="Buscar guías o artículos (ej. ventas, arqueo, stock, lotes)..."
                class="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl bg-background text-foreground shadow-md focus-visible:ring-2 focus-visible:ring-white/50 border-0"
              />
              @if (ayudaService.searchQuery()) {
                <button
                  type="button"
                  (click)="ayudaService.setSearchQuery('')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <ng-icon name="lucideX" />
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Filtro de Categorías (Compacto / Mini Cards) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold tracking-tight text-foreground">Categorías</h2>
            @if (ayudaService.selectedCategoriaId()) {
              <button
                z-button
                zType="ghost"
                zSize="sm"
                (click)="ayudaService.selectCategoria(null)"
                class="text-xs text-primary hover:underline h-auto p-0"
              >
                Limpiar filtro
              </button>
            }
          </div>

          <!-- Grid compacto de categorías -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            @for (cat of ayudaService.categorias(); track cat.id) {
              <button
                type="button"
                (click)="ayudaService.selectCategoria(cat.id === ayudaService.selectedCategoriaId() ? null : cat.id)"
                [class.bg-primary/10]="cat.id === ayudaService.selectedCategoriaId()"
                [class.border-primary]="cat.id === ayudaService.selectedCategoriaId()"
                [class.text-primary]="cat.id === ayudaService.selectedCategoriaId()"
                class="group p-3 rounded-xl border bg-card hover:border-primary/50 transition-all text-left flex flex-col justify-between space-y-2 shadow-2xs hover:shadow-xs"
              >
                <div class="flex items-center justify-between w-full">
                  <div class="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ng-icon [name]="cat.icono" class="text-sm" />
                  </div>
                  <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {{ cat.articulosCount }}
                  </span>
                </div>
                <span class="font-semibold text-xs leading-snug line-clamp-1 group-hover:text-primary">
                  {{ cat.titulo }}
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Listado de Artículos / Guías (Destacado y Puntual) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-border/50 pb-2">
            <div class="flex items-center gap-2">
              <ng-icon name="lucideBookOpen" class="text-primary text-base" />
              <h2 class="text-lg font-bold tracking-tight">
                Guías y Artículos
                @if (ayudaService.searchQuery()) {
                  <span class="text-xs font-normal text-muted-foreground ml-1">
                    (Búsqueda: "{{ ayudaService.searchQuery() }}")
                  </span>
                }
              </h2>
            </div>
            <span class="text-xs font-medium text-muted-foreground">
              {{ ayudaService.articulosFiltrados().length }} artículo(s)
            </span>
          </div>

          @if (ayudaService.articulosFiltrados().length === 0) {
            <z-empty class="py-10">
              <ng-icon name="lucideBookOpen" class="text-3xl text-muted-foreground mb-2" />
              <p class="font-semibold text-sm">No se encontraron artículos</p>
              <p class="text-xs text-muted-foreground">
                Prueba buscando con otros términos o elige otra categoría.
              </p>
            </z-empty>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (art of ayudaService.articulosFiltrados(); track art.id) {
                <div
                  (click)="ayudaService.selectArticulo(art)"
                  class="group p-4 rounded-xl border bg-card hover:border-primary/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <z-badge zVariant="secondary" class="text-[10px] px-2 py-0.5">
                        {{ getCategoriaTitulo(art.categoriaId) }}
                      </z-badge>
                      <span class="text-[10px] text-muted-foreground">{{ art.ultimaActualizacion }}</span>
                    </div>

                    <h3 class="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {{ art.titulo }}
                    </h3>

                    <p class="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {{ art.resumen }}
                    </p>
                  </div>

                  <div class="flex items-center justify-between pt-2 border-t border-border/40 text-xs font-medium text-primary">
                    <div class="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span>Etiquetas:</span>
                      <span class="font-semibold text-foreground">#{{ art.tags[0] }}</span>
                    </div>
                    <div class="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Leer</span>
                      <ng-icon name="lucideChevronRight" />
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Preguntas Frecuentes (FAQ) -->
        <div class="space-y-4 pt-4 border-t">
          <div class="space-y-1">
            <h2 class="text-xl font-bold tracking-tight">Preguntas Frecuentes (FAQ)</h2>
            <p class="text-sm text-muted-foreground">Respuestas rápidas a las dudas más habituales.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (faq of ayudaService.faqs(); track faq.id) {
              <div class="p-5 rounded-xl border bg-card space-y-2">
                <div class="flex items-start gap-2">
                  <ng-icon name="lucideHelpCircle" class="text-primary text-lg mt-0.5 shrink-0" />
                  <h3 class="font-semibold text-sm">{{ faq.pregunta }}</h3>
                </div>
                <p class="text-xs text-muted-foreground pl-6 leading-relaxed">
                  {{ faq.respuesta }}
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Card Soporte Directo / Contacto -->
        <div class="rounded-2xl border bg-gradient-to-r from-card via-card to-accent/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div class="space-y-2 text-center md:text-left">
            <div class="inline-flex items-center gap-2 text-primary font-semibold text-sm">
              <ng-icon name="lucideLifeBuoy" />
              <span>Soporte Técnico Especializado</span>
            </div>
            <h3 class="text-xl font-bold">¿No encuentras lo que buscas?</h3>
            <p class="text-xs md:text-sm text-muted-foreground max-w-xl">
              Nuestro equipo de soporte está disponible de Lunes a Sábado de 8:00 AM a 8:00 PM para resolver cualquier inconveniente.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 shrink-0">
            <button z-button zType="outline" (click)="contactarWhatsApp()">
              <ng-icon name="lucidePhoneCall" class="mr-2" />
              <span>WhatsApp Soporte</span>
            </button>
            <button z-button (click)="abrirContactoModal()">
              <ng-icon name="lucideMail" class="mr-2" />
              <span>Enviar Ticket</span>
            </button>
          </div>
        </div>
      }

      <!-- Modal de Enviar Ticket de Soporte -->
      @if (mostrarModalContacto()) {
        <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-card border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b pb-3">
              <div class="flex items-center gap-2">
                <ng-icon name="lucideMessageSquare" class="text-primary text-xl" />
                <h3 class="font-bold text-lg">Contactar a Soporte</h3>
              </div>
              <button
                type="button"
                (click)="mostrarModalContacto.set(false)"
                class="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <ng-icon name="lucideX" />
              </button>
            </div>

            @if (ticketEnviado()) {
              <div class="py-8 text-center space-y-3">
                <ng-icon name="lucideCheckCircle2" class="text-5xl text-emerald-500 mx-auto animate-bounce" />
                <h4 class="font-bold text-lg">¡Ticket Enviado Exitosamente!</h4>
                <p class="text-sm text-muted-foreground">
                  Hemos recibido tu solicitud. Un especialista de soporte te responderá a tu correo en menos de 2 horas.
                </p>
                <button z-button zType="outline" (click)="cerrarModalConfirmado()">Aceptar</button>
              </div>
            } @else {
              <form (submit)="enviarFormulario($event)" class="space-y-4">
                <div class="space-y-1">
                  <label class="text-xs font-semibold text-muted-foreground">Nombre completo</label>
                  <input z-input type="text" [(ngModel)]="ticketForm.nombre" name="nombre" required class="w-full" />
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-semibold text-muted-foreground">Correo electrónico</label>
                  <input z-input type="email" [(ngModel)]="ticketForm.email" name="email" required class="w-full" />
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-semibold text-muted-foreground">Asunto</label>
                  <input z-input type="text" [(ngModel)]="ticketForm.asunto" name="asunto" required class="w-full" />
                </div>

                <div class="space-y-1">
                  <label class="text-xs font-semibold text-muted-foreground">Mensaje / Detalle de la consulta</label>
                  <textarea
                    z-input
                    rows="4"
                    [(ngModel)]="ticketForm.mensaje"
                    name="mensaje"
                    required
                    class="w-full rounded-md border p-2 text-sm bg-background"
                  ></textarea>
                </div>

                <div class="flex items-center justify-end gap-3 pt-2">
                  <button type="button" z-button zType="ghost" (click)="mostrarModalContacto.set(false)">
                    Cancelar
                  </button>
                  <button type="submit" z-button [disabled]="enviando()">
                    @if (enviando()) {
                      <span>Enviando...</span>
                    } @else {
                      <span>Enviar Solicitud</span>
                    }
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AyudaCenterComponent {
  readonly ayudaService = inject(AyudaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly mostrarModalContacto = signal(false);
  readonly enviando = signal(false);
  readonly ticketEnviado = signal(false);

  getParsedHtml(content: string): SafeHtml {
    if (!content) return '';
    const rawHtml = this.parseMarkdownToHtml(content);
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  private parseMarkdownToHtml(markdown: string): string {
    const lines = markdown.trim().split('\n');
    const result: string[] = [];
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        const itemContent = trimmed.replace(/^-\s+/, '').replace(/^\d+\.\s+/, '');
        result.push(`<li>${this.formatInline(itemContent)}</li>`);
        continue;
      } else if (inList) {
        result.push('</ul>');
        inList = false;
      }

      if (trimmed.startsWith('[IMAGEN:') && trimmed.endsWith(']')) {
        const caption = trimmed.slice(8, -1).trim();
        result.push(`
          <div class="my-6 rounded-xl border-2 border-dashed border-border/70 bg-muted/30 p-6 text-center space-y-2">
            <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-background border shadow-xs text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
            <p class="text-xs font-medium text-muted-foreground">[Captura de pantalla: <span class="font-semibold text-foreground">${caption}</span>]</p>
          </div>
        `);
        continue;
      }

      if (trimmed.startsWith('# ')) {
        result.push(`<h1>${this.formatInline(trimmed.slice(2))}</h1>`);
      } else if (trimmed.startsWith('## ')) {
        result.push(`<h2>${this.formatInline(trimmed.slice(3))}</h2>`);
      } else if (trimmed.startsWith('### ')) {
        result.push(`<h3>${this.formatInline(trimmed.slice(4))}</h3>`);
      } else if (trimmed.startsWith('> ')) {
        result.push(`<blockquote><p>${this.formatInline(trimmed.slice(2))}</p></blockquote>`);
      } else if (trimmed === '---') {
        result.push('<hr />');
      } else if (trimmed.length > 0) {
        result.push(`<p>${this.formatInline(trimmed)}</p>`);
      }
    }

    if (inList) {
      result.push('</ul>');
    }

    return result.join('\n');
  }

  private formatInline(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  ticketForm: SupportTicketForm = {
    nombre: '',
    email: '',
    asunto: '',
    categoria: 'General',
    mensaje: '',
  };

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

  contactarWhatsApp() {
    window.open('https://wa.me/5215555555555?text=Hola,%20necesito%20soporte%20con%20el%20sistema%20POS', '_blank');
  }

  cerrarModalConfirmado() {
    this.mostrarModalContacto.set(false);
    this.ticketEnviado.set(false);
    this.ticketForm = { nombre: '', email: '', asunto: '', categoria: 'General', mensaje: '' };
  }

  async enviarFormulario(event: Event) {
    event.preventDefault();
    if (!this.ticketForm.nombre || !this.ticketForm.email || !this.ticketForm.mensaje) return;

    this.enviando.set(true);
    await this.ayudaService.enviarTicketSoporte(this.ticketForm);
    this.enviando.set(false);
    this.ticketEnviado.set(true);
  }
}
