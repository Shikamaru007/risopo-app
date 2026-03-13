import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../utils/nav';

interface AppLayoutProps {
  children: React.ReactNode;
}

const BottomNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-gray-200 bg-white/95 px-4 py-3 shadow-soft md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center text-xs font-medium ${
            pathname === item.path ? 'text-accent' : 'text-gray-500'
          }`}
        >
          <span aria-hidden className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

const SideNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white/80 px-4 py-6 backdrop-blur md:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-white font-semibold shadow-soft">IN</div>
        <div>
          <p className="text-xs text-gray-500">Offline-first</p>
          <p className="text-lg font-semibold">Invoice PWA</p>
        </div>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              pathname === item.path ? 'bg-accent/10 text-accent' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span aria-hidden className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface text-ink md:flex">
      <SideNav />
      <div className="flex-1">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex items-center justify-between px-4 py-4 md:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white font-semibold shadow-soft">IN</div>
              <div>
                <p className="text-xs text-gray-500">Offline-first</p>
                <p className="text-lg font-semibold">Invoice PWA</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 md:text-sm">Foundation layout • routing ready</div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 md:px-10 lg:px-12">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
};
