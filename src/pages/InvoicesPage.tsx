import React, { useEffect, useMemo, useState } from 'react';
import { liveQuery } from 'dexie';
import { Link, useNavigate } from 'react-router-dom';
import { deleteInvoice, listInvoices } from '../db/invoices';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';
import { InvoiceCard } from '../components/InvoiceCard';
import { EmptyState } from '../components/EmptyState';
import { TextInput } from '../components/FormFields';
import { buildPdf } from '../lib/pdf';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { prepareDuplicateDraft } from '../utils/duplicateFlow';

export const InvoicesPage: React.FC = () => {
  const ready = useDexieReady();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const subscription = liveQuery(() => listInvoices()).subscribe({
      next: (data) => {
        setInvoices(data);
        setLoading(false);
      },
      error: () => setLoading(false)
    });
    return () => subscription.unsubscribe();
  }, [ready]);

  const filteredInvoices = useMemo(() => {
    const sourceInvoices = invoices;
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? sourceInvoices.filter((invoice) => {
          const client = invoice.client?.name?.toLowerCase() ?? '';
          const number = invoice.invoiceNumber?.toLowerCase() ?? '';
          return client.includes(normalized) || number.includes(normalized);
        })
      : sourceInvoices;

    return filtered;
  }, [invoices, query]);

  const groupedInvoices = useMemo(() => {
    const today = new Date();
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const groups: { label: string; items: InvoiceRecord[] }[] = [];
    const todayItems: InvoiceRecord[] = [];
    const yesterdayItems: InvoiceRecord[] = [];
    const otherItems: InvoiceRecord[] = [];

    filteredInvoices.forEach((invoice) => {
      const created = new Date(invoice.createdAt);
      if (isSameDay(created, today)) {
        todayItems.push(invoice);
      } else if (isSameDay(created, yesterday)) {
        yesterdayItems.push(invoice);
      } else {
        otherItems.push(invoice);
      }
    });

    if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
    if (otherItems.length) groups.push({ label: 'Earlier', items: otherItems });

    return groups;
  }, [filteredInvoices]);

  const handleView = (invoice: InvoiceRecord) => {
    navigate(`/invoices/${invoice.id}?mode=full`);
  };

  const handleDuplicate = async (invoice: InvoiceRecord) => {
    if (!ready) return;
    prepareDuplicateDraft(invoice);
    navigate(`/builder?step=items&duplicate=${invoice.id}`);
  };


  const handleDownload = async (invoice: InvoiceRecord) => {
    const doc = await buildPdf(invoice);
    const filename = `risopo-${invoice.invoiceNumber || invoice.id}.pdf`;
    doc.save(filename);
  };

  const handleDelete = (invoice: InvoiceRecord) => {
    setDeleteTarget(invoice);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search invoices"
        />
      </div>

      <section className="space-y-6">
        {filteredInvoices.length === 0 && (
          <EmptyState
            className="mt-4"
            title="No invoices yet"
            description="Your recent invoices will appear here once you create one."
          />
        )}

        {groupedInvoices.map((group) => (
            <div key={group.label} className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 font-['Google Sans Mono',monospace]">
              {group.label}
            </div>
            <div className="space-y-3">
              {group.items.map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}?mode=full`}
                  className="block"
                >
                  <InvoiceCard
                    invoice={invoice}
                    onView={() => handleView(invoice)}
                    onDuplicate={() => handleDuplicate(invoice)}
                    onDownload={() => handleDownload(invoice)}
                    onDelete={() => handleDelete(invoice)}
                  />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete invoice?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await deleteInvoice(deleteTarget.id);
          } finally {
            setDeleting(false);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
