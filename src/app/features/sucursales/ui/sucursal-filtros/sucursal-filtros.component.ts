import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX, lucideFilterX } from '@ng-icons/lucide';

import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardInputGroupImports } from '../../../../shared/components/input-group/input-group.imports';
import {
  ZardToggleGroupComponent,
  type ZardToggleGroupItem,
} from '../../../../shared/components/toggle-group/toggle-group.component';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-sucursal-filtros',
  standalone: true,
  imports: [
    FormsModule,
    NgIconComponent,
    ZardInputComponent,
    ...ZardInputGroupImports,
    ZardToggleGroupComponent,
    ZardButtonComponent,
  ],
  templateUrl: './sucursal-filtros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideSearch, lucideX, lucideFilterX })],
})
export class SucursalFiltrosComponent {
  q = input<string>('');
  /** `null` = todas, `true` = activas, `false` = inactivas. */
  activo = input<boolean | null>(null);

  qChange = output<string>();
  activoChange = output<boolean | null>();

  readonly estadoItems: ZardToggleGroupItem[] = [
    { value: '', label: 'Todas' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' },
  ];

  readonly estadoValue = computed(() => {
    const val = this.activo();
    return val === null ? '' : val ? 'true' : 'false';
  });

  readonly hayFiltrosActivos = computed(() => !!this.q() || this.activo() !== null);

  onEstadoChange(value: string | string[]): void {
    const estado = Array.isArray(value) ? (value[0] ?? '') : value;
    this.activoChange.emit(estado === '' ? null : estado === 'true');
  }

  limpiarBusqueda(): void {
    this.qChange.emit('');
  }

  limpiarFiltros(): void {
    this.qChange.emit('');
    this.activoChange.emit(null);
  }
}
