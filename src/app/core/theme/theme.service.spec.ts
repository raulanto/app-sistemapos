import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeService, THEME_COLORS, THEME_RADIUSES } from './theme.service';

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
    expect(service.color()).toBeDefined();
    expect(service.radius()).toBeDefined();
    expect(THEME_COLORS.length).toBe(8);
    expect(THEME_RADIUSES.length).toBe(4);
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

  it('should update color correctly', () => {
    service.setColor('emerald');
    expect(service.color()).toBe('emerald');
    expect(service.currentColorOption().id).toBe('emerald');

    service.setColor('violet');
    expect(service.color()).toBe('violet');
    expect(service.currentColorOption().id).toBe('violet');
  });

  it('should update radius correctly', () => {
    service.setRadius('sm');
    expect(service.radius()).toBe('sm');
    expect(service.currentRadiusOption().value).toBe('0.375rem');

    service.setRadius('xl');
    expect(service.radius()).toBe('xl');
    expect(service.currentRadiusOption().value).toBe('1.25rem');
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
    service.setColor('rose');
    service.setRadius('sm');

    service.resetToDefaults();
    expect(service.mode()).toBe('system');
    expect(service.color()).toBe('zinc');
    expect(service.radius()).toBe('lg');
  });
});
