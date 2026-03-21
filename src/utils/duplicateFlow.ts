import { InvoiceRecord } from '../types/invoice';

type DraftItem = {
  id: string;
  name: string;
  quantity: string;
  price: string;
};

export const prepareDuplicateDraft = (invoice: InvoiceRecord) => {
  if (typeof window === 'undefined') return;
  const rawPhone = invoice.client?.phone?.trim() || '';
  const addressCandidate = invoice.client?.address?.trim() || '';
  const digits = addressCandidate.replace(/\D/g, '');
  const phoneFromAddress =
    !rawPhone && digits.length >= 7 && digits.length <= 15 ? addressCandidate : '';
  const clientPhone = rawPhone || phoneFromAddress;
  const draftItems: DraftItem[] = [{ id: 'item-0', name: '', quantity: '', price: '' }];
  const draft = {
    currency: invoice.currency || 'NGN',
    paymentMethod: invoice.paymentMethod || 'bank',
    client: {
      name: invoice.client?.name ?? '',
      email: invoice.client?.email ?? '',
      address: invoice.client?.address ?? ''
    },
    clientPhone,
    notes: '',
    includeNotes: false,
    includeDiscount: false,
    discountAmount: '',
    items: draftItems
  };
  try {
    window.sessionStorage.setItem('invoiceBuilderDraft', JSON.stringify(draft));
    window.sessionStorage.removeItem('invoiceBuilderDraftItems');
  } catch {
    // ignore storage failures
  }
};
