import React, { useEffect, useMemo, useState } from 'react';
import { liveQuery } from 'dexie';
import { Link, useNavigate } from 'react-router-dom';
import { Fab } from '../components/Fab';
import { StatsCard } from '../components/StatsCard';
import { InvoiceCard } from '../components/InvoiceCard';
import { EmptyState } from '../components/EmptyState';
import { deleteInvoice, listInvoices } from '../db/invoices';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';
import { buildPdf } from '../lib/pdf';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { prepareDuplicateDraft } from '../utils/duplicateFlow';
import { InvoicePdfPreview } from '../components/InvoicePdfPreview';
import { PdfPreviewFrame } from '../components/PdfPreviewFrame';
import { getSettings } from '../db/settings';
import { SettingsRecord, PaymentMethod as SettingsPaymentMethod } from '../types/settings';
import { getAsset } from '../db/assets';
import { readLogoCache, readSettingsCache } from '../utils/settingsCache';

const getGreeting = (now: Date) => {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const DashboardPage: React.FC = () => {
  const ready = useDexieReady();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<InvoiceRecord | null>(null);
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const subscription = liveQuery(() => listInvoices()).subscribe({
      next: (data) => {
        setInvoices(data);
      }
    });
    return () => subscription.unsubscribe();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const loadSettings = () => {
      getSettings()
        .then((result) => {
          if (cancelled) return;
          if (result) {
            setSettings(result);
            return;
          }
          const cached = readSettingsCache();
          if (cached?.data) setSettings(cached.data);
        })
        .catch(() => {
          if (cancelled) return;
          const cached = readSettingsCache();
          if (cached?.data) {
            setSettings(cached.data);
          } else {
            setSettings(null);
          }
        })
        .finally(() => {
          if (!cancelled) setSettingsLoaded(true);
        });
    };
    loadSettings();
    const handleSettingsUpdated = () => loadSettings();
    window.addEventListener('settings-updated', handleSettingsUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener('settings-updated', handleSettingsUpdated);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !settings?.logoId) {
      setLogoUrl(null);
      return;
    }
    getAsset(settings.logoId)
      .then((asset) => {
        const cachedLogo = readLogoCache(settings.logoId);
        setLogoUrl(asset?.dataUrl ?? cachedLogo ?? null);
      })
      .catch(() => {
        const cachedLogo = readLogoCache(settings.logoId);
        setLogoUrl(cachedLogo ?? null);
      });
  }, [ready, settings?.logoId]);

  const now = useMemo(() => new Date(), []);
  const greeting = useMemo(() => getGreeting(now), [now]);

  const summary = useMemo(() => {
    const totalInvoices = invoices.length;
    const paidCount = invoices.filter((invoice) => invoice.status === 'paid').length;
    const pendingCount = totalInvoices - paidCount;
    const currency = invoices[0]?.currency || 'NGN';
    return { totalInvoices, paidCount, pendingCount, currency };
  }, [invoices, now]);

  const handleView = (invoice: InvoiceRecord) => {
    navigate(`/invoices/${invoice.id}?mode=full`);
  };

  const handleDuplicate = async (invoice: InvoiceRecord) => {
    if (!ready) return;
    prepareDuplicateDraft(invoice);
    navigate(`/builder?step=items&duplicate=${invoice.id}`);
  };


  const handleDownload = async (invoice: InvoiceRecord) => {
    if (!ready) return;
    setDownloadTarget(invoice);
  };

  const handleDelete = (invoice: InvoiceRecord) => {
    setDeleteTarget(invoice);
  };

  const selectedPaymentDetails = useMemo<SettingsPaymentMethod | undefined>(() => {
    if (!downloadTarget) return undefined;
    return settings?.paymentMethods?.find((method) => method.type === downloadTarget.paymentMethod);
  }, [downloadTarget, settings?.paymentMethods]);

  const hasProfileDetails = Boolean(
    settings?.businessName?.trim() ||
      settings?.businessEmail?.trim() ||
      settings?.phone?.trim()
  );

  useEffect(() => {
    if (!downloadTarget || !settingsLoaded) return;
    let cancelled = false;
    const run = async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled) return;
      const element = document.querySelector('[data-pdf-capture="true"]') as HTMLElement | null;
      const doc = await buildPdf(downloadTarget, { element });
      const filename = `risopo-${downloadTarget.invoiceNumber || downloadTarget.id}.pdf`;
      doc.save(filename);
      if (!cancelled) setDownloadTarget(null);
    };
    run().catch(() => {
      if (!cancelled) setDownloadTarget(null);
    });
    return () => {
      cancelled = true;
    };
  }, [downloadTarget, settingsLoaded]);

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
          Home
        </div>
        <h2 className="text-2xl font-medium text-ink md:text-3xl">{greeting}</h2>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatsCard title="Total invoices" value={summary.totalInvoices} />
        <StatsCard title="Pending" value={summary.pendingCount} />
        <StatsCard title="Paid" value={summary.paidCount} />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium text-ink">Recent invoices</h3>
        </div>
        {invoices.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No invoices yet"
            description="Your recent invoices will appear here once you create one."
          />
        ) : (
          <div className="mt-4 space-y-3">
            {invoices.slice(0, 3).map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}?mode=full`}
                className="block"
              >
                <InvoiceCard
                  invoice={invoice}
                  onView={() => handleView(invoice)}
                  onDuplicate={() => handleDuplicate(invoice)}
                  onDownload={() => handleDownload(invoice)}
                  onDelete={() => handleDelete(invoice)}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <Fab to="/builder" />

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete invoice?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await deleteInvoice(deleteTarget.id);
          } finally {
            setDeleting(false);
            setDeleteTarget(null);
          }
        }}
      />

      {downloadTarget && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: 595,
            pointerEvents: 'none'
          }}
        >
          <PdfPreviewFrame>
            <InvoicePdfPreview
              invoice={downloadTarget}
              clientPhone={downloadTarget.client?.phone}
              profile={settings ?? undefined}
              paymentMethod={selectedPaymentDetails}
              showSkeleton={!hasProfileDetails}
              useFallback={false}
              logoUrl={logoUrl ?? undefined}
            />
          </PdfPreviewFrame>
        </div>
      )}
    </div>
  );
};
