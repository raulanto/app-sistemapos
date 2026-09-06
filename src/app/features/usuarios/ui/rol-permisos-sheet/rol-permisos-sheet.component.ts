import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX } from '@ng-icons/lucide';

import { RolAdminService } from '../../data-access/rol-admin.service';
import { injectSheetData } from '../../../../shared/components/sheet/sheet.service';
import { PermisoResponse, RolResponse } from '../../data-access/usuarios.models';

import { ZardCheckboxComponent } from '../../../../shared/components/checkbox/checkbox.component';
import { ZardInputComponent } from '../../../../shared/components/input/input.component';
import { ZardInputGroupImports } from '../../../../shared/components/input-group/input-group.imports';
import { ZardButtonComponent } from '../../../../shared/components/button/button.component';
import { ZardBadgeComponent } from '../../../../shared/components/badge/badge.component';

export interface RolPermisosSheetData {
  rol: RolResponse;
}

interface GrupoPermisos {
  nombre: string;
  permisos: PermisoResponse[];
}

@Component({
  selector: 'app-rol-permisos-sheet',
  standalone: true,
  imports: [
    FormsModule,
    NgIconComponent,
    ZardCheckboxComponent,
    ZardInputComponent,
    ...ZardInputGroupImports,
    ZardButtonComponent,
    ZardBadgeComponent,
  ],
  templateUrl: './rol-permisos-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'rolPermisosSheet',
  host: { style: 'display: contents' },
  viewProviders: [provideIcons({ lucideSearch, lucideX })],
})
export class RolPermisosSheetComponent implements OnInit {
  private rolService = inject(RolAdminService);

  public sheetData = injectSheetData<RolPermisosSheetData>();

  readonly cargando = signal(true);
  readonly catalogo = signal<PermisoResponse[]>([]);
  readonly seleccionados = signal<Set<string>>(new Set());
  readonly filtro = signal('');

  private readonly permisosOriginales = new Set<string>();

  readonly grupos = computed<GrupoPermisos[]>(() => {
    const q = this.filtro().trim().toLowerCase();
    const porGrupo = new Map<string, PermisoResponse[]>();
    for (const permiso of this.catalogo()) {
      if (q && !permiso.codigo.toLowerCase().includes(q) && !permiso.descripcion.toLowerCase().includes(q)) continue;
      const grupo = permiso.codigo.includes('.') ? permiso.codigo.split('.')[0] : 'general';
      let lista = porGrupo.get(grupo);
      if (!lista) {
        lista = [];
        porGrupo.set(grupo, lista);
      }
      lista.push(permiso);
    }
    return [...porGrupo.entries()]
      .map(([nombre, permisos]) => ({ nombre, permisos }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  readonly totalSeleccionados = computed(() => this.seleccionados().size);

  ngOnInit() {
    const actuales = (this.sheetData?.rol.permisos ?? []).map(p => p.id);
    actuales.forEach(id => this.permisosOriginales.add(id));
    this.seleccionados.set(new Set(actuales));

    this.rolService.listarPermisos().subscribe({
      next: permisos => {
        this.catalogo.set(permisos);
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error al cargar el catálogo de permisos', err);
        this.cargando.set(false);
      },
    });
  }

  estaSeleccionado(id: string): boolean {
    return this.seleccionados().has(id);
  }

  toggle(id: string, checked: boolean) {
    this.seleccionados.update(set => {
      const next = new Set(set);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  toggleGrupo(grupo: GrupoPermisos, marcar: boolean) {
    this.seleccionados.update(set => {
      const next = new Set(set);
      for (const permiso of grupo.permisos) {
        if (marcar) next.add(permiso.id);
        else next.delete(permiso.id);
      }
      return next;
    });
  }

  grupoTodoMarcado(grupo: GrupoPermisos): boolean {
    return grupo.permisos.every(p => this.seleccionados().has(p.id));
  }

  limpiarFiltro() {
    this.filtro.set('');
  }

  save(): Observable<RolResponse | null> | void {
    const deseados = [...this.seleccionados()];
    const actuales = [...this.permisosOriginales];
    return this.rolService.sincronizarPermisos(this.sheetData!.rol.id, actuales, deseados);
  }
}
