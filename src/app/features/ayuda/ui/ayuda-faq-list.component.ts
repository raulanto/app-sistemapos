import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHelpCircle } from '@ng-icons/lucide';
import { AyudaPreguntaFrecuente } from '../data-access/ayuda.models';

@Component({
  selector: 'app-ayuda-faq-list',
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ lucideHelpCircle })],
  template: `
    <div class="space-y-6 pt-10 border-t border-border/60">
      <div class="space-y-1">
        <h2 class="text-xl font-bold tracking-tight">Preguntas Frecuentes (FAQ)</h2>
        <p class="text-sm text-muted-foreground">Respuestas rápidas a las dudas más habituales.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        @for (faq of faqs(); track faq.id) {
          <div class="p-6 md:p-7 rounded-2xl border bg-card space-y-3 shadow-2xs">
            <div class="flex items-start gap-3">
              <ng-icon name="lucideHelpCircle" class="text-primary text-xl mt-0.5 shrink-0" />
              <h3 class="font-bold text-base leading-snug">{{ faq.pregunta }}</h3>
            </div>
            <p class="text-xs md:text-sm text-muted-foreground pl-8 leading-relaxed">
              {{ faq.respuesta }}
            </p>
          </div>
        }
      </div>
    </div>
  `,
})
export class AyudaFaqListComponent {
  readonly faqs = input.required<AyudaPreguntaFrecuente[]>();
}
