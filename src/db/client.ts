import Dexie, { Table } from 'dexie';
import { AssetRecord, InvoiceRecord } from '../types/invoice';
import { PaymentMethod, SettingsRecord } from '../types/settings';

export class InvoiceDB extends Dexie {
  invoices!: Table<InvoiceRecord, string>;
  settings!: Table<SettingsRecord, number>;
  paymentMethods!: Table<PaymentMethod, string>;
  assets!: Table<AssetRecord, string>;

  constructor() {
    super('invoice-pwa');
    this.version(1).stores({
      invoices: 'id, invoiceNumber, client.name, createdAt',
      settings: '++id, businessName, defaultCurrency',
      paymentMethods: 'id, type, label',
      assets: 'id, name, createdAt'
    });
  }
}

export const db = new InvoiceDB();
