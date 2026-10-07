import { Injectable, signal, computed, effect } from '@angular/core';
import {
  LayoutConfig,
  SidebarConfig,
  HeaderConfig,
  ContentConfig,
  SidebarItemOrderItem,
} from './layout-config.model';
import { DEFAULT_LAYOUT_CONFIG } from './layout-config.defaults';

const STORAGE_KEY = 'ui-layout-config-v1';

@Injectable({
  providedIn: 'root',
})
export class LayoutConfigService {
  readonly config = signal<LayoutConfig>(this.loadInitialConfig());

  readonly sidebar = computed<SidebarConfig>(() => this.config().sidebar);
  readonly header = computed<HeaderConfig>(() => this.config().header);
  readonly content = computed<ContentConfig>(() => this.config().content);
  readonly itemsOrder = computed<SidebarItemOrderItem[]>(() => this.config().sidebar.itemsOrder);

  constructor() {
    effect(() => {
      const current = this.config();
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch (e) {
          console.warn('No se pudo guardar la configuración del layout en localStorage:', e);
        }
      }
    });
  }

  private loadInitialConfig(): LayoutConfig {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as LayoutConfig;
          // Combinar con defaults para asegurar que campos nuevos existan
          return this.mergeWithDefaults(parsed);
        }
      } catch (e) {
        console.warn('Error al leer configuración previa del layout:', e);
      }
    }
    return JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG));
  }

  private mergeWithDefaults(saved: Partial<LayoutConfig>): LayoutConfig {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG)) as LayoutConfig;
    if (!saved) return defaults;

    // Asegurar que itemsOrder contenga todos los items definidos en defaults
    const defaultItems = defaults.sidebar.itemsOrder;
    const savedItems = saved.sidebar?.itemsOrder || [];

    const mergedItems: SidebarItemOrderItem[] = [];
    const seenIds = new Set<string>();

    for (const item of savedItems) {
      if (defaultItems.some((d) => d.id === item.id)) {
        mergedItems.push(item);
        seenIds.add(item.id);
      }
    }

    // Agregar items nuevos que no estaban en la versión guardada
    for (const d of defaultItems) {
      if (!seenIds.has(d.id)) {
        mergedItems.push(d);
      }
    }

    return {
      version: defaults.version,
      lastUpdated: saved.lastUpdated ?? new Date().toISOString(),
      sidebar: {
        ...defaults.sidebar,
        ...(saved.sidebar || {}),
        itemsOrder: mergedItems,
      },
      header: {
        ...defaults.header,
        ...(saved.header || {}),
      },
      content: {
        ...defaults.content,
        ...(saved.content || {}),
      },
    };
  }

  updateSidebar(partial: Partial<SidebarConfig>): void {
    this.config.update((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      sidebar: {
        ...prev.sidebar,
        ...partial,
      },
    }));
  }

  updateHeader(partial: Partial<HeaderConfig>): void {
    this.config.update((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      header: {
        ...prev.header,
        ...partial,
      },
    }));
  }

  updateContent(partial: Partial<ContentConfig>): void {
    this.config.update((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      content: {
        ...prev.content,
        ...partial,
      },
    }));
  }

  toggleSidebarItemVisibility(id: string): void {
    this.config.update((prev) => {
      const items = prev.sidebar.itemsOrder.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      );
      return {
        ...prev,
        lastUpdated: new Date().toISOString(),
        sidebar: {
          ...prev.sidebar,
          itemsOrder: items,
        },
      };
    });
  }

  moveSidebarItemUp(id: string): void {
    this.config.update((prev) => {
      const items = [...prev.sidebar.itemsOrder];
      const index = items.findIndex((item) => item.id === id);
      if (index <= 0) return prev;

      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;

      return {
        ...prev,
        lastUpdated: new Date().toISOString(),
        sidebar: {
          ...prev.sidebar,
          itemsOrder: items,
        },
      };
    });
  }

  moveSidebarItemDown(id: string): void {
    this.config.update((prev) => {
      const items = [...prev.sidebar.itemsOrder];
      const index = items.findIndex((item) => item.id === id);
      if (index < 0 || index >= items.length - 1) return prev;

      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;

      return {
        ...prev,
        lastUpdated: new Date().toISOString(),
        sidebar: {
          ...prev.sidebar,
          itemsOrder: items,
        },
      };
    });
  }

  setSidebarItemsOrder(items: SidebarItemOrderItem[]): void {
    this.config.update((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      sidebar: {
        ...prev.sidebar,
        itemsOrder: items,
      },
    }));
  }

  resetToDefaults(): void {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_LAYOUT_CONFIG));
    this.config.set(defaults);
  }

  exportAsJson(): string {
    return JSON.stringify(this.config(), null, 2);
  }

  importFromJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr) as LayoutConfig;
      if (!parsed || typeof parsed !== 'object' || !parsed.sidebar || !parsed.header) {
        throw new Error('Estructura de configuración inválida');
      }
      const merged = this.mergeWithDefaults(parsed);
      this.config.set(merged);
      return true;
    } catch (e) {
      console.error('Error al importar archivo de configuración:', e);
      return false;
    }
  }
}
