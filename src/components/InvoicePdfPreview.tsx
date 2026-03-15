import React from 'react';
import risopoLogo from '../assets/risopo.svg';
import { InvoiceRecord } from '../types/invoice';
import { BusinessProfile, PaymentMethod } from '../types/settings';

const fallbackItems = [
  {
    id: 'item-1',
    name: 'Deluxe catering package for 50 guests, including appetizers, main course, dessert, and beverages',
    quantity: 1,
    unitPrice: 370000,
    total: 370000
  },
  {
    id: 'item-2',
    name: 'Standard catering package for 50 guests, featuring a selection of appetizers, a choice of main courses, and soft drinks',
    quantity: 1,
    unitPrice: 250000,
    total: 250000
  },
  {
    id: 'item-3',
    name: 'Basic catering package for 25 guests, including light snacks and water service',
    quantity: 1,
    unitPrice: 150000,
    total: 150000
  }
];

const fallbackFrom = {
  name: 'Michael Onafowokan',
  email: 'risopoapp@test.com',
  phone: '+1 4211 0009'
};

const fallbackTo = {
  name: 'John Doe',
  email: 'anonymous@test.com',
  phone: '+1 7812 2211'
};

const fallbackPayment = {
  line1: '0171457329',
  line2: 'Gtbank',
  line3: 'Michael Boluwatife Onafowokan'
};

const fallbackPolicy =
  'Our refund policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately, we can’t offer you a refund or exchange.';

const formatDate = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed);
  return formatted.replace(/\//g, '.');
};

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);

const currencyMeta = (currency: string) => {
  switch (currency) {
    case 'USD':
      return { label: 'US Dollar ($)', symbol: '$' };
    case 'GBP':
      return { label: 'Pound Sterling (£)', symbol: '£' };
    case 'EUR':
      return { label: 'Euro (€)', symbol: '€' };
    case 'NGN':
    default:
      return { label: 'Naira  (₦)', symbol: '₦' };
  }
};

const resolvePaymentLines = (paymentMethod?: PaymentMethod) => {
  if (!paymentMethod) return fallbackPayment;
  if (paymentMethod.type === 'bank') {
    return {
      line1: paymentMethod.accountNumber,
      line2: paymentMethod.bankName,
      line3: paymentMethod.accountName
    };
  }
  if (paymentMethod.type === 'crypto') {
    return {
      line1: paymentMethod.walletAddress,
      line2: paymentMethod.network,
      line3: paymentMethod.label
    };
  }
  return {
    line1: paymentMethod.url,
    line2: paymentMethod.label,
    line3: 'Payment link'
  };
};

export interface InvoicePdfPreviewProps {
  invoice?: Partial<InvoiceRecord>;
  profile?: Partial<BusinessProfile>;
  paymentMethod?: PaymentMethod;
  clientPhone?: string;
  logoUrl?: string;
  discountRate?: number;
  className?: string;
}

export const InvoicePdfPreview: React.FC<InvoicePdfPreviewProps> = ({
  invoice,
  profile,
  paymentMethod,
  clientPhone,
  logoUrl,
  discountRate = 0.02,
  className
}) => {
  const items = invoice?.items?.length ? invoice.items : fallbackItems;
  const subtotal =
    typeof invoice?.subtotal === 'number'
      ? invoice.subtotal
      : items.reduce((sum, item) => sum + (item.total ?? item.unitPrice * item.quantity), 0);
  const discountAmount =
    typeof invoice?.tax === 'number' ? Math.abs(invoice.tax) : subtotal * discountRate;
  const totalDue =
    typeof invoice?.total === 'number' ? invoice.total : Math.max(subtotal - discountAmount, 0);
  const currencyCode = invoice?.currency || profile?.defaultCurrency || 'NGN';
  const currency = currencyMeta(currencyCode);
  const paymentLines = resolvePaymentLines(paymentMethod);

  const fromName = profile?.businessName || fallbackFrom.name;
  const fromEmail = profile?.businessEmail || fallbackFrom.email;
  const fromPhone = profile?.phone || fallbackFrom.phone;

  const toName = invoice?.client?.name || fallbackTo.name;
  const toEmail = invoice?.client?.email || fallbackTo.email;
  const toPhone = clientPhone || invoice?.client?.address || fallbackTo.phone;

  const issueDate = formatDate(invoice?.issueDate, '16.04.2026');
  const refundPolicy = invoice?.refundPolicy || profile?.refundPolicy || fallbackPolicy;

  return (
    <div
      className={`relative h-[842px] w-[595px] bg-white p-[44px] text-[#787c7d] ${className || ''}`}
    >
      <div className="flex h-full w-full flex-col items-start justify-between">
        <div className="flex w-[507px] flex-1 flex-col justify-between">
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div className="flex h-[48px] w-[48px] items-center justify-center overflow-hidden">
                <img
                  alt="Company logo"
                  className="h-[10.9px] w-[48px] object-contain"
                  src={logoUrl || risopoLogo}
                />
              </div>
              <div className="flex flex-col items-end justify-center">
                <div className="text-[45px] font-semibold leading-[54px] text-[#575757]">
                  Invoice
                </div>
                <div className="flex items-center justify-end gap-2 text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  <div>Invoice no:</div>
                  <div>{invoice?.invoiceNumber || '#INV-103'}</div>
                </div>
              </div>
            </div>

            <div className="flex w-[292px] items-center justify-between">
              <div className="flex w-[71px] flex-col items-start gap-1">
                <div className="text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  Date
                </div>
                <div className="text-[12px] text-[#787c7d]">{issueDate}</div>
              </div>
              <div className="flex w-[71px] flex-col items-start gap-1">
                <div className="text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  Currency
                </div>
                <div className="text-[12px] text-[#787c7d]">{currency.label}</div>
              </div>
            </div>

            <div className="flex w-[342px] items-start justify-between">
              <div className="flex flex-col items-start gap-1">
                <div className="text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  From
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <div className="text-[12px] text-[#787c7d]">{fromName}</div>
                  <div className="text-[12px] text-[#787c7d]">{fromEmail || '—'}</div>
                  <div className="text-[12px] text-[#787c7d]">{fromPhone || '—'}</div>
                </div>
              </div>
              <div className="flex flex-col items-start gap-1">
                <div className="text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  To
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <div className="text-[12px] text-[#787c7d]">{toName}</div>
                  <div className="text-[12px] text-[#787c7d]">{toEmail || '—'}</div>
                  <div className="text-[12px] text-[#787c7d]">{toPhone || '—'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-6">
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center justify-between text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  <div className="flex-1">Item / Service</div>
                  <div className="flex items-center gap-3">
                    <div className="w-[117.58px] text-right">Unit Cost</div>
                    <div className="w-[49.92px] text-right">Qty</div>
                    <div className="w-[82.51px] text-right">Amount</div>
                  </div>
                </div>
                <div className="flex flex-col gap-6 text-[12px] text-[#787c7d]">
                  {items.map((item) => {
                    const description = item.description || item.name;
                    const amount = item.total ?? item.unitPrice * item.quantity;
                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="flex-1">{description}</div>
                        <div className="flex items-center gap-3">
                          <div className="w-[117.58px] text-right tracking-[0.2px]">
                            {formatNumber(item.unitPrice)}
                          </div>
                          <div className="w-[49.92px] text-right">
                            {formatNumber(item.quantity, 0)}
                          </div>
                          <div className="w-[82.51px] text-right tracking-[0.2px]">
                            {formatNumber(amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex w-[247px] flex-col items-end gap-3">
                <div className="flex w-full flex-col items-start gap-2">
                  <div className="flex w-full items-center justify-between text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                    <div>Subtotal</div>
                    <div className="flex items-center gap-1">
                      <div>{currency.symbol}</div>
                      <div className="text-right text-[12px] text-[#787c7d] tracking-[0.2px] font-['Google_Sans',sans-serif]">
                        {formatNumber(subtotal)}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                    <div>Discount (2%)</div>
                    <div className="flex items-center gap-1">
                      <div>-{currency.symbol}</div>
                      <div className="text-right text-[12px] text-[#787c7d] tracking-[0.2px] font-['Google_Sans',sans-serif]">
                        {formatNumber(discountAmount)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  <div>Total Due</div>
                  <div className="flex items-center gap-1">
                    <div className="text-[12px]">{currency.symbol}</div>
                    <div className="text-right text-[16px] font-medium text-[#575757] tracking-[0.5px] font-['Google_Sans',sans-serif]">
                      {formatNumber(totalDue)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-[377px] flex-col gap-4">
            <div className="flex w-[247px] flex-col gap-1">
              <div className="text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                Payment Details
              </div>
              <div className="flex items-start justify-between rounded-[20px] bg-[#f5f5f5] p-[12px]">
                <div className="flex w-[174px] flex-col gap-0.5">
                  <div className="text-[10px] font-medium text-[#434343] tracking-[0.2px]">
                    {paymentLines.line1}
                  </div>
                  <div className="text-[10px] text-[#787c7d]">{paymentLines.line2}</div>
                  <div className="text-[10px] text-[#787c7d]">{paymentLines.line3}</div>
                </div>
                <span className="material-symbols-rounded text-[12px] text-[#9599a0]">
                  content_copy
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[#a4a4a4]">{refundPolicy}</div>
          </div>
        </div>

        <div className="w-full text-right text-[10px] text-[#f0f0f0] font-['Google_Sans_Mono',monospace]">
          risopo.com
        </div>
      </div>
    </div>
  );
};
