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
  return new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

interface InvoiceCardProps {
  invoice: InvoiceRecord;
  onMenuClick?: () => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onMenuClick }) => {
  const status = invoice.status ?? 'pending';
  const statusLabel = status === 'paid' ? 'Paid' : 'Pending';
  const statusStyles =
    status === 'paid' ? 'bg-[#ecfdf3] text-[#027a48]' : 'bg-[#fefbe8] text-[#ca8504]';

  return (
    <div className="rounded-[24px] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center rounded-[16px] px-2 py-0.5 text-[12px] font-semibold ${statusStyles}`}
          >
            {statusLabel}
          </span>
          <span className="text-[14px] text-black">•</span>
          <span className="text-[12px] font-medium text-[#919191]">
            {formatDate(invoice.createdAt)}
          </span>
        </div>
        <button
          type="button"
          aria-label="Invoice actions"
          onClick={onMenuClick}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white"
        >
          <span className="icon material-symbols-rounded text-[16px] text-[#111111]">
            more_vert
          </span>
        </button>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="flex w-[140px] flex-col gap-0">
          <span className="text-[12px] font-medium text-[#919191] font-['Google_Sans_Mono',monospace]">
            {invoice.invoiceNumber}
          </span>
          <span className="text-[14px] font-medium text-black">{invoice.client?.name}</span>
        </div>
        <span className="text-[20px] font-medium text-black">
          {formatCurrency(invoice.total, invoice.currency || 'NGN')}
        </span>
      </div>
    </div>
  );
};
