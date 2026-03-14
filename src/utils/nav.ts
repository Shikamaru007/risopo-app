export type NavIconName = 'home' | 'book' | 'settings';

export const navItems: Array<{ label: string; path: string; icon: NavIconName }> = [
  { label: 'Home', path: '/dashboard', icon: 'home' },
  { label: 'Invoices', path: '/invoices', icon: 'book' },
  { label: 'Settings', path: '/settings', icon: 'settings' }
];
