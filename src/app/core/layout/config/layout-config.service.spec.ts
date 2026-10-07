import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LayoutConfigService } from './layout-config.service';
import { DEFAULT_LAYOUT_CONFIG } from './layout-config.defaults';

describe('LayoutConfigService', () => {
  let service: LayoutConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LayoutConfigService],
    });
    service = TestBed.inject(LayoutConfigService);
    service.resetToDefaults();
  });

  it('should initialize with default config', () => {
    expect(service).toBeTruthy();
    expect(service.config().version).toBe('1.0.0');
    expect(service.sidebar().itemsOrder.length).toBe(DEFAULT_LAYOUT_CONFIG.sidebar.itemsOrder.length);
    expect(service.header().sticky).toBe(true);
  });

  it('should toggle sidebar item visibility', () => {
    const firstItemId = service.sidebar().itemsOrder[0].id;
    const initialVisibility = service.sidebar().itemsOrder[0].visible;

    service.toggleSidebarItemVisibility(firstItemId);
    expect(service.sidebar().itemsOrder[0].visible).toBe(!initialVisibility);

    service.toggleSidebarItemVisibility(firstItemId);
    expect(service.sidebar().itemsOrder[0].visible).toBe(initialVisibility);
  });

  it('should move items up and down', () => {
    const firstId = service.sidebar().itemsOrder[0].id;
    const secondId = service.sidebar().itemsOrder[1].id;

    service.moveSidebarItemDown(firstId);
    expect(service.sidebar().itemsOrder[0].id).toBe(secondId);
    expect(service.sidebar().itemsOrder[1].id).toBe(firstId);

    service.moveSidebarItemUp(firstId);
    expect(service.sidebar().itemsOrder[0].id).toBe(firstId);
    expect(service.sidebar().itemsOrder[1].id).toBe(secondId);
  });

  it('should update sidebar and header params', () => {
    service.updateSidebar({ collapsible: 'offcanvas', showSearch: false });
    expect(service.sidebar().collapsible).toBe('offcanvas');
    expect(service.sidebar().showSearch).toBe(false);

    service.updateHeader({ sticky: false });
    expect(service.header().sticky).toBe(false);
  });

  it('should export and import JSON correctly', () => {
    service.updateSidebar({ groupLabel: 'Mi POS Personalizado' });
    const jsonStr = service.exportAsJson();

    expect(jsonStr).toContain('Mi POS Personalizado');

    service.resetToDefaults();
    expect(service.sidebar().groupLabel).toBe(DEFAULT_LAYOUT_CONFIG.sidebar.groupLabel);

    const importSuccess = service.importFromJson(jsonStr);
    expect(importSuccess).toBe(true);
    expect(service.sidebar().groupLabel).toBe('Mi POS Personalizado');
  });
});
