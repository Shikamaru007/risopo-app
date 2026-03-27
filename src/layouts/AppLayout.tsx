import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { navItems, NavIconName } from '../utils/nav';
import risopoLogo from '../assets/risopo.svg';
import { buildPdf } from '../lib/pdf';
import { addInvoice, clearInvoices, getInvoice } from '../db/invoices';
import { resetInvoiceNumberCounter } from '../utils/invoiceNumber';
import { useDexieReady } from '../hooks/useDexieReady';
import { InvoiceRecord } from '../types/invoice';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

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
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBuilderPreview = pathname === '/builder/preview';
  const invoiceMode = useMemo(() => {
    if (pathname.startsWith('/invoices/') && pathname !== '/invoices') {
      const params = new URLSearchParams(location.search);
      return params.get('mode') || 'full';
    }
    return null;
  }, [location.search, pathname]);
  const isInvoiceFullPreview = invoiceMode === 'full';
  const headerTitle = pathname.startsWith('/invoices')
    ? 'Invoices'
    : pathname.startsWith('/settings')
      ? 'Settings'
      : isBuilderPreview
        ? 'Invoice Preview'
        : pathname.startsWith('/builder')
          ? 'Create Invoice'
          : '';
  const showLogo = headerTitle === '';
  const showBuilderBack = pathname === '/builder';
  const showPreviewBack = pathname === '/builder/preview';
  const showInvoiceBack = isInvoiceFullPreview;
  const showNewInvoice = pathname === '/dashboard';
  const hideNav = pathname.startsWith('/builder') || isInvoiceFullPreview;
  const showHomeButton = pathname === '/builder';
  const isSettings = pathname.startsWith('/settings');

  const builderStepOrder = useMemo(() => ['client', 'items', 'payment'], []);
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
  const ready = useDexieReady();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearInvoicesModal, setShowClearInvoicesModal] = useState(false);
  const [fullInvoice, setFullInvoice] = useState<InvoiceRecord | null>(null);
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [installReady, setInstallReady] = useState(false);

  const previewInvoice = useMemo(() => {
    if (!isBuilderPreview) return null;
    const state = location.state as { invoice?: InvoiceRecord } | null;
    if (state?.invoice) return state.invoice;
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.sessionStorage.getItem('generatedInvoice');
      if (!stored) return null;
      return JSON.parse(stored) as InvoiceRecord;
    } catch {
      return null;
    }
  }, [isBuilderPreview, location.state]);

  useEffect(() => {
    if (!ready || !isInvoiceFullPreview) {
      setFullInvoice(null);
      return;
    }
    const parts = pathname.split('/').filter(Boolean);
    const id = parts[1];
    if (!id) {
      setFullInvoice(null);
      return;
    }
    let mounted = true;
    getInvoice(id)
      .then((result) => {
        if (mounted) setFullInvoice(result ?? null);
      })
      .catch(() => {
        if (mounted) setFullInvoice(null);
      });
    return () => {
      mounted = false;
    };
  }, [isInvoiceFullPreview, pathname, ready]);

  const handlePreviewSave = async () => {
    if (!previewInvoice || !ready || saving || saved) return;
    setSaving(true);
    try {
      await addInvoice(previewInvoice);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };


  const handlePreviewDownload = async () => {
    if (!previewInvoice || downloading) return;
    setDownloading(true);
    try {
      if (ready && !saved && !saving) {
        setSaving(true);
        try {
          await addInvoice(previewInvoice);
          setSaved(true);
        } catch (error) {
          console.error('Failed to save invoice on download.', error);
        } finally {
          setSaving(false);
        }
      }
      const previewElement =
        (document.querySelector('[data-pdf-capture="true"]') as HTMLElement | null) ||
        document.getElementById('invoice-preview');
      const timeoutMs = 12000;
      const doc = await Promise.race([
        buildPdf(previewInvoice, { element: previewElement }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('pdf-timeout')), timeoutMs)
        )
      ]).catch(async (error) => {
        console.error('PDF build failed or timed out, using data PDF.', error);
        return buildPdf(previewInvoice);
      });
      const filename = `risopo-${previewInvoice.invoiceNumber}.pdf`;
      try {
        doc.save(filename);
      } catch (error) {
        // Fallback to manual download if jsPDF save fails.
        console.error('PDF save failed, using blob download.', error);
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleFullPreviewDownload = async () => {
    if (!fullInvoice || downloading) return;
    setDownloading(true);
    try {
      if (ready) {
        try {
          await addInvoice(fullInvoice);
        } catch {
          // already saved
        }
      }
      const previewElement =
        (document.querySelector('[data-pdf-capture="true"]') as HTMLElement | null) ||
        document.getElementById('invoice-preview');
      const timeoutMs = 12000;
      const doc = await Promise.race([
        buildPdf(fullInvoice, { element: previewElement }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('pdf-timeout')), timeoutMs)
        )
      ]).catch(async (error) => {
        console.error('PDF build failed or timed out, using data PDF.', error);
        return buildPdf(fullInvoice);
      });
      const filename = `risopo-${fullInvoice.invoiceNumber}.pdf`;
      try {
        doc.save(filename);
      } catch (error) {
        console.error('PDF save failed, using blob download.', error);
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } finally {
      setDownloading(false);
    }
  };


  const handleClearInvoices = async () => {
    if (!ready || clearing) return;
    setClearing(true);
    try {
      await clearInvoices();
      resetInvoiceNumberCounter();
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname !== '/dashboard') return;
    try {
      window.sessionStorage.removeItem('invoiceBuilderDraft');
      window.sessionStorage.removeItem('invoiceBuilderDraftItems');
    } catch {
      // ignore storage failures
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPromptRef.current = event as BeforeInstallPromptEvent;
      setInstallReady(true);
    };

    const handleAppInstalled = () => {
      installPromptRef.current = null;
      setInstallReady(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = installPromptRef.current;
    if (!promptEvent) return;
    await promptEvent.prompt();
    try {
      const choice = await promptEvent.userChoice;
      if (choice.outcome !== 'accepted') return;
    } finally {
      installPromptRef.current = null;
      setInstallReady(false);
    }
  };

  // Share is disabled for now.

  return (
    <div className="relative min-h-screen bg-surface text-ink">
      {!hideNav && <DesktopNav />}
      <div className="flex-1">
        <header className="sticky top-0 z-30">
          {isInvoiceFullPreview ? (
            <div className="mx-auto flex items-center justify-between px-4 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  aria-label="Back to previous page"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl md:h-11 md:w-11"
                >
                  <span className="icon material-symbols-rounded text-[20px]">arrow_back</span>
                </button>
                <span className="text-lg font-medium text-ink">
                  {fullInvoice?.invoiceNumber || 'Invoice'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFullPreviewDownload}
                  disabled={downloading || !fullInvoice}
                  aria-label="Download invoice"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xl text-white transition-colors hover:bg-[var(--brand-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:w-11"
                >
                  {downloading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <span className="icon material-symbols-rounded text-[20px]">download</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
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
                    {(showBuilderBack || showPreviewBack || showInvoiceBack) && (
                      <button
                        type="button"
                        onClick={
                          showPreviewBack
                            ? () => navigate('/builder?step=payment')
                            : showBuilderBack
                              ? handleBuilderBack
                              : () => navigate(-1)
                        }
                        aria-label="Back to previous page"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl md:h-11 md:w-11"
                      >
                        <span className="icon material-symbols-rounded text-[20px]">
                          arrow_back
                        </span>
                      </button>
                    )}
                    <span className="text-[clamp(18px,3.2vw,28px)] font-medium text-ink">
                      {headerTitle}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                {isBuilderPreview && (
                  <>
                    <Link
                      to="/dashboard"
                      aria-label="Go to dashboard"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl md:h-11 md:w-11"
                    >
                      <span className="icon material-symbols-rounded text-[20px]">home</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handlePreviewDownload}
                      disabled={downloading || !previewInvoice}
                      aria-label="Download invoice"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xl text-white transition-colors hover:bg-[var(--brand-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:w-11"
                    >
                      {downloading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <span className="icon material-symbols-rounded text-[20px]">
                          download
                        </span>
                      )}
                    </button>
                  </>
                )}
                {showHomeButton && (
                  <Link
                    to="/dashboard"
                    aria-label="Go to dashboard"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl md:h-11 md:w-11"
                  >
                    <span className="icon material-symbols-rounded text-[20px]">home</span>
                  </Link>
                )}
                {pathname === '/invoices' && (
                  <button
                    type="button"
                    onClick={() => setShowClearInvoicesModal(true)}
                    disabled={!ready || clearing}
                    aria-label="Clear all invoices"
                    className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {clearing ? (
                      'Clearing…'
                    ) : (
                      'Clear invoices'
                    )}
                  </button>
                )}
                {isSettings && (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={!installReady}
                    aria-label="Install app"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
                  >
                    <span className="icon material-symbols-rounded text-[18px]">download</span>
                    <span className="hidden sm:inline">Install</span>
                  </button>
                )}
                {!isBuilderPreview && !isInvoiceFullPreview && (
                  <button
                    aria-label="Toggle theme"
                    onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl md:h-11 md:w-11"
                  >
                    <span className="icon material-symbols-rounded text-[20px]">
                      {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                  </button>
                )}
                {showNewInvoice && (
                  <Link
                    to="/builder"
                    className="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-blue-dark)] active:bg-[var(--brand-blue-pressed)] md:px-5 md:py-[10px]"
                  >
                    <span className="icon material-symbols-rounded text-[18px]">add</span>
                    New Invoice
                  </Link>
                )}
              </div>
            </div>
          )}
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-32 pt-1 md:px-10 md:pb-8 md:pt-2 lg:px-12">
          {children}
        </main>
      </div>
      {!hideNav && <BottomNav />}
      <ConfirmationModal
        open={showClearInvoicesModal}
        title="Clear all invoices?"
        description="This will permanently delete all saved invoices on this device."
        confirmLabel="Delete all"
        destructive
        loading={clearing}
        onCancel={() => setShowClearInvoicesModal(false)}
        onConfirm={async () => {
          await handleClearInvoices();
          setShowClearInvoicesModal(false);
        }}
      />
    </div>
  );
};
