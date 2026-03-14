import React from 'react';
import { InvoiceRecord } from '../types/invoice';

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
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

interface InvoiceListProps {
  invoices: InvoiceRecord[];
  currencyFallback?: string;
  loading?: boolean;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  currencyFallback = 'NGN',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        Loading invoices…
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        No invoices yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="rounded-3xl bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  (invoice.status ?? 'pending') === 'paid'
                    ? 'bg-[#ecfdf3] text-[#027a48]'
                    : 'bg-[#fefbe8] text-[#ca8504]'
                }`}
              >
                {(invoice.status ?? 'pending') === 'paid' ? 'Paid' : 'Pending'}
              </span>
              <span className="text-sm text-black">•</span>
              <span className="text-[11px] font-semibold text-[#919191]">
                {formatDate(invoice.createdAt)}
              </span>
            </div>
            <button
              type="button"
              aria-label="Invoice actions"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white"
            >
              <span className="icon material-symbols-rounded text-[16px] text-[#111111]">
                more_vert
              </span>
            </button>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="flex w-[120px] flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-[#919191]">
                {invoice.invoiceNumber}
              </span>
              <span className="text-sm font-medium text-black">{invoice.client?.name}</span>
            </div>
            <span className="text-xl font-semibold text-black">
              {formatCurrency(invoice.total, currencyFallback)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
