import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { InvoicePdfPreview } from '../components/InvoicePdfPreview';
import { PdfPreviewFrame } from '../components/PdfPreviewFrame';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';
import { getSettings } from '../db/settings';
import { SettingsRecord, PaymentMethod as SettingsPaymentMethod } from '../types/settings';
import { getAsset } from '../db/assets';
import { readLogoCache, readSettingsCache } from '../utils/settingsCache';

const buildSeedInvoice = (): InvoiceRecord => {
  const id = crypto.randomUUID ? crypto.randomUUID() : `inv-${Date.now()}`;
  const createdAt = new Date();
  const dueDate = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const items = [
    {
      id: `${id}-1`,
      name: 'Product design system refresh',
      quantity: 1,
      unitPrice: 350000,
      total: 350000
    },
    {
      id: `${id}-2`,
      name: 'UX audit + user flow refinements',
      quantity: 1,
      unitPrice: 180000,
      total: 180000
    },
    {
      id: `${id}-3`,
      name: 'Launch sprint support (2 weeks)',
      quantity: 1,
      unitPrice: 140000,
      total: 140000
    }
  ];
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = subtotal * 0.02;
  return {
    id,
    invoiceNumber: `INV-${createdAt.getFullYear()}-${String(createdAt.getDate()).padStart(2, '0')}${String(
      createdAt.getMonth() + 1
    ).padStart(2, '0')}`,
    status: 'pending',
    issueDate: createdAt.toISOString(),
    dueDate: dueDate.toISOString(),
    currency: 'NGN',
    client: {
      name: 'John Doe',
      email: 'anonymous@test.com',
      address: '25 Admiralty Way, Lagos'
    },
    items,
    subtotal,
    tax: discount,
    total: Math.max(subtotal - discount, 0),
    paymentMethod: 'bank',
    createdAt: createdAt.toISOString()
  };
};

export const InvoiceGeneratedPage: React.FC = () => {
  const location = useLocation();
  const ready = useDexieReady();
  const state = location.state as { invoice?: InvoiceRecord; clientPhone?: string } | null;
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const stored = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem('generatedInvoice');
    } catch {
      return null;
    }
  }, []);
  const storedPhone = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem('generatedClientPhone');
    } catch {
      return null;
    }
  }, []);
  const invoice = useMemo(() => {
    if (state?.invoice) return state.invoice;
    if (stored) {
      try {
        return JSON.parse(stored) as InvoiceRecord;
      } catch {
        return buildSeedInvoice();
      }
    }
    return buildSeedInvoice();
  }, [state, stored]);
  const clientPhone = state?.clientPhone || storedPhone || undefined;

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
    return settings?.paymentMethods?.find((method) => method.type === invoice.paymentMethod);
  }, [invoice.paymentMethod, settings?.paymentMethods]);

  const hasProfileDetails = Boolean(
    settings?.businessName?.trim() ||
      settings?.businessEmail?.trim() ||
      settings?.phone?.trim()
  );

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-100 bg-white/80 p-0 md:mx-auto md:w-fit">
        <PdfPreviewFrame>
          <InvoicePdfPreview
            invoice={invoice}
            clientPhone={clientPhone || undefined}
            profile={settings ?? undefined}
            paymentMethod={selectedPaymentDetails}
            showSkeleton={!hasProfileDetails}
            logoUrl={logoUrl ?? undefined}
          />
        </PdfPreviewFrame>
      </div>
    </section>
  );
};
