import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getInvoice } from '../db/invoices';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';
import { InvoicePdfPreview } from '../components/InvoicePdfPreview';
import { PdfPreviewFrame } from '../components/PdfPreviewFrame';
import { getSettings } from '../db/settings';
import { SettingsRecord, PaymentMethod as SettingsPaymentMethod } from '../types/settings';
import { getAsset } from '../db/assets';
import { readLogoCache, readSettingsCache } from '../utils/settingsCache';

export const InvoicePreviewPage: React.FC = () => {
  const { id } = useParams();
  const ready = useDexieReady();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !id) return;
    let mounted = true;
    getInvoice(id)
      .then((result) => {
        if (mounted) {
          setInvoice(result ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [ready, id]);

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

  const selectedPaymentDetails = useMemo<SettingsPaymentMethod | undefined>(() => {
    if (!invoice) return undefined;
    return settings?.paymentMethods?.find((method) => method.type === invoice.paymentMethod);
  }, [invoice, settings?.paymentMethods]);

  const hasProfileDetails = Boolean(
    settings?.businessName?.trim() ||
      settings?.businessEmail?.trim() ||
      settings?.phone?.trim()
  );

  return (
    <div className="space-y-6">
      <div className="sr-only">
        <h2>Invoice preview</h2>
        <p>Read-only preview for the selected invoice.</p>
        <Link to="/invoices">Back to invoices</Link>
      </div>

      {loading && (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
          Loading invoice…
        </div>
      )}

      {!loading && !invoice && (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
          Invoice not found.
        </div>
      )}

      {!loading && invoice && (
        <section className="rounded-[28px] border border-slate-100 bg-white/80 p-0 md:mx-auto md:w-fit">
          <PdfPreviewFrame>
            <div id="invoice-preview">
              <InvoicePdfPreview
                invoice={invoice}
                clientPhone={invoice.client?.phone}
                profile={settings ?? undefined}
                paymentMethod={selectedPaymentDetails}
                showSkeleton={!hasProfileDetails}
                useFallback={false}
                logoUrl={logoUrl ?? undefined}
              />
            </div>
          </PdfPreviewFrame>
        </section>
      )}
    </div>
  );
};
