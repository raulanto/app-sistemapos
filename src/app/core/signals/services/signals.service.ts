import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SignalEvent } from '../models/signal.model';
import { AuthService } from '../../auth/api/auth.service';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class SignalsService {
  private authService = inject(AuthService);
  private sockets: Map<string, WebSocket> = new Map();
  private signalSubject = new Subject<SignalEvent>();

  private getWsBaseUrl(): string {
    const httpUrl = environment.apiUrl;
    const wsProtocol = httpUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrlWithoutProtocol = httpUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${baseUrlWithoutProtocol}/signals`;
  }

  conectar(modulo: string): void {
    if (this.sockets.has(modulo)) {
      return;
    }

    const token = this.authService.accessToken() || '';
    const wsBaseUrl = this.getWsBaseUrl();
    const url = `${wsBaseUrl}/ws/${modulo}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`✅ Conectado al canal WebSocket de [${modulo}]`);
    };

    ws.onmessage = (event) => {
      try {
        const parsed: SignalEvent = JSON.parse(event.data);
        this.signalSubject.next(parsed);
      } catch (err) {
        console.error('Error al procesar la señal del servidor:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn(`Error en conexión WebSocket para el módulo [${modulo}]:`, err);
    };

    ws.onclose = () => {
      console.warn(`⚠️ WebSocket desconectado para el módulo [${modulo}]. Reintentando en 3s...`);
      this.sockets.delete(modulo);
      setTimeout(() => this.conectar(modulo), 3000);
    };

    this.sockets.set(modulo, ws);
  }

  escucharModulo<T = any>(modulo: string): Observable<SignalEvent<T>> {
    return this.signalSubject.asObservable().pipe(
      filter((e) => e.modulo === modulo)
    );
  }

  escucharEvento<T = any>(evento: string): Observable<SignalEvent<T>> {
    return this.signalSubject.asObservable().pipe(
      filter((e) => e.evento === evento)
    );
  }

  desconectar(modulo?: string): void {
    if (modulo) {
      const ws = this.sockets.get(modulo);
      if (ws) {
        ws.close();
        this.sockets.delete(modulo);
      }
    } else {
      this.sockets.forEach((ws) => ws.close());
      this.sockets.clear();
    }
  }
}
