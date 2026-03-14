import React, { useEffect, useState } from 'react';
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9EBE9] bg-white"
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-surface text-ink">
      <div className="flex-1">
        <header className="sticky top-0 z-30">
          <div
            className={`mx-auto flex items-center justify-between px-4 py-4 transition-all md:px-8 ${
              scrolled
                ? 'bg-gradient-to-b from-white/85 via-white/60 to-transparent backdrop-blur-md dark:from-black/70 dark:via-black/40 dark:to-transparent'
                : 'bg-transparent'
            }`}
          >
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
                aria-label="Toggle theme"
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl"
              >
                <span className="icon material-symbols-rounded text-[20px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
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
