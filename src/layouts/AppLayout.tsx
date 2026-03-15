import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { navItems, NavIconName } from '../utils/nav';
import risopoLogo from '../assets/risopo.svg';

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

const DesktopNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <nav className="hidden md:flex md:fixed md:top-1/2 md:left-8 md:-translate-y-1/2 z-40">
      <div className="flex flex-col items-center gap-2 rounded-[24px] border border-[#E9EBE9] bg-white/90 p-2 shadow-soft backdrop-blur">
        {navItems.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className="group"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 transition-colors duration-200">
                <NavIcon name={item.icon} active={active} />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const BottomNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9EBE9] bg-white md:hidden"
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const headerTitle = pathname.startsWith('/invoices')
    ? 'Invoices'
    : pathname.startsWith('/settings')
      ? 'Settings'
      : pathname.startsWith('/builder')
        ? 'Create Invoice'
        : '';
  const showLogo = headerTitle === '';
  const showBuilderBack = pathname.startsWith('/builder');
  const showNewInvoice = pathname === '/dashboard';
  const hideNav = pathname.startsWith('/builder');
  const showHomeButton = pathname.startsWith('/builder');

  const builderStepOrder = useMemo(() => ['client', 'items', 'payment', 'review'], []);
  const builderStepIndex = useMemo(() => {
    const step = searchParams.get('step');
    if (!step) return 0;
    const index = builderStepOrder.indexOf(step);
    return index === -1 ? 0 : index;
  }, [builderStepOrder, searchParams]);

  const handleBuilderBack = () => {
    if (builderStepIndex <= 0) {
      navigate('/dashboard');
      return;
    }
    const nextStep = builderStepOrder[builderStepIndex - 1];
    navigate(`/builder?step=${nextStep}`);
  };
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
      {!hideNav && <DesktopNav />}
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
                <img src={risopoLogo} alt="Risopo" className="h-8 w-8" />
              ) : (
                <div className="flex items-center gap-3">
                  {showBuilderBack && (
                    <button
                      type="button"
                      onClick={handleBuilderBack}
                      aria-label="Back to dashboard"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl md:h-11 md:w-11"
                    >
                      <span className="icon material-symbols-rounded text-[20px]">
                        arrow_back
                      </span>
                    </button>
                  )}
                  <span className="text-[clamp(18px,3.2vw,28px)] font-bold text-ink">
                    {headerTitle}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              {showHomeButton && (
                <Link
                  to="/dashboard"
                  aria-label="Go to dashboard"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl md:h-11 md:w-11"
                >
                  <span className="icon material-symbols-rounded text-[20px]">home</span>
                </Link>
              )}
              <button
                aria-label="Toggle theme"
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl md:h-11 md:w-11"
              >
                <span className="icon material-symbols-rounded text-[20px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              {showNewInvoice && (
                <Link
                  to="/builder"
                  className="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-blue-dark)] active:bg-[var(--brand-blue-pressed)] md:px-5 md:py-[10px]"
                >
                  <span className="icon material-symbols-rounded text-[18px]">add</span>
                  New Invoice
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-1 md:px-10 md:pb-8 md:pt-2 lg:px-12">
          {children}
        </main>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
};
