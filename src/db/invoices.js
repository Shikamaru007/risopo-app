import { db } from './client';
export const addInvoice = async (invoice) => db.invoices.add(invoice);
export const updateInvoice = async (id, changes) => db.invoices.update(id, changes);
export const deleteInvoice = async (id) => db.invoices.delete(id);
export const getInvoice = async (id) => db.invoices.get(id);
export const listInvoices = async () => db.invoices.orderBy('createdAt').reverse().toArray();
