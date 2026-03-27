import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InvoicePdfPreview } from '../components/InvoicePdfPreview';
import { PdfPreviewFrame } from '../components/PdfPreviewFrame';
import { CurrencySelector } from '../components/CurrencySelector';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { FieldLabel, TextInput, TextareaInput } from '../components/FormFields';
import { useDexieReady } from '../hooks/useDexieReady';
import { getSettings } from '../db/settings';
import { SettingsRecord, PaymentMethod as SettingsPaymentMethod } from '../types/settings';
import { getAsset } from '../db/assets';
import { readLogoCache, readSettingsCache } from '../utils/settingsCache';
import { getNextInvoiceNumber } from '../utils/invoiceNumber';
import { getInvoice } from '../db/invoices';

type BuilderStepId = 'client' | 'items' | 'payment';

interface BuilderStep {
  id: BuilderStepId;
  title: string;
  subtitle: string;
}

interface InvoiceItemDraft {
  id: string;
  name: string;
  quantity: string;
  price: string;
}

interface ClientDraft {
  name: string;
  email: string;
  address: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeDecimalInput = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [head, ...rest] = cleaned.split('.');
  if (rest.length === 0) return head;
  return `${head}.${rest.join('')}`;
};

const formatCurrencyInput = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [head, ...rest] = cleaned.split('.');
  const decimal = rest.join('');
  if (!head && !decimal) return '';
  const normalizedHead = head || '0';
  const withCommas = normalizedHead.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal.length > 0 ? `${withCommas}.${decimal}` : withCommas;
};

const parseCurrencyValue = (value: string) => {
  const numeric = value.replace(/,/g, '');
  const parsed = Number.parseFloat(numeric || '0');
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizePhoneInput = (value: string) => {
  const cleaned = value.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return `+${cleaned.slice(1).replace(/\+/g, '')}`;
  }
  return cleaned.replace(/\+/g, '');
};

const builderSteps: BuilderStep[] = [
  {
    id: 'client',
    title: 'Client Information',
    subtitle: 'Who is this invoice for?'
  },
  {
    id: 'items',
    title: 'Invoice Items',
    subtitle: 'Add services, quantities, and pricing.'
  },
  {
    id: 'payment',
    title: 'Payment & Note',
    subtitle: 'Share how clients can pay and your terms.'
  }
];

const LabeledInput: React.FC<{
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}> = ({ label, placeholder, type = 'text', value, onChange }) => (
  <label className="space-y-1.5 text-sm text-slate-500">
    <FieldLabel>{label}</FieldLabel>
    <TextInput placeholder={placeholder} type={type} value={value} onChange={onChange} />
  </label>
);

const LabeledTextarea: React.FC<{
  label: string;
  placeholder?: string;
  rows?: number;
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
}> = ({ label, placeholder, rows = 4, value, onChange }) => (
  <label className="space-y-1.5 text-sm text-slate-500">
    <FieldLabel>{label}</FieldLabel>
    <TextareaInput placeholder={placeholder} rows={rows} value={value} onChange={onChange} />
  </label>
);

const StepPanel: React.FC<{
  stepId: BuilderStepId;
  client: ClientDraft;
  clientPhone: string;
  onClientChange: (field: keyof ClientDraft, value: string) => void;
  onClientPhoneChange: (value: string) => void;
  items: InvoiceItemDraft[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onItemChange: (id: string, updates: Partial<InvoiceItemDraft>) => void;
  totalDue: number;
  currencySymbol: string;
  paymentMethod: 'bank' | 'crypto' | 'link';
  selectedPaymentDetails?: SettingsPaymentMethod;
  onPaymentMethodChange: (value: 'bank' | 'crypto' | 'link') => void;
  notes: string;
  onNotesChange: (value: string) => void;
  includeNotes: boolean;
  onIncludeNotesChange: (value: boolean) => void;
  includeDiscount: boolean;
  onIncludeDiscountChange: (value: boolean) => void;
  discountAmount: string;
  onDiscountAmountChange: (value: string) => void;
  discountPercentValue: number;
  discountAmountValue: number;
}> = ({
  stepId,
  client,
  clientPhone,
  onClientChange,
  onClientPhoneChange,
  items,
  onAddItem,
  onRemoveItem,
  onItemChange,
  totalDue,
  currencySymbol,
  paymentMethod,
  selectedPaymentDetails,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  includeNotes,
  onIncludeNotesChange,
  includeDiscount,
  onIncludeDiscountChange,
  discountAmount,
  onDiscountAmountChange,
  discountPercentValue,
  discountAmountValue
}) => {
  const paymentDetails =
    selectedPaymentDetails?.type === paymentMethod ? selectedPaymentDetails : undefined;

  const PaymentDetailsSkeleton = () => (
    <div className="space-y-2">
      <div className="h-3 w-32 rounded-full bg-slate-200 animate-pulse" />
      <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
      <div className="h-3 w-36 rounded-full bg-slate-200 animate-pulse" />
      <div className="text-[11px] text-slate-400">
        Add a payment method in{' '}
        <a
          href="/settings"
          className="font-medium text-[var(--brand-blue)] underline underline-offset-2 transition-colors hover:text-[var(--brand-blue-dark)]"
        >
          Settings
        </a>{' '}
        to preview details.
      </div>
    </div>
  );

  if (stepId === 'client') {
    return (
      <div className="space-y-3">
        <div className="grid gap-3">
          <LabeledInput
            label="Client name *"
            placeholder="Client full name"
            value={client.name}
            onChange={(event) => onClientChange('name', event.target.value)}
          />
          <LabeledInput
            label="Email address"
            placeholder="client@email.com"
            type="email"
            value={client.email}
            onChange={(event) => onClientChange('email', event.target.value)}
          />
          <LabeledInput
            label="Phone number *"
            placeholder="+234 000 0000"
            value={clientPhone}
            onChange={(event) => onClientPhoneChange(sanitizePhoneInput(event.target.value))}
          />
        </div>
      </div>
    );
  }

  if (stepId === 'items') {
    return (
      <div className="space-y-3">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-[22px] border border-slate-100 bg-white/80 p-3">
              <div className="flex items-center gap-1">
                <div className="flex items-center text-slate-400">
                  <span className="icon material-symbols-rounded text-[16px]">
                    drag_indicator
                  </span>
                </div>
                <div className="flex-1 space-y-3 pr-1">
                  <TextInput
                    placeholder="Item name"
                    value={item.name}
                    onChange={(event) =>
                      onItemChange(item.id, { name: event.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput
                      placeholder="Qty"
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(event) =>
                        onItemChange(item.id, {
                          quantity: sanitizeDecimalInput(event.target.value)
                        })
                      }
                    />
                    <TextInput
                      placeholder="Price"
                      inputMode="decimal"
                      value={item.price}
                      onChange={(event) =>
                        onItemChange(item.id, {
                          price: formatCurrencyInput(event.target.value)
                        })
                      }
                    />
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Delete item"
                  onClick={() => onRemoveItem(item.id)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-red-400 transition-opacity ${
                    items.length > 1 ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  <span className="icon material-symbols-rounded text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-100 bg-white/80 px-6 py-5 text-sm font-medium text-slate-700"
        >
          Add Item
          <span className="icon material-symbols-rounded text-[20px]">add</span>
        </button>
      </div>
    );
  }

  if (stepId === 'payment') {
    return (
      <div className="space-y-3">
        <div className="rounded-[22px] border border-slate-100 bg-white/80 p-3">
          <div className="grid gap-3">
            <div className="space-y-1.5 text-sm text-slate-500">
              <FieldLabel>Payment method</FieldLabel>
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={onPaymentMethodChange}
              />
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-500">
              {paymentMethod === 'bank' && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-['Google_Sans_Mono',monospace]">
                    Bank transfer
                  </div>
                  {paymentDetails && paymentDetails.type === 'bank' ? (
                    <>
                      <div className="text-sm font-medium text-ink">
                        {paymentDetails.accountNumber || '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {paymentDetails.bankName || '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {paymentDetails.accountName || '—'}
                      </div>
                    </>
                  ) : (
                    <PaymentDetailsSkeleton />
                  )}
                </div>
              )}
              {paymentMethod === 'crypto' && (
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-['Google_Sans_Mono',monospace]">
                    Crypto wallet
                  </div>
                  {paymentDetails && paymentDetails.type === 'crypto' ? (
                    <>
                      <div className="text-sm font-medium text-ink">
                        {paymentDetails.walletAddress || '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {paymentDetails.network || '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {paymentDetails.label || '—'}
                      </div>
                    </>
                  ) : (
                    <PaymentDetailsSkeleton />
                  )}
                </div>
              )}
              {paymentMethod === 'link' && (
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-['Google_Sans_Mono',monospace]">
                    Payment link
                  </div>
                  {paymentDetails && paymentDetails.type === 'link' ? (
                    <>
                      <div className="text-sm font-medium text-ink">
                        {paymentDetails.url || '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {paymentDetails.label || '—'}
                      </div>
                    </>
                  ) : (
                    <PaymentDetailsSkeleton />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-[22px] border border-slate-100 bg-white/80 p-3">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">
            <span className="text-sm font-medium text-slate-600">Include discount</span>
            <button
              type="button"
              onClick={() => onIncludeDiscountChange(!includeDiscount)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                includeDiscount ? 'bg-[var(--brand-blue)]' : 'bg-slate-200'
              }`}
              aria-pressed={includeDiscount}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  includeDiscount ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {includeDiscount && (
            <div className="mt-3">
              <label className="space-y-1.5 text-sm text-slate-500">
                <FieldLabel>Discount amount</FieldLabel>
                <TextInput
                  placeholder="e.g. 5000"
                  inputMode="decimal"
                  value={discountAmount}
                  onChange={(event) =>
                    onDiscountAmountChange(formatCurrencyInput(event.target.value))
                  }
                />
              </label>
            </div>
          )}
        </div>
        <div className="rounded-[22px] border border-slate-100 bg-white/80 p-3">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">
            <span className="text-sm font-medium text-slate-600">
              Include notes / refund policy
            </span>
            <button
              type="button"
              onClick={() => onIncludeNotesChange(!includeNotes)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                includeNotes ? 'bg-[var(--brand-blue)]' : 'bg-slate-200'
              }`}
              aria-pressed={includeNotes}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  includeNotes ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {includeNotes && (
            <LabeledTextarea
              label="Notes / Refund policy"
              placeholder="Add optional notes or refund terms"
              rows={4}
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export const InvoiceBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ready = useDexieReady();
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'crypto' | 'link'>('bank');
  const [isGenerating, setIsGenerating] = useState(false);
  const [client, setClient] = useState<ClientDraft>({ name: '', email: '', address: '' });
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeDiscount, setIncludeDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItemDraft[]>([
    { id: 'item-0', name: '', quantity: '', price: '' }
  ]);
  const draftStorageKey = 'invoiceBuilderDraft';
  const itemDraftStorageKey = 'invoiceBuilderDraftItems';
  const hasLoadedDraft = useRef(false);
  const totalSteps = builderSteps.length;
  const stepOrder = useMemo(() => builderSteps.map((step) => step.id), []);
  const stepParam = searchParams.get('step') || stepOrder[0];
  const stepIndex = Math.max(0, stepOrder.indexOf(stepParam as BuilderStepId));
  const currentStep = builderSteps[stepIndex];
  const isFinalStep = stepIndex === totalSteps - 1;
  const duplicateId = searchParams.get('duplicate');
  const progress = useMemo(
    () => (totalSteps === 0 ? 0 : Math.round(((stepIndex + 1) / totalSteps) * 100)),
    [stepIndex, totalSteps]
  );
  const currencySymbol = useMemo(() => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'GBP':
        return '£';
      case 'EUR':
        return '€';
      default:
        return '₦';
    }
  }, [currency]);

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const qty = Number.parseFloat(item.quantity || '0');
      const price = parseCurrencyValue(item.price);
      const quantity = Number.isFinite(qty) ? qty : 0;
      const unitPrice = Number.isFinite(price) ? price : 0;
      const total = quantity * unitPrice;
      return {
        id: item.id,
        name: item.name.trim(),
        quantity,
        unitPrice,
        total
      };
    });
  }, [items]);

  const isEmailValid = useMemo(() => {
    const value = client.email.trim();
    return value.length === 0 || emailRegex.test(value);
  }, [client.email]);

  const isClientValid = useMemo(() => {
    return client.name.trim().length > 0 && clientPhone.trim().length > 0 && isEmailValid;
  }, [client.name, clientPhone, isEmailValid]);

  const isItemsValid = useMemo(() => {
    let hasComplete = false;
    let hasPartial = false;
    items.forEach((item) => {
      const name = item.name.trim();
      const qtyValue = Number.parseFloat(item.quantity || '0');
      const priceValue = parseCurrencyValue(item.price);
      const hasAnyInput =
        name.length > 0 || item.quantity.trim().length > 0 || item.price.trim().length > 0;
      const isComplete = name.length > 0 && qtyValue > 0 && priceValue > 0;
      if (isComplete) hasComplete = true;
      if (hasAnyInput && !isComplete) hasPartial = true;
    });
    return hasComplete && !hasPartial;
  }, [items]);

  const canProceed = useMemo(() => {
    if (currentStep.id === 'client') return isClientValid;
    if (currentStep.id === 'items') return isItemsValid;
    return isClientValid && isItemsValid;
  }, [currentStep.id, isClientValid, isItemsValid]);

  const subtotal = useMemo(
    () => normalizedItems.reduce((sum, item) => sum + item.total, 0),
    [normalizedItems]
  );

  const discountAmountValue = useMemo(() => {
    if (!includeDiscount) return 0;
    const amount = parseCurrencyValue(discountAmount);
    return Math.min(Math.max(amount, 0), subtotal);
  }, [discountAmount, includeDiscount, subtotal]);

  const discountPercentValue = useMemo(() => {
    if (!includeDiscount || subtotal <= 0) return 0;
    return Math.min(Math.max((discountAmountValue / subtotal) * 100, 0), 100);
  }, [discountAmountValue, includeDiscount, subtotal]);

  const totalDue = useMemo(
    () => Math.max(subtotal - discountAmountValue, 0),
    [discountAmountValue, subtotal]
  );

  const handleAddItem = useCallback(() => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`;
    setItems((prev) => [...prev, { id, name: '', quantity: '', price: '' }]);
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  }, []);

  const handleItemChange = useCallback(
    (id: string, updates: Partial<InvoiceItemDraft>) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    },
    []
  );

  const goNext = useCallback(() => {
    const nextIndex = Math.min(stepIndex + 1, totalSteps - 1);
    const next = stepOrder[nextIndex];
    setSearchParams({ step: next });
  }, [setSearchParams, stepIndex, stepOrder, totalSteps]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating || !isClientValid || !isItemsValid) return;
    setIsGenerating(true);
    const now = new Date();
    const invoiceId = crypto.randomUUID ? crypto.randomUUID() : `inv-${Date.now()}`;
    const invoiceNumber = await getNextInvoiceNumber();
    const invoiceRecord = {
      id: invoiceId,
      invoiceNumber,
      status: 'pending' as const,
      issueDate: now.toISOString(),
      dueDate: now.toISOString(),
      currency,
      client: {
        name: client.name.trim() || 'Unnamed client',
        email: client.email.trim() || undefined,
        address: client.address.trim() || undefined,
        phone: clientPhone.trim() || undefined
      },
      items: normalizedItems,
      subtotal,
      tax: discountAmountValue,
      total: totalDue,
      paymentMethod,
      notes: includeNotes ? notes.trim() || undefined : undefined,
      refundPolicy: undefined,
      createdAt: now.toISOString()
    };
    try {
      window.sessionStorage.setItem('generatedInvoice', JSON.stringify(invoiceRecord));
      window.sessionStorage.setItem('generatedClientPhone', clientPhone);
    } catch {
      // Ignore storage failures (e.g. private mode)
    }
    window.setTimeout(() => {
      navigate('/builder/preview', { state: { invoice: invoiceRecord, clientPhone } });
    }, 900);
  }, [
    client,
    clientPhone,
    currency,
    isGenerating,
    isClientValid,
    isItemsValid,
    navigate,
    normalizedItems,
    discountAmountValue,
    includeNotes,
    notes,
    paymentMethod,
    subtotal,
    totalDue
  ]);

  const goPrev = useCallback(() => {
    const prevIndex = Math.max(stepIndex - 1, 0);
    const next = stepOrder[prevIndex];
    setSearchParams({ step: next });
  }, [setSearchParams, stepIndex, stepOrder]);

  useEffect(() => {
    if (!searchParams.get('step')) {
      setSearchParams({ step: stepOrder[0] }, { replace: true });
    }
  }, [searchParams, setSearchParams, stepOrder]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedDraft = window.sessionStorage.getItem(draftStorageKey);
      if (storedDraft) {
        const parsed = JSON.parse(storedDraft) as {
          currency?: 'NGN' | 'USD' | 'GBP' | 'EUR';
          paymentMethod?: 'bank' | 'crypto' | 'link';
          client?: ClientDraft;
          clientPhone?: string;
          notes?: string;
          includeNotes?: boolean;
          includeDiscount?: boolean;
          discountAmount?: string;
          items?: InvoiceItemDraft[];
        };
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.client) {
          setClient({
            name: parsed.client.name ?? '',
            email: parsed.client.email ?? '',
            address: parsed.client.address ?? ''
          });
        }
        if (typeof parsed.clientPhone === 'string') setClientPhone(parsed.clientPhone);
        if (typeof parsed.notes === 'string') setNotes(parsed.notes);
        if (typeof parsed.includeNotes === 'boolean') setIncludeNotes(parsed.includeNotes);
        if (typeof parsed.includeDiscount === 'boolean') setIncludeDiscount(parsed.includeDiscount);
        if (typeof parsed.discountAmount === 'string') setDiscountAmount(parsed.discountAmount);
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          setItems(
            parsed.items.map((item, index) => ({
              id: item.id || `item-${index}`,
              name: item.name ?? '',
              quantity: item.quantity ?? '',
              price: item.price ?? ''
            }))
          );
        }
        hasLoadedDraft.current = true;
        return;
      }
    } catch {
      // ignore malformed session storage
    }

    try {
      const storedItems = window.sessionStorage.getItem(itemDraftStorageKey);
      if (!storedItems) {
        hasLoadedDraft.current = true;
        return;
      }
      const parsed = JSON.parse(storedItems) as InvoiceItemDraft[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        hasLoadedDraft.current = true;
        return;
      }
      setItems(
        parsed.map((item, index) => ({
          id: item.id || `item-${index}`,
          name: item.name ?? '',
          quantity: item.quantity ?? '',
          price: item.price ?? ''
        }))
      );
    } catch {
      // ignore malformed session storage
    } finally {
      hasLoadedDraft.current = true;
    }
  }, []);

  useEffect(() => {
    if (!ready || !duplicateId) return;
    let mounted = true;
    getInvoice(duplicateId)
      .then((invoice) => {
        if (!mounted || !invoice) return;
        const allowedCurrencies = ['NGN', 'USD', 'GBP', 'EUR'] as const;
        const nextCurrency = allowedCurrencies.includes(
          invoice.currency as (typeof allowedCurrencies)[number]
        )
          ? (invoice.currency as (typeof allowedCurrencies)[number])
          : 'NGN';
        const rawPhone = invoice.client?.phone?.trim() || '';
        const addressCandidate = invoice.client?.address?.trim() || '';
        const digits = addressCandidate.replace(/\D/g, '');
        const phoneFromAddress =
          !rawPhone && digits.length >= 7 && digits.length <= 15 ? addressCandidate : '';
        const clientPhoneValue = rawPhone || phoneFromAddress;

        setCurrency(nextCurrency);
        setPaymentMethod(invoice.paymentMethod || 'bank');
        setClient({
          name: invoice.client?.name ?? '',
          email: invoice.client?.email ?? '',
          address: invoice.client?.address ?? ''
        });
        setClientPhone(clientPhoneValue);
        setNotes('');
        setIncludeNotes(false);
        setIncludeDiscount(false);
        setDiscountAmount('');
        setItems([{ id: 'item-0', name: '', quantity: '', price: '' }]);

        try {
          const draft = {
            currency: nextCurrency,
            paymentMethod: invoice.paymentMethod || 'bank',
            client: {
              name: invoice.client?.name ?? '',
              email: invoice.client?.email ?? '',
              address: invoice.client?.address ?? ''
            },
            clientPhone: clientPhoneValue,
            notes: '',
            includeNotes: false,
            includeDiscount: false,
            discountAmount: '',
            items: [{ id: 'item-0', name: '', quantity: '', price: '' }]
          };
          window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
          window.sessionStorage.removeItem(itemDraftStorageKey);
        } catch {
          // ignore storage failures
        }
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, [duplicateId, ready]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasLoadedDraft.current) return;
    try {
      const draft = {
        currency,
        paymentMethod,
        client,
        clientPhone,
        notes,
        includeNotes,
        includeDiscount,
        discountAmount,
        items
      };
      window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
    } catch {
      // ignore storage failures
    }
  }, [
    client,
    clientPhone,
    currency,
    discountAmount,
    includeDiscount,
    includeNotes,
    items,
    notes,
    paymentMethod
  ]);

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
    return settings?.paymentMethods?.find((method) => method.type === paymentMethod);
  }, [paymentMethod, settings?.paymentMethods]);

  return (
    <section className="space-y-6">
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Step {stepIndex + 1} of {totalSteps}
            </p>
            <h3 className="text-xl font-medium text-ink md:text-2xl">
              {currentStep.title}
            </h3>
          </div>
          <div className="w-[120px] shrink-0 sm:w-[160px] md:w-[220px] lg:w-[280px]">
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[var(--brand-blue)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,40%)_minmax(0,60%)]">
          <div className="space-y-4">
            {stepIndex > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-100 bg-white/80 px-5 py-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 font-['Google_Sans_Mono',monospace]">
                    Client
                  </div>
                  <div className="text-sm font-medium text-ink">
                    {client.name.trim() || 'Client name'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {client.email.trim() || 'No email provided'}
                  </div>
                </div>
                {stepIndex === 1 ? (
                  <div className="w-[96px]">
                    <CurrencySelector
                      value={currency}
                      onChange={setCurrency}
                      buttonClassName="h-10 px-3 text-xs"
                    />
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 font-['Google_Sans_Mono',monospace]">
                      Total due
                    </div>
                    <div className="text-base font-medium text-ink">
                      {currencySymbol}{' '}
                      {totalDue.toLocaleString('en-NG', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <StepPanel
                stepId={currentStep.id}
                client={client}
                clientPhone={clientPhone}
                onClientChange={(field, value) =>
                  setClient((prev) => ({ ...prev, [field]: value }))
                }
                onClientPhoneChange={setClientPhone}
                items={items}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onItemChange={handleItemChange}
                totalDue={totalDue}
                currencySymbol={currencySymbol}
                paymentMethod={paymentMethod}
                selectedPaymentDetails={selectedPaymentDetails}
                onPaymentMethodChange={setPaymentMethod}
                notes={notes}
                onNotesChange={setNotes}
                includeNotes={includeNotes}
                onIncludeNotesChange={setIncludeNotes}
                includeDiscount={includeDiscount}
                onIncludeDiscountChange={setIncludeDiscount}
                discountAmount={discountAmount}
                onDiscountAmountChange={setDiscountAmount}
                discountPercentValue={discountPercentValue}
                discountAmountValue={discountAmountValue}
              />
            </div>

            <div className="hidden flex-row gap-3 lg:flex">
              <button
                type="button"
                onClick={goPrev}
                disabled={stepIndex === 0 || isGenerating}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="icon material-symbols-rounded text-[18px]">arrow_back</span>
                Back
              </button>
              <button
                type="button"
                onClick={isFinalStep ? handleGenerate : goNext}
                disabled={isGenerating || !canProceed}
                className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--brand-blue)] px-5 py-5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : isFinalStep ? (
                  <>
                    Generate invoice
                    <span className="icon material-symbols-rounded text-[18px]">
                      receipt_long
                    </span>
                  </>
                ) : (
                  <>
                    Next step
                    <span className="icon material-symbols-rounded text-[18px]">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          <aside className="hidden lg:flex lg:items-start lg:justify-center">
            <div className="w-full overflow-hidden rounded-[22px] border border-slate-100 bg-white/70 p-4">
              <PdfPreviewFrame>
                <InvoicePdfPreview
                  showSkeleton
                  invoice={{
                    invoiceNumber: 'Draft',
                    issueDate: new Date().toISOString(),
                    currency,
                    client: {
                      name: client.name.trim() || 'Client name',
                      email: client.email.trim() || undefined,
                      address: client.address.trim() || undefined
                    },
                    items: normalizedItems,
                    subtotal,
                    tax: discountAmountValue,
                    total: totalDue,
                    paymentMethod,
                    notes: includeNotes ? notes : undefined,
                    createdAt: new Date().toISOString()
                  }}
                  logoUrl={logoUrl ?? undefined}
                  profile={settings ?? undefined}
                  paymentMethod={selectedPaymentDetails}
                  discountPercent={discountPercentValue}
                  showDiscount={includeDiscount}
                  clientPhone={clientPhone || undefined}
                />
              </PdfPreviewFrame>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 lg:hidden">
        <div className="mx-auto flex w-full max-w-[1240px] gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIndex === 0 || isGenerating}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="icon material-symbols-rounded text-[18px]">arrow_back</span>
            Back
          </button>
          <button
            type="button"
            onClick={isFinalStep ? handleGenerate : goNext}
            disabled={isGenerating || !canProceed}
            className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--brand-blue)] px-5 py-5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : isFinalStep ? (
              <>
                Generate invoice
                <span className="icon material-symbols-rounded text-[18px]">
                  receipt_long
                </span>
              </>
            ) : (
              <>
                Next step
                <span className="icon material-symbols-rounded text-[18px]">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
