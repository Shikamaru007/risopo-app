import { PaymentMethod } from '../types/settings';
export declare const addPaymentMethod: (method: PaymentMethod) => Promise<string>;
export declare const updatePaymentMethod: (id: string, changes: Partial<PaymentMethod>) => Promise<number>;
export declare const deletePaymentMethod: (id: string) => Promise<void>;
export declare const listPaymentMethods: () => Promise<PaymentMethod[]>;
