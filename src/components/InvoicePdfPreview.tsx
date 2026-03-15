import React from 'react';
import risopoLogo from '../assets/risopo.svg';
import { InvoiceItem, InvoiceRecord, PaymentMethodType } from '../types/invoice';
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

const fallbackPayments: Record<PaymentMethodType, { line1: string; line2: string; line3: string }> =
  {
    bank: {
      line1: '0171457329',
      line2: 'Gtbank',
      line3: 'Michael Boluwatife Onafowokan'
    },
    crypto: {
      line1: '0x4d9f...9b2a',
      line2: 'Ethereum (ERC-20)',
      line3: 'Risopo Treasury'
    },
    link: {
      line1: 'https://pay.risopo.com/invoice',
      line2: 'Default checkout link',
      line3: 'Payment link'
    }
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

const resolvePaymentLines = (
  paymentMethod?: PaymentMethod,
  fallbackType: PaymentMethodType = 'bank'
) => {
  if (!paymentMethod) return fallbackPayments[fallbackType];
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
  showSkeleton?: boolean;
  discountPercent?: number;
  showDiscount?: boolean;
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
  showDiscount = true
}) => {
  const items = invoice?.items?.length ? invoice.items : fallbackItems;
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
  const paymentLines = resolvePaymentLines(paymentMethod, invoice?.paymentMethod ?? 'bank');

  const fromNameValue = profile?.businessName?.trim() || (showSkeleton ? '' : fallbackFrom.name);
  const fromEmailValue = profile?.businessEmail?.trim() || (showSkeleton ? '' : fallbackFrom.email);
  const fromPhoneValue = profile?.phone?.trim() || (showSkeleton ? '' : fallbackFrom.phone);

  const toName = invoice?.client?.name?.trim() || (showSkeleton ? '' : fallbackTo.name);
  const toEmail = invoice?.client?.email?.trim() || (showSkeleton ? '' : fallbackTo.email);
  const toPhone =
    clientPhone || invoice?.client?.address?.trim() || (showSkeleton ? '' : fallbackTo.phone);

  const issueDate = formatDate(invoice?.issueDate, '16.04.2026');
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
      className={`relative h-[842px] w-[595px] bg-white p-[44px] text-[#787c7d] ${className || ''}`}
    >
      <div className="flex h-full w-full flex-col items-start justify-between">
        <div className="flex w-[507px] flex-1 flex-col justify-between">
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div className="flex h-[64px] w-[64px] items-center justify-center overflow-hidden">
                <img
                  alt="Company logo"
                  className="h-[16px] w-[64px] object-contain"
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
                <div className="text-[12px] text-[#5f6368]">{issueDate}</div>
              </div>
              <div className="flex w-[71px] flex-col items-start gap-1">
                <div className="text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  Currency
                </div>
                <div className="text-[12px] text-[#5f6368]">{currency.label}</div>
              </div>
            </div>

            <div className="flex w-[342px] items-start justify-between">
              <div className="flex flex-col items-start gap-1">
                <div className="text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  From
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <div className="text-[12px] text-[#5f6368]">
                    {fromNameValue ? (
                      fromNameValue
                    ) : showSkeleton ? (
                      <SkeletonLine width="140px" height="10px" className="animate-pulse" />
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[12px] text-[#5f6368]">
                    {fromEmailValue ? (
                      fromEmailValue
                    ) : showSkeleton ? (
                      <SkeletonLine width="120px" height="10px" className="animate-pulse" />
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[12px] text-[#5f6368]">
                    {fromPhoneValue ? (
                      fromPhoneValue
                    ) : showSkeleton ? (
                      <SkeletonLine width="110px" height="10px" className="animate-pulse" />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start gap-1">
                <div className="text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  To
                </div>
                <div className="flex flex-col items-start gap-0.5">
                  <div className="text-[12px] text-[#5f6368]">
                    {toName ? (
                      toName
                    ) : showSkeleton ? (
                      <SkeletonLine width="140px" height="10px" className="animate-pulse" />
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[12px] text-[#5f6368]">
                    {toEmail ? (
                      toEmail
                    ) : showSkeleton ? (
                      <SkeletonLine width="120px" height="10px" className="animate-pulse" />
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[12px] text-[#5f6368]">
                    {toPhone ? (
                      toPhone
                    ) : showSkeleton ? (
                      <SkeletonLine width="110px" height="10px" className="animate-pulse" />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-end gap-6">
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center justify-between text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  <div className="flex-1">Item / Service</div>
                  <div className="flex items-center gap-3">
                    <div className="w-[117.58px] text-right">Unit Cost</div>
                    <div className="w-[49.92px] text-right">Qty</div>
                    <div className="w-[82.51px] text-right">Amount</div>
                  </div>
                </div>
                <div className="flex flex-col gap-6 text-[12px] text-[#5f6368]">
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
                          <div className="w-[117.58px] text-right tracking-[0.2px]">
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
                          <div className="w-[49.92px] text-right">
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
                          <div className="w-[82.51px] text-right tracking-[0.2px]">
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

              <div className="flex w-[247px] flex-col items-end gap-3">
                <div className="w-full border-y border-[#e6e6e6] py-3">
                  <div className="flex w-full flex-col items-start gap-2">
                    <div className="flex w-full items-center justify-between text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                      <div>Subtotal</div>
                      <div className="flex items-center gap-1">
                        <div>{currency.symbol}</div>
                        <div className="text-right text-[12px] text-[#5f6368] tracking-[0.2px] font-['Google_Sans',sans-serif]">
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
                    <div className="flex w-full items-center justify-between text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                      <div>Discount ({resolvedDiscountPercent.toFixed(2)}%)</div>
                      <div className="flex items-center gap-1">
                        <div>-{currency.symbol}</div>
                        <div className="text-right text-[12px] text-[#5f6368] tracking-[0.2px] font-['Google_Sans',sans-serif]">
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
                <div className="flex w-full items-center justify-between text-[10px] text-[#9599a0] font-['Google_Sans_Mono',monospace]">
                  <div>Total Due</div>
                  <div className="flex items-center gap-1">
                    <div className="text-[12px]">{currency.symbol}</div>
                    <div className="text-right text-[16px] font-medium text-[#575757] tracking-[0.5px] font-['Google_Sans',sans-serif]">
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

          <div
            className={`flex w-[377px] flex-col items-start ${
              refundPolicy || (showSkeleton && rawNotes !== undefined) ? 'gap-4' : 'gap-0'
            }`}
          >
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
        </div>

        <div className="w-full text-right text-[10px] text-[#f0f0f0] font-['Google_Sans_Mono',monospace]">
          risopo.com
        </div>
      </div>
    </div>
  );
};
