import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaResponse } from '../../data-access/inventario.models';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardSelectImports } from '../../../../shared/components/select/select.imports';
import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';

@Component({
  selector: 'app-producto-filtros',
  standalone: true,
  imports: [
    FormsModule,
    ZardInputComponent,
    ...ZardSelectImports,
    ZardCheckboxComponent
  ],
  templateUrl: './producto-filtros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductoFiltrosComponent {
  q = input<string>('');
  categorias = input<CategoriaResponse[]>([]);
  categoriaId = input<string[]>([]);
  activo = input<string[]>([]);
  todasLasSucursales = input<boolean>(false);

  qChange = output<string>();
  categoriaIdChange = output<string[]>();
  activoChange = output<string[]>();
  todasLasSucursalesChange = output<boolean>();
}
