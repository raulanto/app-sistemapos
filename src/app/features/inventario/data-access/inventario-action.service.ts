import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ZardSonnerService } from '../../../shared/components/sonner/sonner.service';

@Injectable({
  providedIn: 'root'
})
export class InventarioActionService {
  private readonly sonner = inject(ZardSonnerService);

  /**
   * Maneja una acción simple (ej. activar, desactivar, eliminar)
   */
  handleAction(
    obs: Observable<any>,
    successMsg: string,
    errorMsg: string,
    onSuccess?: () => void
  ): void {
    obs.subscribe({
      next: () => {
        this.sonner.success(successMsg);
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        console.error(errorMsg, err);
        this.sonner.error(errorMsg);
      }
    });
  }

  /**
   * Maneja el guardado desde un sheet/modal que retorna una promesa
   */
  handleSheetSave(
    obs: Observable<any> | undefined | false,
    successMsg: string,
    errorMsg: string,
    onSuccess?: () => void
  ): Promise<void> | false {
    if (obs) {
      return new Promise<void>((resolve, reject) => {
        obs.subscribe({
          next: () => {
            this.sonner.success(successMsg);
            if (onSuccess) onSuccess();
            resolve();
          },
          error: (err: any) => {
            console.error(errorMsg, err);
            this.sonner.error(errorMsg);
            reject(err);
          }
        });
      });
    }
    return false;
  }
}
