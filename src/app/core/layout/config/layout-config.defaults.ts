import { LayoutConfig } from './layout-config.model';

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  version: '1.0.0',
  sidebar: {
    collapsible: 'icon',
    position: 'left',
    variant: 'inset',
    showTeamSwitcher: true,
    showSearch: true,
    showSecondaryNav: true,
    showUserMenu: true,
    groupLabel: 'Plataforma',
    itemsOrder: [
      { id: 'dashboard', title: 'Dashboard', visible: true, category: 'Principal' },
      { id: 'ventas', title: 'Ventas (POS)', visible: true, category: 'Operaciones' },
      { id: 'pedidos', title: 'Pedidos', visible: true, category: 'Operaciones' },
      { id: 'agenda', title: 'Agenda y Citas', visible: true, category: 'Operaciones' },
      { id: 'inventario', title: 'Inventario', visible: true, category: 'Catálogo' },
      { id: 'clientes', title: 'Clientes', visible: true, category: 'Comercial' },
      { id: 'proveedores', title: 'Proveedores', visible: true, category: 'Comercial' },
      { id: 'promociones', title: 'Promociones', visible: true, category: 'Comercial' },
      { id: 'cajas', title: 'Control de Cajas', visible: true, category: 'Finanzas' },
      { id: 'sucursales', title: 'Sucursales', visible: true, category: 'Administración' },
      { id: 'usuarios', title: 'Usuarios y Roles', visible: true, category: 'Administración' },
      { id: 'reportes', title: 'Reportes y Analítica', visible: true, category: 'Analítica' },
      { id: 'auditoria', title: 'Auditoría', visible: true, category: 'Seguridad' },
    ],
  },
  header: {
    sticky: true,
    showSidebarTrigger: true,
    showBreadcrumb: true,
    showNotifications: true,
    showThemeCustomizer: true,
    showSearchTrigger: false,
  },
  content: {
    containerWidth: 'fluid',
    density: 'normal',
    showBreadcrumbs: true,
  },
};
