export type PaymentMethodType = 'bank' | 'crypto' | 'link';
export interface ClientInfo {
    name: string;
    email?: string;
    address?: string;
}
export interface InvoiceItem {
    id: string;
    invoiceId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
}
export interface InvoiceRecord {
    id: string;
    invoiceNumber: string;
    issueDate?: string;
    dueDate?: string;
    currency: string;
    client: ClientInfo;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethodType;
    paymentDetails?: string;
    refundPolicy?: string;
    notes?: string;
    logoId?: string;
    createdAt: string;
}
export interface AssetRecord {
    id: string;
    name: string;
    dataUrl: string;
    createdAt: string;
}
