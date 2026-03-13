import { InvoiceRecord } from '../types/invoice';
export declare const addInvoice: (invoice: InvoiceRecord) => Promise<string>;
export declare const updateInvoice: (id: string, changes: Partial<InvoiceRecord>) => Promise<number>;
export declare const deleteInvoice: (id: string) => Promise<void>;
export declare const getInvoice: (id: string) => Promise<InvoiceRecord | undefined>;
export declare const listInvoices: () => Promise<InvoiceRecord[]>;
