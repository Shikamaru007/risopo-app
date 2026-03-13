import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../utils/nav';

interface AppLayoutProps {
  children: React.ReactNode;
}

const BottomNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center text-xs font-medium ${
            pathname === item.path ? 'text-accent' : 'text-gray-500'
          }`}
        >
          <span aria-hidden className="icon text-xl">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

const SideNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <aside className="hidden w-56 shrink-0 bg-surface px-4 py-6 md:block">
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
            <span aria-hidden className="icon text-xl">{item.icon}</span>
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
        <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur">
          <div className="mx-auto flex items-center justify-between px-4 py-3 md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white text-xl font-semibold shadow-soft">IN</div>
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-sm text-gray-500">Offline-first</span>
                <span className="text-2xl font-semibold">Invoices</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <button
                aria-label="Options"
                className="h-11 w-11 rounded-full bg-white/70 text-xl shadow-soft backdrop-blur hover:bg-white"
              >
                <span className="icon text-[22px]">settings</span>
              </button>
              <button
                aria-label="Profile"
                className="h-11 w-11 rounded-full bg-white/70 shadow-soft backdrop-blur hover:bg-white"
              >
                <span className="icon text-[22px]">account_circle</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 md:px-10 lg:px-12">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
};
