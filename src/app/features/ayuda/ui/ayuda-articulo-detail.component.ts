import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideMail, lucideThumbsUp } from '@ng-icons/lucide';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardCardImports } from '@/shared/components/card/card.imports';
import { AyudaArticulo } from '../data-access/ayuda.models';

@Component({
  selector: 'app-ayuda-articulo-detail',
  imports: [CommonModule, NgIcon, ZardButtonComponent, ZardBadgeComponent, ...ZardCardImports],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideThumbsUp, lucideMail })],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div class="flex items-center justify-between">
        <button
          z-button
          zType="ghost"
          (click)="back.emit()"
          class="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ng-icon name="lucideArrowLeft" />
          <span>Volver a la lista de artículos</span>
        </button>

        <span class="text-xs text-muted-foreground">
          Ayuda / {{ categoriaTitulo() }}
        </span>
      </div>

      <z-card class="p-8 md:p-12 space-y-8 shadow-sm border border-border/60">
        <div class="border-b border-border/60 pb-6 space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <z-badge zVariant="secondary" class="px-3 py-1 font-medium">{{ categoriaTitulo() }}</z-badge>
            <span class="text-xs text-muted-foreground">Actualizado: {{ articulo().ultimaActualizacion }}</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {{ articulo().titulo }}
          </h1>
          <p class="text-muted-foreground text-base md:text-lg leading-relaxed">
            {{ articulo().resumen }}
          </p>
        </div>

        <!-- Visualización directa del documento con typeset -->
        <div class="typeset typeset-docs">
          <div [innerHTML]="getParsedHtml(articulo().contenidoMarkdown)"></div>
        </div>

        <div class="pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etiquetas:</span>
            @for (tag of articulo().tags; track tag) {
              <z-badge zVariant="outline" class="text-xs">#{{ tag }}</z-badge>
            }
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-muted-foreground">¿Te fue útil este artículo?</span>
            <button z-button zType="outline" zSize="sm" (click)="marcarUtil.emit()">
              <ng-icon name="lucideThumbsUp" class="mr-1" />
              <span>Sí</span>
            </button>
            <button z-button zType="outline" zSize="sm" (click)="openContacto.emit()">
              <ng-icon name="lucideMail" class="mr-1" />
              <span>Contacto</span>
            </button>
          </div>
        </div>
      </z-card>
    </div>
  `,
})
export class AyudaArticuloDetailComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly articulo = input.required<AyudaArticulo>();
  readonly categoriaTitulo = input<string>('General');

  readonly back = output<void>();
  readonly openContacto = output<void>();
  readonly marcarUtil = output<void>();

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
}
