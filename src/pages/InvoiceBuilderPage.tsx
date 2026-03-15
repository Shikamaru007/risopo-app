import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InvoicePdfPreview } from '../components/InvoicePdfPreview';
import { CurrencySelector } from '../components/CurrencySelector';
import { FieldLabel, SelectInput, TextInput, TextareaInput } from '../components/FormFields';

type BuilderStepId = 'client' | 'items' | 'payment' | 'review';

interface BuilderStep {
  id: BuilderStepId;
  title: string;
  subtitle: string;
}

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
    title: 'Payment Method, Notes / Refund policy',
    subtitle: 'Share how clients can pay and your terms.'
  },
  {
    id: 'review',
    title: 'Review',
    subtitle: 'Confirm details before sending.'
  }
];

const LabeledInput: React.FC<{
  label: string;
  placeholder?: string;
  type?: string;
}> = ({ label, placeholder, type = 'text' }) => (
  <label className="space-y-1.5 text-sm text-slate-500">
    <FieldLabel>{label}</FieldLabel>
    <TextInput placeholder={placeholder} type={type} />
  </label>
);

const LabeledSelect: React.FC<{ label: string; options: string[] }> = ({
  label,
  options
}) => (
  <label className="space-y-1.5 text-sm text-slate-500">
    <FieldLabel>{label}</FieldLabel>
    <div className="relative">
      <SelectInput defaultValue={options[0]}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectInput>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
        <span className="icon material-symbols-rounded text-[20px]">expand_more</span>
      </span>
    </div>
  </label>
);

const LabeledTextarea: React.FC<{ label: string; placeholder?: string; rows?: number }> = ({
  label,
  placeholder,
  rows = 4
}) => (
  <label className="space-y-1.5 text-sm text-slate-500">
    <FieldLabel>{label}</FieldLabel>
    <TextareaInput placeholder={placeholder} rows={rows} />
  </label>
);

const StepPanel: React.FC<{
  stepId: BuilderStepId;
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR';
  onCurrencyChange: (value: 'NGN' | 'USD' | 'GBP' | 'EUR') => void;
}> = ({ stepId, currency, onCurrencyChange }) => {
  const [itemRows, setItemRows] = useState<number[]>([0]);

  if (stepId === 'client') {
    return (
      <div className="space-y-3">
        <div className="grid gap-3">
          <LabeledInput label="Client name" placeholder="Client full name" />
          <LabeledInput label="Email address" placeholder="client@email.com" type="email" />
          <LabeledInput label="Phone number" placeholder="+234 000 0000" />
          <LabeledInput label="Company / Address" placeholder="Optional details" />
        </div>
      </div>
    );
  }

  if (stepId === 'items') {
    return (
      <div className="space-y-3">
        <div className="space-y-3">
          {itemRows.map((row) => (
            <div key={row} className="rounded-[22px] border border-slate-100 bg-white/80 p-3">
              <div className="flex items-center gap-1">
                <div className="flex items-center text-slate-400">
                  <span className="icon material-symbols-rounded text-[16px]">
                    drag_indicator
                  </span>
                </div>
                <div className="flex-1 space-y-3 pr-1">
                  <TextInput placeholder="Item name" />
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput placeholder="Qty" />
                    <TextInput placeholder="Price" />
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Delete item"
                  onClick={() =>
                    setItemRows((prev) => prev.filter((itemId) => itemId !== row))
                  }
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-red-400 transition-opacity ${
                    itemRows.length > 1 ? 'opacity-100' : 'pointer-events-none opacity-0'
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
          onClick={() => setItemRows((prev) => [...prev, prev.length])}
          className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-slate-100 bg-white/80 px-6 py-5 text-sm font-semibold text-slate-700"
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
            <LabeledSelect label="Payment method" options={['Bank transfer', 'Crypto', 'Link']} />
            <label className="space-y-1.5 text-sm text-slate-500">
              <FieldLabel>Currency</FieldLabel>
              <CurrencySelector value={currency} onChange={onCurrencyChange} />
            </label>
          </div>
        </div>
        <div className="rounded-[22px] border border-slate-100 bg-white/80 p-3">
          <LabeledTextarea label="Payment notes" placeholder="Add optional payment notes" rows={3} />
        </div>
        <div className="rounded-[22px] border border-slate-100 bg-white/80 p-3">
          <LabeledTextarea label="Refund policy" placeholder="Define your refund policy" rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] border border-slate-100 bg-white/80 p-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span>Summary</span>
          <span>4 Sections</span>
        </div>
        <div className="mt-3 space-y-3 text-sm text-slate-500">
          {['Client Information', 'Invoice Items', 'Payment Details', 'Totals'].map((item) => (
            <div key={item} className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span>{item}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Review</span>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-semibold text-white opacity-60"
      >
        Create invoice
      </button>
    </div>
  );
};

export const InvoiceBuilderPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'GBP' | 'EUR'>('NGN');
  const totalSteps = builderSteps.length;
  const stepOrder = useMemo(() => builderSteps.map((step) => step.id), []);
  const stepParam = searchParams.get('step') || stepOrder[0];
  const stepIndex = Math.max(0, stepOrder.indexOf(stepParam as BuilderStepId));
  const currentStep = builderSteps[stepIndex];
  const progress = useMemo(
    () => (totalSteps === 0 ? 0 : Math.round(((stepIndex + 1) / totalSteps) * 100)),
    [stepIndex, totalSteps]
  );

  const goNext = useCallback(() => {
    const nextIndex = Math.min(stepIndex + 1, totalSteps - 1);
    const next = stepOrder[nextIndex];
    setSearchParams({ step: next });
  }, [setSearchParams, stepIndex, stepOrder, totalSteps]);

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

  return (
    <section className="space-y-6">
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Step {stepIndex + 1} of {totalSteps}
            </p>
            <h3 className="text-xl font-semibold text-ink md:text-2xl">
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
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 font-['Google_Sans_Mono',monospace]">
                    Client
                  </div>
                  <div className="text-sm font-semibold text-ink">John Doe</div>
                  <div className="text-xs text-slate-500">anonymous@test.com</div>
                </div>
                <div className="w-[96px]">
                  <CurrencySelector
                    value={currency}
                    onChange={setCurrency}
                    buttonClassName="h-10 px-3 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <StepPanel
                stepId={currentStep.id}
                currency={currency}
                onCurrencyChange={setCurrency}
              />
            </div>

            <div className="hidden flex-row gap-3 lg:flex">
              <button
                type="button"
                onClick={goPrev}
                disabled={stepIndex === 0}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="icon material-symbols-rounded text-[18px]">arrow_back</span>
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={stepIndex === totalSteps - 1}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-blue)] px-5 py-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next step
                <span className="icon material-symbols-rounded text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          <aside className="hidden lg:flex lg:items-start lg:justify-center">
            <div className="w-full overflow-hidden rounded-[22px] border border-slate-100 bg-white/70">
              <div className="flex w-full justify-center">
                <InvoicePdfPreview className="origin-top scale-[0.9]" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 lg:hidden">
        <div className="mx-auto flex w-full max-w-[1240px] gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="icon material-symbols-rounded text-[18px]">arrow_back</span>
            Back
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={stepIndex === totalSteps - 1}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-blue)] px-5 py-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next step
            <span className="icon material-symbols-rounded text-[18px]">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
