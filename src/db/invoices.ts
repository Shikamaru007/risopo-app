import { db } from './client';
import { InvoiceRecord } from '../types/invoice';

export const addInvoice = async (invoice: InvoiceRecord) => db.invoices.add(invoice);
export const updateInvoice = async (id: string, changes: Partial<InvoiceRecord>) =>
  db.invoices.update(id, changes);
export const deleteInvoice = async (id: string) => db.invoices.delete(id);
export const getInvoice = async (id: string) => db.invoices.get(id);
export const listInvoices = async () => db.invoices.orderBy('createdAt').reverse().toArray();
export const clearInvoices = async () => db.invoices.clear();
