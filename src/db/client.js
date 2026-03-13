import Dexie from 'dexie';
export class InvoiceDB extends Dexie {
    invoices;
    settings;
    paymentMethods;
    assets;
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
