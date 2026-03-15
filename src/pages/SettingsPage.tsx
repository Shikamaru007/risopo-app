import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addAsset, getAsset } from '../db/assets';
import { getSettings, upsertSettings } from '../db/settings';
import { PaymentMethod } from '../types/settings';
import { SettingsRecord } from '../types/settings';
import { useDexieReady } from '../hooks/useDexieReady';
import { FieldLabel, SelectInput, TextInput, TextareaInput } from '../components/FormFields';

type SettingsForm = {
  businessName: string;
  businessEmail: string;
  phone: string;
  businessAddress: string;
  defaultCurrency: string;
  refundPolicy: string;
  paymentMethods: PaymentMethod[];
  logoId?: string;
};

const emptyForm: SettingsForm = {
  businessName: '',
  businessEmail: '',
  phone: '',
  businessAddress: '',
  defaultCurrency: 'NGN',
  refundPolicy: '',
  paymentMethods: []
};

const sanitizePhoneInput = (value: string) => {
  const cleaned = value.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return `+${cleaned.slice(1).replace(/\+/g, '')}`;
  }
  return cleaned.replace(/\+/g, '');
};

export const SettingsPage: React.FC = () => {
  const ready = useDexieReady();
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [draftMethods, setDraftMethods] = useState<PaymentMethod[]>([]);
  const [bankSaveAttempts, setBankSaveAttempts] = useState<string[]>([]);
  const [cryptoSaveAttempts, setCryptoSaveAttempts] = useState<string[]>([]);
  const [linkSaveAttempts, setLinkSaveAttempts] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    getSettings().then((settings) => {
      if (!settings) return;
      setForm((prev) => ({
        ...prev,
        businessName: settings.businessName || '',
        businessEmail: settings.businessEmail || '',
        phone: settings.phone || '',
        businessAddress: settings.businessAddress || '',
        defaultCurrency: settings.defaultCurrency || 'NGN',
        refundPolicy: settings.refundPolicy || '',
        paymentMethods: settings.paymentMethods || [],
        logoId: settings.logoId
      }));
      setDraftMethods([]);
      setCryptoSaveAttempts([]);
      setBankSaveAttempts([]);
      setLinkSaveAttempts([]);
      if (settings.logoId) {
        getAsset(settings.logoId).then((asset) => {
          if (asset?.dataUrl) setLogoPreview(asset.dataUrl);
        });
      }
    });
  }, [ready]);

  const updateField = useCallback(<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addPaymentMethod = useCallback((type: PaymentMethod['type']) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `pm-${Date.now()}`;
    const base = { id, type, label: '' } as PaymentMethod;
    const method =
      type === 'bank'
        ? { ...base, bankName: '', accountName: '', accountNumber: '' }
        : type === 'crypto'
          ? { ...base, network: '', walletAddress: '' }
          : { ...base, url: '' };
    setDraftMethods((prev) => [...prev, method]);
  }, []);

  const updateDraftMethod = useCallback(
    (id: string, updates: Partial<PaymentMethod>) => {
      setDraftMethods((prev) =>
        prev.map((method) =>
          method.id === id ? ({ ...method, ...updates } as PaymentMethod) : method
        )
      );
    },
    []
  );

  const removeDraftMethod = useCallback((id: string) => {
    setDraftMethods((prev) => prev.filter((method) => method.id !== id));
  }, []);

  const saveDraftMethod = useCallback((id: string) => {
    setDraftMethods((prev) => {
      const draft = prev.find((method) => method.id === id);
      if (!draft) return prev;
      if (draft.type === 'bank') {
        const bankNameValid = Boolean(draft.bankName?.trim());
        const accountNumberValid = (draft.accountNumber ?? '').length === 10;
        if (!bankNameValid || !accountNumberValid) {
          setBankSaveAttempts((current) =>
            current.includes(id) ? current : [...current, id]
          );
          return prev;
        }
      }
      if (draft.type === 'crypto') {
        const labelValid = Boolean(draft.label?.trim());
        const networkValid = Boolean(draft.network?.trim());
        const walletValid = Boolean(draft.walletAddress?.trim());
        if (!labelValid || !networkValid || !walletValid) {
          setCryptoSaveAttempts((current) =>
            current.includes(id) ? current : [...current, id]
          );
          return prev;
        }
      }
      if (draft.type === 'link') {
        const labelValid = Boolean(draft.label?.trim());
        const urlValid = Boolean(draft.url?.trim());
        if (!labelValid || !urlValid) {
          setLinkSaveAttempts((current) =>
            current.includes(id) ? current : [...current, id]
          );
          return prev;
        }
      }
      setForm((current) => ({
        ...current,
        paymentMethods: [...current.paymentMethods, draft]
      }));
      setBankSaveAttempts((current) => current.filter((item) => item !== id));
      setCryptoSaveAttempts((current) => current.filter((item) => item !== id));
      setLinkSaveAttempts((current) => current.filter((item) => item !== id));
      return prev.filter((method) => method.id !== id);
    });
  }, []);

  const removeSavedMethod = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((method) => method.id !== id)
    }));
  }, []);

  const handleLogoUpload = useCallback(async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const id = crypto.randomUUID ? crypto.randomUUID() : `logo-${Date.now()}`;
      await addAsset({
        id,
        name: file.name,
        dataUrl,
        createdAt: new Date().toISOString()
      });
      setLogoPreview(dataUrl);
      setForm((prev) => ({ ...prev, logoId: id }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const payload: SettingsRecord = {
      businessName: form.businessName,
      businessEmail: form.businessEmail,
      businessAddress: form.businessAddress,
      phone: form.phone,
      defaultCurrency: form.defaultCurrency,
      refundPolicy: form.refundPolicy,
      paymentMethods: form.paymentMethods,
      logoId: form.logoId
    };
    await upsertSettings(payload);
    setSaving(false);
  }, [form]);

  const methodsByType = useMemo(() => {
    return {
      bank: form.paymentMethods.filter((method) => method.type === 'bank'),
      crypto: form.paymentMethods.filter((method) => method.type === 'crypto'),
      link: form.paymentMethods.filter((method) => method.type === 'link')
    };
  }, [form.paymentMethods]);

  const draftByType = useMemo(() => {
    return {
      bank: draftMethods.filter((method) => method.type === 'bank'),
      crypto: draftMethods.filter((method) => method.type === 'crypto'),
      link: draftMethods.filter((method) => method.type === 'link')
    };
  }, [draftMethods]);

  return (
    <div className="space-y-4">
      <section className="card space-y-4 rounded-[24px] p-6 shadow-none">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink">Logo upload</h3>
          <p className="text-sm text-slate-500">Upload a logo to appear on generated invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400">
            {logoPreview ? (
              <img
                alt="Logo preview"
                className="h-full w-full rounded-2xl object-cover"
                src={logoPreview}
              />
            ) : (
              <span className="icon material-symbols-rounded text-[20px]">image</span>
            )}
          </div>
          <label className="inline-flex items-center gap-2 rounded-full bg-[rgba(15,76,172,0.08)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-blue)]">
            Upload logo
            <TextInput
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleLogoUpload(event.target.files?.[0])}
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 rounded-[24px] p-6 shadow-none">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink">Business information</h3>
          <p className="text-sm text-slate-500">Update the details that appear on invoices.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-sm text-slate-500">
            <FieldLabel>Name</FieldLabel>
            <TextInput
              value={form.businessName}
              onChange={(event) => updateField('businessName', event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-500">
            <FieldLabel>Email</FieldLabel>
            <TextInput
              value={form.businessEmail}
              onChange={(event) => updateField('businessEmail', event.target.value)}
              type="email"
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-500">
            <FieldLabel>Phone</FieldLabel>
            <TextInput
              value={form.phone}
              onChange={(event) => updateField('phone', sanitizePhoneInput(event.target.value))}
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-500 md:col-span-2">
            <FieldLabel>Address</FieldLabel>
            <TextInput
              value={form.businessAddress}
              onChange={(event) => updateField('businessAddress', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="card space-y-4 rounded-[24px] p-6 shadow-none">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink">Currency</h3>
          <p className="text-sm text-slate-500">Set the default currency for new invoices.</p>
        </div>
        <div className="relative">
          <SelectInput
            value={form.defaultCurrency}
            onChange={(event) => updateField('defaultCurrency', event.target.value)}
            className="pr-16"
          >
            <option value="NGN">₦ Naira (NGN)</option>
            <option value="USD">$ Dollar (USD)</option>
            <option value="GBP">£ Pounds (GBP)</option>
            <option value="JPY">¥ Yen (JPY)</option>
          </SelectInput>
          <span className="pointer-events-none absolute right-5 top-[52%] -translate-y-1/2 text-slate-400">
            <span className="icon material-symbols-rounded text-[22px]">expand_more</span>
          </span>
        </div>
      </section>

      <section className="card space-y-5 rounded-[24px] p-6 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">Payment methods</h3>
            <p className="text-sm text-slate-500">Add bank, crypto, or payment link options.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addPaymentMethod('bank')}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              + Bank transfer
            </button>
            <button
              type="button"
              onClick={() => addPaymentMethod('crypto')}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              + Crypto
            </button>
            <button
              type="button"
              onClick={() => addPaymentMethod('link')}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              + Payment link
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {methodsByType.bank.length > 0 && (
            <div className="space-y-2">
              {methodsByType.bank.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink">{method.bankName}</span>
                    <span className="text-xs text-slate-500">
                      {method.accountName} · {method.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSavedMethod(method.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 hover:text-red-600"
                    aria-label="Delete payment method"
                  >
                    <span className="icon material-symbols-rounded text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {draftByType.bank.map((method) => {
            const attempted = bankSaveAttempts.includes(method.id);
            const bankNameEmpty = !method.bankName?.trim();
            const accountNumber = method.accountNumber ?? '';
            const accountNumberIncomplete = accountNumber.length > 0 && accountNumber.length < 10;
            const accountNumberInvalid = attempted ? accountNumber.length !== 10 : accountNumberIncomplete;
            const bankNameInvalid = attempted ? bankNameEmpty : false;
            const canSave = !bankNameEmpty && accountNumber.length === 10;

            return (
              <div key={method.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                  Bank transfer
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveDraftMethod(method.id)}
                      disabled={!canSave}
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        canSave ? 'text-slate-400 hover:text-slate-600' : 'text-slate-300'
                      }`}
                      aria-label="Save payment method"
                    >
                      <span className="icon material-symbols-rounded text-[18px]">save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDraftMethod(method.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
                      aria-label="Remove payment method"
                    >
                      <span className="icon material-symbols-rounded text-[18px]">remove</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <TextInput
                    value={method.bankName}
                    onChange={(event) =>
                      updateDraftMethod(method.id, {
                        bankName: event.target.value.replace(/\d+/g, '')
                      })
                    }
                    placeholder="Bank name"
                    className={
                      bankNameInvalid
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[var(--brand-blue)]'
                    }
                  />
                  <TextInput
                    value={method.accountName}
                    onChange={(event) =>
                      updateDraftMethod(method.id, { accountName: event.target.value })
                    }
                    placeholder="Account name"
                  />
                  <TextInput
                    value={method.accountNumber}
                    onChange={(event) =>
                      updateDraftMethod(method.id, {
                        accountNumber: event.target.value.replace(/\D+/g, '').slice(0, 10)
                      })
                    }
                    placeholder="Account number"
                    inputMode="numeric"
                    pattern="\\d*"
                    className={
                      accountNumberInvalid
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[var(--brand-blue)]'
                    }
                  />
                </div>
                <div className="mt-2 space-y-1 text-xs text-red-500">
                  {bankNameInvalid && <p>Bank name is required and cannot contain numbers.</p>}
                  {accountNumberInvalid && <p>Account number must be exactly 10 digits.</p>}
                </div>
              </div>
            );
          })}

          {methodsByType.crypto.length > 0 && (
            <div className="space-y-2">
              {methodsByType.crypto.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink">{method.label || 'Crypto'}</span>
                    <span className="text-xs text-slate-500">
                      {method.network} · {method.walletAddress}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSavedMethod(method.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 hover:text-red-600"
                    aria-label="Delete payment method"
                  >
                    <span className="icon material-symbols-rounded text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {draftByType.crypto.map((method) => {
            const attempted = cryptoSaveAttempts.includes(method.id);
            const labelEmpty = !method.label?.trim();
            const networkEmpty = !method.network?.trim();
            const walletEmpty = !method.walletAddress?.trim();
            const labelInvalid = attempted ? labelEmpty : false;
            const networkInvalid = attempted ? networkEmpty : false;
            const walletInvalid = attempted ? walletEmpty : false;
            const canSave = !labelEmpty && !networkEmpty && !walletEmpty;

            return (
              <div key={method.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                  Crypto
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveDraftMethod(method.id)}
                      disabled={!canSave}
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        canSave ? 'text-slate-400 hover:text-slate-600' : 'text-slate-300'
                      }`}
                      aria-label="Save payment method"
                    >
                      <span className="icon material-symbols-rounded text-[18px]">save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDraftMethod(method.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
                      aria-label="Remove payment method"
                    >
                      <span className="icon material-symbols-rounded text-[18px]">remove</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <TextInput
                    value={method.label}
                    onChange={(event) =>
                      updateDraftMethod(method.id, { label: event.target.value })
                    }
                    placeholder="Label"
                    className={
                      labelInvalid
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[var(--brand-blue)]'
                    }
                  />
                  <TextInput
                    value={method.network}
                    onChange={(event) =>
                      updateDraftMethod(method.id, { network: event.target.value })
                    }
                    placeholder="Network"
                    className={
                      networkInvalid
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[var(--brand-blue)]'
                    }
                  />
                  <TextInput
                    value={method.walletAddress}
                    onChange={(event) =>
                      updateDraftMethod(method.id, { walletAddress: event.target.value })
                    }
                    placeholder="Wallet address"
                    className={`md:col-span-2 ${
                      walletInvalid
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[var(--brand-blue)]'
                    }`}
                  />
                </div>
                <div className="mt-2 space-y-1 text-xs text-red-500">
                  {labelInvalid && <p>Label is required.</p>}
                  {networkInvalid && <p>Network is required.</p>}
                  {walletInvalid && <p>Wallet address is required.</p>}
                </div>
              </div>
            );
          })}

          {methodsByType.link.length > 0 && (
            <div className="space-y-2">
              {methodsByType.link.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink">{method.label || 'Payment link'}</span>
                    <span className="text-xs text-slate-500">{method.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSavedMethod(method.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-red-500 hover:text-red-600"
                    aria-label="Delete payment method"
                  >
                    <span className="icon material-symbols-rounded text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {draftByType.link.map((method) => {
            const attempted = linkSaveAttempts.includes(method.id);
            const labelEmpty = !method.label?.trim();
            const urlEmpty = !method.url?.trim();
            const labelInvalid = attempted ? labelEmpty : false;
            const urlInvalid = attempted ? urlEmpty : false;
            const canSave = !labelEmpty && !urlEmpty;

            return (
              <div key={method.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                  Payment link
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveDraftMethod(method.id)}
                      disabled={!canSave}
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        canSave ? 'text-slate-400 hover:text-slate-600' : 'text-slate-300'
                      }`}
                      aria-label="Save payment method"
                    >
                      <span className="icon material-symbols-rounded text-[18px]">save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDraftMethod(method.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
                      aria-label="Remove payment method"
                    >
                      <span className="icon material-symbols-rounded text-[18px]">remove</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <TextInput
                    value={method.label}
                    onChange={(event) =>
                      updateDraftMethod(method.id, { label: event.target.value })
                    }
                    placeholder="Label"
                    className={
                      labelInvalid
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[var(--brand-blue)]'
                    }
                  />
                  <TextInput
                    value={method.url}
                    onChange={(event) => updateDraftMethod(method.id, { url: event.target.value })}
                    placeholder="Payment URL"
                    className={
                      urlInvalid
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-slate-200 focus:ring-[var(--brand-blue)]'
                    }
                  />
                </div>
                <div className="mt-2 space-y-1 text-xs text-red-500">
                  {labelInvalid && <p>Label is required.</p>}
                  {urlInvalid && <p>Payment URL is required.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card space-y-4 rounded-[24px] p-6 shadow-none">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-ink">Refund policy</h3>
          <p className="text-sm text-slate-500">
            Provide a short policy. AI will expand this for invoices.
          </p>
        </div>
        <TextareaInput
          rows={4}
          value={form.refundPolicy}
          onChange={(event) => updateField('refundPolicy', event.target.value)}
        />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow-none md:hover:bg-[var(--brand-blue-dark)]"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};
