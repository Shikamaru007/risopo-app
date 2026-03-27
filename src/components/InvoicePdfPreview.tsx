import React from 'react';
import risopoLogo from '../assets/risopo.svg';
import { InvoiceItem, InvoiceRecord } from '../types/invoice';
import { BusinessProfile, PaymentMethod } from '../types/settings';

const fallbackItems: InvoiceItem[] = [
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

type PaymentLines = {
  line1: string;
  line2: string;
  line3?: string;
};

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

const resolvePaymentLines = (paymentMethod?: PaymentMethod): PaymentLines | null => {
  if (!paymentMethod) return null;
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
    line2: paymentMethod.label
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
  showSkeleton?: boolean;
  discountPercent?: number;
  showDiscount?: boolean;
  useFallback?: boolean;
}

export const InvoicePdfPreview: React.FC<InvoicePdfPreviewProps> = ({
  invoice,
  profile,
  paymentMethod,
  clientPhone,
  logoUrl,
  discountRate = 0.02,
  className,
  showSkeleton = false,
  discountPercent,
  showDiscount = true,
  useFallback = true
}) => {
  const items = invoice?.items?.length ? invoice.items : useFallback ? fallbackItems : [];
  const subtotal =
    typeof invoice?.subtotal === 'number'
      ? invoice.subtotal
      : items.reduce((sum, item) => sum + (item.total ?? item.unitPrice * item.quantity), 0);
  const discountAmount = (() => {
    if (typeof invoice?.tax === 'number') return Math.max(invoice.tax, 0);
    if (!showDiscount) return 0;
    return subtotal * discountRate;
  })();
  const totalDue =
    typeof invoice?.total === 'number' ? invoice.total : Math.max(subtotal - discountAmount, 0);
  const currencyCode = invoice?.currency || profile?.defaultCurrency || 'NGN';
  const currency = currencyMeta(currencyCode);
  const paymentLines = resolvePaymentLines(paymentMethod);
  const showPaymentBlock = Boolean(paymentLines || showSkeleton);
  const showPaymentSkeleton = showPaymentBlock && !paymentLines;

  const fromNameValue =
    profile?.businessName?.trim() || (showSkeleton ? '' : useFallback ? fallbackFrom.name : '');
  const fromEmailValue =
    profile?.businessEmail?.trim() || (showSkeleton ? '' : useFallback ? fallbackFrom.email : '');
  const fromPhoneValue =
    profile?.phone?.trim() || (showSkeleton ? '' : useFallback ? fallbackFrom.phone : '');

  const toName =
    invoice?.client?.name?.trim() || (showSkeleton ? '' : useFallback ? fallbackTo.name : '');
  const toEmail =
    invoice?.client?.email?.trim() || (showSkeleton ? '' : useFallback ? fallbackTo.email : '');
  const toPhone =
    clientPhone ||
    invoice?.client?.address?.trim() ||
    (showSkeleton ? '' : useFallback ? fallbackTo.phone : '');

  const issueDate = formatDate(
    invoice?.issueDate,
    useFallback && !showSkeleton ? '16.04.2026' : ''
  );
  const rawNotes = invoice?.refundPolicy ?? invoice?.notes;
  const refundPolicy = showSkeleton ? rawNotes : rawNotes || profile?.refundPolicy;
  const resolvedDiscountPercent =
    typeof discountPercent === 'number'
      ? discountPercent
      : subtotal > 0
        ? (discountAmount / subtotal) * 100
        : 0;
  const showAmountSkeleton =
    showSkeleton && items.every((item) => !item.name && item.quantity === 0 && item.unitPrice === 0);
  const isPaymentHighlight = Boolean(paymentMethod?.type);

  const SkeletonLine: React.FC<{ width: string; height?: string; className?: string }> = ({
    width,
    height = '10px',
    className: extraClassName = ''
  }) => (
    <span
      className={`inline-block rounded-full bg-[#e9ebef] ${extraClassName}`}
      style={{ width, height }}
    />
  );

  return (
    <div
      className={`relative h-[842px] w-[595px] bg-white p-[40px] text-[#787c7d] font-['Google Sans',sans-serif] ${className || ''}`}
    >
      <div className="flex h-full w-full flex-col items-start justify-between">
        <div className="flex w-[507px] flex-1 flex-col justify-between">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-[auto_1fr] items-start gap-8">
              <div className="inline-flex max-h-[69px] max-w-[276px] items-center overflow-hidden rounded-[8px] self-start">
                <img
                  alt="Company logo"
                  className="h-auto max-h-[69px] w-auto max-w-[276px] object-contain"
                  src={logoUrl || risopoLogo}
                />
              </div>
              <div className="flex flex-col items-end justify-start self-start text-right -mt-1">
                <div className="text-[56px] font-semibold leading-[40px] text-[#575757]">
                  Invoice
                </div>
                <div className="invoice-subtitle-row mt-5 flex items-center justify-end gap-2 text-[13px] text-[#7f858b] font-['Google Sans Mono',monospace] font-medium">
                  <div>Invoice no:</div>
                  <div className="text-[#5f6368] font-medium">
                    {invoice?.invoiceNumber || '#INV-103'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid w-[372px] grid-cols-[170px_1fr] items-center gap-12">
              <div className="flex w-[71px] flex-col items-start gap-1">
                <div className="text-[10px] text-[#7f858b] font-['Google Sans Mono',monospace]">
                  Date
                </div>
                <div className="text-[12px] text-[#5f6368] font-medium">{issueDate}</div>
              </div>
              <div className="flex w-[71px] flex-col items-start gap-1">
                <div className="text-[10px] text-[#7f858b] font-['Google Sans Mono',monospace]">
                  Currency
                </div>
                <div className="text-[12px] text-[#5f6368] font-medium">{currency.label}</div>
              </div>
            </div>

            <div className="grid w-[372px] grid-cols-[170px_1fr] items-start gap-12">
              <div className="flex flex-col items-start gap-1">
                <div className="text-[10px] text-[#7f858b] font-['Google Sans Mono',monospace]">
                  From
                </div>
                <div className="flex flex-col items-start gap-[1px]">
                  <div className="text-[12px] text-[#5f6368] font-medium">
                    {fromNameValue ? (
                      fromNameValue
                    ) : showSkeleton ? (
                      <SkeletonLine width="140px" height="10px" className="animate-pulse" />
                    ) : useFallback ? (
                      '—'
                    ) : null}
                  </div>
                  <div className="text-[12px] text-[#5f6368] font-medium">
                    {fromEmailValue ? (
                      fromEmailValue
                    ) : showSkeleton ? (
                      <SkeletonLine width="120px" height="10px" className="animate-pulse" />
                    ) : useFallback ? (
                      '—'
                    ) : null}
                  </div>
                  <div className="text-[12px] text-[#5f6368] font-medium">
                    {fromPhoneValue ? (
                      fromPhoneValue
                    ) : showSkeleton ? (
                      <SkeletonLine width="110px" height="10px" className="animate-pulse" />
                    ) : useFallback ? (
                      '—'
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start gap-1">
                <div className="text-[10px] text-[#7f858b] font-['Google Sans Mono',monospace]">
                  To
                </div>
                <div className="flex flex-col items-start gap-[1px]">
                  <div className="text-[12px] text-[#5f6368] font-medium">
                    {toName ? (
                      toName
                    ) : showSkeleton ? (
                      <SkeletonLine width="140px" height="10px" className="animate-pulse" />
                    ) : useFallback ? (
                      '—'
                    ) : null}
                  </div>
                  <div className="text-[12px] text-[#5f6368] font-medium">
                    {toEmail ? (
                      toEmail
                    ) : showSkeleton ? (
                      <SkeletonLine width="120px" height="10px" className="animate-pulse" />
                    ) : useFallback ? (
                      '—'
                    ) : null}
                  </div>
                  <div className="text-[12px] text-[#5f6368] font-medium">
                    {toPhone ? (
                      toPhone
                    ) : showSkeleton ? (
                      <SkeletonLine width="110px" height="10px" className="animate-pulse" />
                    ) : useFallback ? (
                      '—'
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col items-end gap-5">
              <div className="flex w-full flex-col">
                <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-2 text-[10px] text-[#7f858b] font-['Google Sans Mono',monospace]">
                  <div className="flex-1">Item / Service</div>
                  <div className="flex items-center gap-3">
                    <div className="w-[117.58px] text-right">Unit Cost</div>
                    <div className="w-[49.92px] text-right">Qty</div>
                    <div className="w-[82.51px] text-right">Amount</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-3.5 text-[12px] text-[#5f6368] font-medium">
                  {items.map((item) => {
                    const description = item.description || item.name;
                    const amount = item.total ?? item.unitPrice * item.quantity;
                    const showNameSkeleton = showSkeleton && !item.name;
                    const showQtySkeleton = showSkeleton && item.quantity === 0;
                    const showPriceSkeleton = showSkeleton && item.unitPrice === 0;
                    const showAmount = !(showQtySkeleton || showPriceSkeleton);
                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="flex-1">
                          {showNameSkeleton ? (
                            <SkeletonLine width="260px" height="10px" className="animate-pulse" />
                          ) : (
                            description || '—'
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-[117.58px] text-right tracking-[0.2px] tabular-nums">
                            {showPriceSkeleton ? (
                              <SkeletonLine
                                width="60px"
                                height="10px"
                                className="ml-auto animate-pulse"
                              />
                            ) : (
                              formatNumber(item.unitPrice)
                            )}
                          </div>
                          <div className="w-[49.92px] text-right tabular-nums">
                            {showQtySkeleton ? (
                              <SkeletonLine
                                width="24px"
                                height="10px"
                                className="ml-auto animate-pulse"
                              />
                            ) : (
                              formatNumber(item.quantity, 0)
                            )}
                          </div>
                          <div className="w-[82.51px] text-right tracking-[0.2px] tabular-nums">
                            {showAmount ? (
                              formatNumber(amount)
                            ) : (
                              <SkeletonLine
                                width="48px"
                                height="10px"
                                className="ml-auto animate-pulse"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex w-[247px] flex-col items-end gap-2">
                <div className="w-full border-y border-[#e6e6e6] py-3">
                  <div className="flex w-full flex-col items-start gap-2">
                    <div className="flex w-full items-center justify-between text-[10px] text-[#7f858b] font-['Google Sans Mono',monospace]">
                      <div>Subtotal</div>
                      <div className="flex items-center gap-1">
                        <div>{currency.symbol}</div>
                        <div className="text-right text-[12px] text-[#5f6368] tracking-[0.2px] font-['Google Sans',sans-serif] font-medium tabular-nums">
                          {showAmountSkeleton ? (
                            <SkeletonLine
                              width="70px"
                              height="10px"
                              className="ml-auto animate-pulse"
                            />
                          ) : (
                            formatNumber(subtotal)
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between text-[10px] text-[#7f858b] font-['Google Sans Mono',monospace]">
                      <div>Discount ({resolvedDiscountPercent.toFixed(2)}%)</div>
                      <div className="flex items-center gap-1">
                        <div>-{currency.symbol}</div>
                        <div className="text-right text-[12px] text-[#5f6368] tracking-[0.2px] font-['Google Sans',sans-serif] font-medium tabular-nums">
                          {showAmountSkeleton ? (
                            <SkeletonLine
                              width="60px"
                              height="10px"
                              className="ml-auto animate-pulse"
                            />
                          ) : (
                            formatNumber(discountAmount)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between text-[10px] text-[#7f858b] font-['Google Sans Mono',monospace]">
                  <div>Total Due</div>
                  <div className="flex items-center gap-1">
                    <div className="text-[12px]">{currency.symbol}</div>
                    <div className="text-right text-[18px] font-semibold text-[#575757] tracking-[0.5px] font-['Google Sans',sans-serif] tabular-nums">
                      {showAmountSkeleton ? (
                        <SkeletonLine width="78px" height="12px" className="ml-auto animate-pulse" />
                      ) : (
                        formatNumber(totalDue)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="flex w-full items-end justify-between">
          <div
            className={`flex w-full max-w-[280px] flex-col items-start ${
              refundPolicy || (showSkeleton && rawNotes !== undefined) ? 'gap-3' : 'gap-2'
            }`}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="text-[11px] text-[#7f858b] font-['Google Sans Mono',monospace] font-medium">
                Payment Details
              </div>
              {showPaymentBlock && (
                <div className="mt-[2px] flex items-start justify-between py-[4px]">
                  <div className="flex w-[190px] flex-col gap-0">
                    {showPaymentSkeleton ? (
                      <>
                        <SkeletonLine width="140px" height="10px" className="animate-pulse" />
                        <SkeletonLine width="110px" height="10px" className="animate-pulse" />
                        <SkeletonLine width="120px" height="10px" className="animate-pulse" />
                      </>
                    ) : (
                      <>
                        <div
                          className={`text-[14px] font-semibold tracking-[0.2px] font-['Google Sans',sans-serif] ${
                            isPaymentHighlight ? 'text-[var(--brand-blue)]' : 'text-[#434343]'
                          }`}
                        >
                          <span data-pdf-payment-line="main">
                            {paymentLines?.line1 || '—'}
                          </span>
                        </div>
                        <div
                          className="text-[12px] text-[#787c7d] font-['Google Sans',sans-serif] font-medium"
                          data-pdf-payment-line="sub1"
                        >
                          {paymentLines?.line2 || '—'}
                        </div>
                        {paymentLines?.line3 ? (
                          <div
                            className="text-[12px] text-[#787c7d] font-['Google Sans',sans-serif] font-medium"
                            data-pdf-payment-line="sub2"
                          >
                            {paymentLines.line3}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                  {!showPaymentSkeleton && null}
                </div>
              )}
            </div>
            {(refundPolicy || (showSkeleton && rawNotes !== undefined)) && (
              <div className="text-[10px] text-[#a4a4a4]">
                {refundPolicy ? (
                  refundPolicy
                ) : (
                  <SkeletonLine width="260px" height="10px" className="animate-pulse" />
                )}
              </div>
            )}
          </div>

          <div className="text-right text-[10px] text-[#f0f0f0] font-['Google Sans Mono',monospace]">
            risopo.com
          </div>
        </div>
      </div>
    </div>
  );
};

