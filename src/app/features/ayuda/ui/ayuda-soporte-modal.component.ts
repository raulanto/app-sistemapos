import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheckCircle2,
  lucideLifeBuoy,
  lucideMail,
  lucideMessageSquare,
  lucidePhoneCall,
  lucideX,
} from '@ng-icons/lucide';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardInputComponent } from '@/shared/components/input/input.component';
import { SupportTicketForm } from '../data-access/ayuda.models';

@Component({
  selector: 'app-ayuda-soporte-modal',
  imports: [CommonModule, FormsModule, NgIcon, ZardButtonComponent, ZardInputComponent],
  viewProviders: [
    provideIcons({
      lucideLifeBuoy,
      lucidePhoneCall,
      lucideMail,
      lucideMessageSquare,
      lucideX,
      lucideCheckCircle2,
    }),
  ],
  template: `
    <!-- Card Soporte Directo / Contacto Banner -->
    <div class="rounded-3xl border bg-gradient-to-r from-card via-card to-accent/30 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm my-6">
      <div class="space-y-2 text-center md:text-left">
        <div class="inline-flex items-center gap-2 text-primary font-bold text-sm">
          <ng-icon name="lucideLifeBuoy" />
          <span>Soporte Técnico Especializado</span>
        </div>
        <h3 class="text-xl md:text-2xl font-extrabold tracking-tight">¿No encuentras lo que buscas?</h3>
        <p class="text-xs md:text-sm text-muted-foreground max-w-xl leading-relaxed">
          Nuestro equipo de soporte está disponible de Lunes a Sábado de 8:00 AM a 8:00 PM para resolver cualquier inconveniente.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <button z-button zType="outline" (click)="contactarWhatsApp()" class="px-5 py-2.5">
          <ng-icon name="lucidePhoneCall" class="mr-2" />
          <span>WhatsApp Soporte</span>
        </button>
        <button z-button (click)="openModal.emit()" class="px-5 py-2.5">
          <ng-icon name="lucideMail" class="mr-2" />
          <span>Enviar Ticket</span>
        </button>
      </div>
    </div>

    <!-- Modal de Enviar Ticket de Soporte -->
    @if (visible()) {
      <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-card border rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between border-b pb-4">
            <div class="flex items-center gap-2">
              <ng-icon name="lucideMessageSquare" class="text-primary text-xl" />
              <h3 class="font-bold text-lg">Contactar a Soporte</h3>
            </div>
            <button
              type="button"
              (click)="close.emit()"
              class="text-muted-foreground hover:text-foreground p-1.5 rounded-lg"
            >
              <ng-icon name="lucideX" />
            </button>
          </div>

          @if (enviado()) {
            <div class="py-8 text-center space-y-4">
              <ng-icon name="lucideCheckCircle2" class="text-5xl text-emerald-500 mx-auto animate-bounce" />
              <h4 class="font-bold text-xl">¡Ticket Enviado Exitosamente!</h4>
              <p class="text-sm text-muted-foreground max-w-sm mx-auto">
                Hemos recibido tu solicitud. Un especialista de soporte te responderá a tu correo en menos de 2 horas.
              </p>
              <button z-button zType="outline" (click)="close.emit()" class="mt-2 px-6">Aceptar</button>
            </div>
          } @else {
            <form (submit)="enviarFormulario($event)" class="space-y-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Nombre completo</label>
                <input z-input type="text" [(ngModel)]="ticketForm.nombre" name="nombre" required class="w-full" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Correo electrónico</label>
                <input z-input type="email" [(ngModel)]="ticketForm.email" name="email" required class="w-full" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Asunto</label>
                <input z-input type="text" [(ngModel)]="ticketForm.asunto" name="asunto" required class="w-full" />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Mensaje / Detalle de la consulta</label>
                <textarea
                  z-input
                  rows="4"
                  [(ngModel)]="ticketForm.mensaje"
                  name="mensaje"
                  required
                  class="w-full rounded-xl border p-3 text-sm bg-background"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-3">
                <button type="button" z-button zType="ghost" (click)="close.emit()">
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
  `,
})
export class AyudaSoporteModalComponent {
  readonly visible = input<boolean>(false);
  readonly enviando = input<boolean>(false);
  readonly enviado = input<boolean>(false);

  readonly openModal = output<void>();
  readonly close = output<void>();
  readonly submitForm = output<SupportTicketForm>();

  ticketForm: SupportTicketForm = {
    nombre: '',
    email: '',
    asunto: '',
    categoria: 'General',
    mensaje: '',
  };

  contactarWhatsApp() {
    window.open('https://wa.me/9936719807?text=Hola,%20necesito%20soporte%20con%20el%20sistema%20POS', '_blank');
  }

  enviarFormulario(event: Event) {
    event.preventDefault();
    if (!this.ticketForm.nombre || !this.ticketForm.email || !this.ticketForm.mensaje) return;
    this.submitForm.emit({ ...this.ticketForm });
  }
}
