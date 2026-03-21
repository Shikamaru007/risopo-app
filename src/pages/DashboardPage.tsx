import React, { useEffect, useMemo, useState } from 'react';
import { liveQuery } from 'dexie';
import { useNavigate } from 'react-router-dom';
import { Fab } from '../components/Fab';
import { StatsCard } from '../components/StatsCard';
import { InvoiceCard } from '../components/InvoiceCard';
import { EmptyState } from '../components/EmptyState';
import { deleteInvoice, listInvoices } from '../db/invoices';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';
import { buildPdf } from '../lib/pdf';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { prepareDuplicateDraft } from '../utils/duplicateFlow';

const getGreeting = (now: Date) => {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const DashboardPage: React.FC = () => {
  const ready = useDexieReady();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const subscription = liveQuery(() => listInvoices()).subscribe({
      next: (data) => {
        setInvoices(data);
      }
    });
    return () => subscription.unsubscribe();
  }, [ready]);

  const now = useMemo(() => new Date(), []);
  const greeting = useMemo(() => getGreeting(now), [now]);

  const summary = useMemo(() => {
    const totalInvoices = invoices.length;
    const paidCount = invoices.filter((invoice) => invoice.status === 'paid').length;
    const pendingCount = totalInvoices - paidCount;
    const currency = invoices[0]?.currency || 'NGN';
    return { totalInvoices, paidCount, pendingCount, currency };
  }, [invoices, now]);

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
    <div className="space-y-4 md:space-y-6">
      <section className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Home
        </div>
        <h2 className="text-2xl font-semibold text-ink md:text-3xl">{greeting}</h2>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StatsCard title="Total invoices" value={summary.totalInvoices} />
        <StatsCard title="Pending" value={summary.pendingCount} />
        <StatsCard title="Paid" value={summary.paidCount} />
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-ink">Recent invoices</h3>
        </div>
        {invoices.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No invoices yet"
            description="Your recent invoices will appear here once you create one."
          />
        ) : (
          <div className="mt-4 space-y-3">
            {invoices.slice(0, 3).map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onView={() => handleView(invoice)}
                onDuplicate={() => handleDuplicate(invoice)}
                onDownload={() => handleDownload(invoice)}
                onDelete={() => handleDelete(invoice)}
              />
            ))}
          </div>
        )}
      </section>

      <Fab to="/builder" />

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
