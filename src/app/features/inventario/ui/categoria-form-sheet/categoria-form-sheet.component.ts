import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';

import { CategoriaService } from '../../data-access/categoria.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import {
  CategoriaResponse,
  CrearCategoriaRequest,
  ActualizarCategoriaRequest,
} from '../../data-access/inventario.models';

import { ZardFieldImports } from '../../../../shared/components/field/field.imports';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';

export interface CategoriaSheetData {
  categoria?: CategoriaResponse;
  /** Sugiere padre al crear (botón "+" en una fila padre). */
  padreSugeridoId?: string;
}

@Component({
  selector: 'app-categoria-form-sheet',
  standalone: true,
  imports: [FormField, ...ZardFieldImports, ZardInputComponent, ...ZardSelectImports],
  templateUrl: './categoria-form-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'categoriaFormSheet',
  host: { style: 'display: contents' },
})
export class CategoriaFormSheetComponent implements OnInit {
  private categoriaService = inject(CategoriaService);

  public sheetData = injectSheetData<CategoriaSheetData | undefined>();

  readonly categorias = signal<CategoriaResponse[]>([]);
  isEditing = false;

  private readonly model = signal({ nombre: '', categoria_padre_id: '' });

  protected readonly categoriaForm = form(this.model, path => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    maxLength(path.nombre, 100, { message: 'Máximo 100 caracteres.' });
  });

  ngOnInit() {
    const cat = this.sheetData?.categoria;
    this.isEditing = !!cat;

    this.categoriaService.listar().subscribe({
      next: data => this.categorias.set(data.filter(c => c.activo && c.id !== cat?.id)),
      error: err => console.error('Error al cargar categorías', err),
    });

    this.model.set({
      nombre: cat?.nombre ?? '',
      categoria_padre_id: cat?.categoria_padre_id ?? this.sheetData?.padreSugeridoId ?? '',
    });
  }

  save(): Observable<CategoriaResponse> | void {
    const root = this.categoriaForm();
    if (!root.valid()) {
      root.markAsTouched();
      return;
    }
    const d = this.model();
    const padre = d.categoria_padre_id || null;

    if (this.isEditing && this.sheetData?.categoria) {
      const payload: ActualizarCategoriaRequest = {
        nombre: d.nombre,
        categoria_padre_id: padre,
        cambiar_padre: this.categoriaForm.categoria_padre_id().dirty(),
      };
      return this.categoriaService.actualizar(this.sheetData.categoria.id, payload);
    }

    const payload: CrearCategoriaRequest = { nombre: d.nombre, categoria_padre_id: padre };
    return this.categoriaService.crear(payload);
  }
}
