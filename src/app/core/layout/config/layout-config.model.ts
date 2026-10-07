export type SidebarCollapsibleMode = 'offcanvas' | 'icon' | 'none';
export type SidebarPosition = 'left' | 'right';
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';
export type ContentContainerWidth = 'fluid' | 'contained' | 'narrow';
export type LayoutDensity = 'compact' | 'normal' | 'spacious';

export interface SidebarItemOrderItem {
  id: string;
  title: string;
  visible: boolean;
  category?: string;
}

export interface SidebarConfig {
  collapsible: SidebarCollapsibleMode;
  position: SidebarPosition;
  variant: SidebarVariant;
  showTeamSwitcher: boolean;
  showSearch: boolean;
  showSecondaryNav: boolean;
  showUserMenu: boolean;
  groupLabel: string;
  itemsOrder: SidebarItemOrderItem[];
}

export interface HeaderConfig {
  sticky: boolean;
  showSidebarTrigger: boolean;
  showBreadcrumb: boolean;
  showNotifications: boolean;
  showThemeCustomizer: boolean;
  showSearchTrigger: boolean;
}

export interface ContentConfig {
  containerWidth: ContentContainerWidth;
  density: LayoutDensity;
  showBreadcrumbs: boolean;
}

export interface LayoutConfig {
  version: string;
  lastUpdated?: string;
  sidebar: SidebarConfig;
  header: HeaderConfig;
  content: ContentConfig;
}
