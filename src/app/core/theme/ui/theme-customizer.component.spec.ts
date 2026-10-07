import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeCustomizerComponent } from './theme-customizer.component';
import { ThemeService } from '../theme.service';

describe('ThemeCustomizerComponent', () => {
  let component: ThemeCustomizerComponent;
  let fixture: ComponentFixture<ThemeCustomizerComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [ThemeCustomizerComponent],
      providers: [ThemeService],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeCustomizerComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render color options and allow selection', () => {
    expect(component.colorThemes.length).toBe(8);
    component.setColor('blue');
    expect(themeService.color()).toBe('blue');
  });

  it('should allow mode changes', () => {
    component.setMode('dark');
    expect(themeService.mode()).toBe('dark');
  });

  it('should allow radius changes', () => {
    component.setRadius('md');
    expect(themeService.radius()).toBe('md');
  });
});
