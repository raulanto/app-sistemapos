import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ThemeService,
  THEME_BASE_TONES,
  THEME_COLORS,
  THEME_SIDEBAR_STYLES,
  THEME_CONTRASTS,
  THEME_RADIUSES,
} from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      if (!window.matchMedia) {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
          }),
        });
      }
    }

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created with defaults and options metadata', () => {
    expect(service).toBeTruthy();
    expect(service.mode()).toBeDefined();
    expect(service.baseTone()).toBe('zinc');
    expect(service.color()).toBe('zinc');
    expect(service.sidebarStyle()).toBe('default');
    expect(service.contrast()).toBe('default');
    expect(service.radius()).toBe('lg');
    expect(THEME_BASE_TONES.length).toBe(6);
    expect(THEME_COLORS.length).toBe(12);
    expect(THEME_SIDEBAR_STYLES.length).toBe(3);
    expect(THEME_CONTRASTS.length).toBe(3);
    expect(THEME_RADIUSES.length).toBe(6);
  });

  it('should update mode correctly', () => {
    service.setMode('dark');
    expect(service.mode()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(service.currentTheme()).toBe('dark');

    service.setMode('light');
    expect(service.mode()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(service.currentTheme()).toBe('light');
  });

  it('should update base tone correctly', () => {
    service.setBaseTone('slate');
    expect(service.baseTone()).toBe('slate');
    expect(service.currentBaseToneOption().id).toBe('slate');

    service.setBaseTone('stone');
    expect(service.baseTone()).toBe('stone');
    expect(service.currentBaseToneOption().id).toBe('stone');

    service.setBaseTone('oled');
    expect(service.baseTone()).toBe('oled');
    expect(service.currentBaseToneOption().id).toBe('oled');
  });

  it('should update color and custom color correctly', () => {
    service.setColor('emerald');
    expect(service.color()).toBe('emerald');
    expect(service.currentColorOption().id).toBe('emerald');

    service.setColor('indigo');
    expect(service.color()).toBe('indigo');
    expect(service.currentColorOption().id).toBe('indigo');

    service.setCustomHex('#10b981');
    expect(service.color()).toBe('custom');
    expect(service.customHex()).toBe('#10b981');
    expect(service.currentColorOption().isCustom).toBe(true);
  });

  it('should update sidebar style and contrast correctly', () => {
    service.setSidebarStyle('contrast');
    expect(service.sidebarStyle()).toBe('contrast');
    expect(service.currentSidebarStyleOption().id).toBe('contrast');

    service.setContrast('high');
    expect(service.contrast()).toBe('high');
    expect(service.currentContrastOption().id).toBe('high');
  });

  it('should update radius correctly', () => {
    service.setRadius('none');
    expect(service.radius()).toBe('none');
    expect(service.currentRadiusOption().value).toBe('0px');

    service.setRadius('full');
    expect(service.radius()).toBe('full');
    expect(service.currentRadiusOption().value).toBe('9999px');
  });

  it('should toggle theme mode', () => {
    service.setMode('light');
    service.toggleTheme();
    expect(service.isDark()).toBe(true);

    service.toggleTheme();
    expect(service.isDark()).toBe(false);
  });

  it('should reset to default values', () => {
    service.setMode('dark');
    service.setBaseTone('mauve');
    service.setColor('rose');
    service.setSidebarStyle('contrast');
    service.setContrast('high');
    service.setRadius('sm');

    service.resetToDefaults();
    expect(service.mode()).toBe('system');
    expect(service.baseTone()).toBe('zinc');
    expect(service.color()).toBe('zinc');
    expect(service.sidebarStyle()).toBe('default');
    expect(service.contrast()).toBe('default');
    expect(service.radius()).toBe('lg');
  });
});
