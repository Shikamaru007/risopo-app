import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../utils/nav';

interface AppLayoutProps {
  children: React.ReactNode;
}

const NAV_ACTIVE_COLOR = '#0f4cac';
const NAV_INACTIVE_COLOR = '#c6c6c6';

type NavIconName = 'home' | 'book' | 'settings';

const NavIcon: React.FC<{ name: NavIconName; active: boolean }> = ({ name, active }) => {
  const color = active ? NAV_ACTIVE_COLOR : NAV_INACTIVE_COLOR;
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'home' && (
        <>
          <path d="M3.5 10.5L12 4l8.5 6.5V20a1 1 0 0 1-1 1h-5.5v-6h-4v6H4.5a1 1 0 0 1-1-1v-9.5z" />
        </>
      )}
      {name === 'book' && (
        <>
          <path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v12H7.5A2.5 2.5 0 0 0 5 21V4.5z" />
          <path d="M5 4.5h-.5A2.5 2.5 0 0 0 2 7v12.5A2.5 2.5 0 0 0 4.5 22H5" />
        </>
      )}
      {name === 'settings' && (
        <>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 0 1-1.42 3.42h-1a1.8 1.8 0 0 0-1.7 1.23l-.05.14a2 2 0 0 1-3.7 0l-.05-.14a1.8 1.8 0 0 0-1.7-1.23h-1a2 2 0 0 1-1.42-3.42l.06-.06a1.8 1.8 0 0 0 .36-1.98l-.02-.08a1.8 1.8 0 0 0-1.7-1.27H3.5a2 2 0 0 1 0-4h1.03a1.8 1.8 0 0 0 1.7-1.27l.02-.08a1.8 1.8 0 0 0-.36-1.98l-.06-.06A2 2 0 0 1 7.27 3.7h1a1.8 1.8 0 0 0 1.7-1.23l.05-.14a2 2 0 0 1 3.7 0l.05.14a1.8 1.8 0 0 0 1.7 1.23h1a2 2 0 0 1 1.42 3.42l-.06.06a1.8 1.8 0 0 0-.36 1.98l.02.08a1.8 1.8 0 0 0 1.7 1.27H20.5a2 2 0 0 1 0 4h-1.03a1.8 1.8 0 0 0-1.7 1.27l-.02.08z" />
        </>
      )}
    </svg>
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
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)'
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
              className="flex flex-1 items-center justify-center"
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
  return (
    <div className="relative min-h-screen bg-surface text-ink">
      <div className="flex-1">
        <header className="sticky top-0 z-30 hidden bg-surface/95 backdrop-blur md:block">
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
                <span className="icon material-icons-round text-[22px]">settings</span>
              </button>
              <button
                aria-label="Profile"
                className="h-11 w-11 rounded-full bg-white/70 shadow-soft backdrop-blur hover:bg-white"
              >
                <span className="icon material-icons-round text-[22px]">account_circle</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-8 md:px-10 md:pb-8 lg:px-12">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
};
