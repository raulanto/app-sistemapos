import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX, lucideFilterX } from '@ng-icons/lucide';

import { CategoriaResponse } from '../../data-access/inventario.models';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardInputGroupImports } from '../../../../shared/components/input-group/input-group.imports';
import { ZardComboboxImports } from '../../../../shared/components/combobox/combobox.imports';
import { ZardComboboxOption } from '../../../../shared/components/combobox/combobox.types';
import {
  ZardToggleGroupComponent,
  type ZardToggleGroupItem,
} from '../../../../shared/components/toggle-group/toggle-group.component';
import { ZardSwitchComponent } from '../../../../shared/components/switch/switch.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-producto-filtros',
  standalone: true,
  imports: [
    FormsModule,
    NgIconComponent,
    ZardInputComponent,
    ...ZardInputGroupImports,
    ...ZardComboboxImports,
    ZardToggleGroupComponent,
    ZardSwitchComponent,
    ZardButtonComponent,
  ],
  templateUrl: './producto-filtros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideSearch, lucideX, lucideFilterX })],
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

  readonly estadoItems: ZardToggleGroupItem[] = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' },
  ];

  readonly categoriaOptions = computed<ZardComboboxOption[]>(() =>
    this.categorias().map(c => ({ value: c.id, label: c.nombre })),
  );

  /** El toggle-group trabaja con un valor único; `activo` se mantiene como string[] hacia el padre. */
  readonly estadoValue = computed(() => (this.activo().length === 1 ? this.activo()[0] : ''));

  readonly hayFiltrosActivos = computed(
    () => !!this.q() || this.categoriaId().length > 0 || this.activo().length > 0,
  );

  onEstadoChange(value: string | string[]): void {
    const estado = Array.isArray(value) ? (value[0] ?? '') : value;
    this.activoChange.emit(estado ? [estado] : []);
  }

  limpiarBusqueda(): void {
    this.qChange.emit('');
  }

  limpiarFiltros(): void {
    this.qChange.emit('');
    this.categoriaIdChange.emit([]);
    this.activoChange.emit([]);
  }
}
