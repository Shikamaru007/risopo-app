import React, { useEffect, useMemo, useState } from 'react';
import { liveQuery } from 'dexie';
import { Link, useNavigate } from 'react-router-dom';
import { deleteInvoice, listInvoices } from '../db/invoices';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';
import { InvoiceCard } from '../components/InvoiceCard';
import { EmptyState } from '../components/EmptyState';
import { TextInput } from '../components/FormFields';
import { buildPdf } from '../lib/pdf';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { prepareDuplicateDraft } from '../utils/duplicateFlow';
import { InvoicePdfPreview } from '../components/InvoicePdfPreview';
import { PdfPreviewFrame } from '../components/PdfPreviewFrame';
import { getSettings } from '../db/settings';
import { SettingsRecord, PaymentMethod as SettingsPaymentMethod } from '../types/settings';
import { getAsset } from '../db/assets';
import { readLogoCache, readSettingsCache } from '../utils/settingsCache';

export const InvoicesPage: React.FC = () => {
  const ready = useDexieReady();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
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
        setLoading(false);
      },
      error: () => setLoading(false)
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

  const filteredInvoices = useMemo(() => {
    const sourceInvoices = invoices;
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? sourceInvoices.filter((invoice) => {
          const client = invoice.client?.name?.toLowerCase() ?? '';
          const number = invoice.invoiceNumber?.toLowerCase() ?? '';
          return client.includes(normalized) || number.includes(normalized);
        })
      : sourceInvoices;

    return filtered;
  }, [invoices, query]);

  const groupedInvoices = useMemo(() => {
    const today = new Date();
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const groups: { label: string; items: InvoiceRecord[] }[] = [];
    const todayItems: InvoiceRecord[] = [];
    const yesterdayItems: InvoiceRecord[] = [];
    const otherItems: InvoiceRecord[] = [];

    filteredInvoices.forEach((invoice) => {
      const created = new Date(invoice.createdAt);
      if (isSameDay(created, today)) {
        todayItems.push(invoice);
      } else if (isSameDay(created, yesterday)) {
        yesterdayItems.push(invoice);
      } else {
        otherItems.push(invoice);
      }
    });

    if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
    if (otherItems.length) groups.push({ label: 'Earlier', items: otherItems });

    return groups;
  }, [filteredInvoices]);

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
    <div className="space-y-6">
      <div className="flex items-center">
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search invoices"
        />
      </div>

      <section className="space-y-6">
        {filteredInvoices.length === 0 && (
          <EmptyState
            className="mt-4"
            title="No invoices yet"
            description="Your recent invoices will appear here once you create one."
          />
        )}

        {groupedInvoices.map((group) => (
            <div key={group.label} className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 font-['Google Sans Mono',monospace]">
              {group.label}
            </div>
            <div className="space-y-3">
              {group.items.map((invoice) => (
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
          </div>
        ))}
      </section>

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
