export type NavIconName = 'home' | 'receipt_long' | 'settings';

export const navItems: Array<{ label: string; path: string; icon: NavIconName }> = [
  { label: 'Home', path: '/dashboard', icon: 'home' },
  { label: 'Invoices', path: '/invoices', icon: 'receipt_long' },
  { label: 'Settings', path: '/settings', icon: 'settings' }
];
