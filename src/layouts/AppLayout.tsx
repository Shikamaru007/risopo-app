import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems, NavIconName } from '../utils/nav';

interface AppLayoutProps {
  children: React.ReactNode;
}

const NavIcon: React.FC<{ name: NavIconName; active: boolean }> = ({ name, active }) => {
  return (
    <span
      className={`icon material-symbols-rounded text-[22px] transition-colors ${
        active ? 'text-[var(--brand-blue)]' : 'text-[var(--tab-muted)]'
      } md:group-hover:text-[var(--brand-blue-dark)] group-active:text-[var(--brand-blue-pressed)]`}
      style={{
        fontVariationSettings: active
          ? '"FILL" 1, "wght" 600, "GRAD" 0, "opsz" 24'
          : '"FILL" 0, "wght" 500, "GRAD" 0, "opsz" 24'
      }}
    >
      {name}
    </span>
  );
};

const BottomNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9EBE9] bg-white shadow-[0_0_30px_rgba(28,26,21,0.03)]"
      style={{
        paddingTop: '8px',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)'
      }}
    >
      <div className="flex w-full items-center">
        {navItems.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className="group flex flex-1 items-center justify-center"
            >
              <div
                className={`flex items-center justify-center rounded-2xl ${
                  active ? 'px-4 py-3 bg-white/70 backdrop-blur-[350px]' : 'p-3'
                }`}
              >
                <NavIcon name={item.icon} active={active} />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const headerTitle = pathname.startsWith('/invoices')
    ? 'Invoices'
    : pathname.startsWith('/settings')
      ? 'Settings'
      : pathname.startsWith('/builder')
        ? 'Invoice Builder'
        : '';
  const showLogo = headerTitle === '';

  return (
    <div className="relative min-h-screen bg-surface text-ink">
      <div className="flex-1">
        <header className="sticky top-0 z-30">
          <div className="mx-auto flex items-center justify-between px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              {showLogo ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 text-sm font-semibold text-ink/80">
                  R
                </div>
              ) : (
                <span className="text-2xl font-bold text-ink">{headerTitle}</span>
              )}
            </div>
            <div className="flex items-center text-gray-700">
              <button
                aria-label="Menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-soft hover:shadow-md"
              >
                <span className="icon material-icons-round text-[22px]">more_vert</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-1 md:px-10 md:pb-8 md:pt-2 lg:px-12">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};
