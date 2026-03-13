import Dexie, { Table } from 'dexie';
import { AssetRecord, InvoiceRecord } from '../types/invoice';
import { PaymentMethod, SettingsRecord } from '../types/settings';
export declare class InvoiceDB extends Dexie {
    invoices: Table<InvoiceRecord, string>;
    settings: Table<SettingsRecord, number>;
    paymentMethods: Table<PaymentMethod, string>;
    assets: Table<AssetRecord, string>;
    constructor();
}
export declare const db: InvoiceDB;
