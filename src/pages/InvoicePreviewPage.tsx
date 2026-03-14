import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getInvoice } from '../db/invoices';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';

const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `₦${value.toFixed(2)}`;
  }
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const InvoicePreviewPage: React.FC = () => {
  const { id } = useParams();
  const ready = useDexieReady();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

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

  const currency = useMemo(() => invoice?.currency || 'NGN', [invoice?.currency]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Invoice preview</h2>
          <p className="text-sm text-slate-500">Read-only preview for the selected invoice.</p>
        </div>
        <Link
          to="/invoices"
          className="text-sm font-semibold text-[var(--brand-blue)] transition-colors md:hover:text-[var(--brand-blue-dark)]"
        >
          Back to invoices
        </Link>
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
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {invoice.invoiceNumber}
              </div>
              <div className="text-2xl font-semibold text-ink">{invoice.client?.name}</div>
              <div className="text-sm text-slate-500">
                Created {formatDate(invoice.createdAt)}
              </div>
            </div>
            <div className="text-2xl font-semibold text-ink">
              {formatCurrency(invoice.total, currency)}
            </div>
          </div>

          <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Issue date
              </div>
              <div className="mt-1">{formatDate(invoice.issueDate)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Due date
              </div>
              <div className="mt-1">{formatDate(invoice.dueDate)}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
