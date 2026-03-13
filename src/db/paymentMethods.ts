import { db } from './client';
import { PaymentMethod } from '../types/settings';

export const addPaymentMethod = async (method: PaymentMethod) => db.paymentMethods.add(method);
export const updatePaymentMethod = async (id: string, changes: Partial<PaymentMethod>) =>
  db.paymentMethods.update(id, changes);
export const deletePaymentMethod = async (id: string) => db.paymentMethods.delete(id);
export const listPaymentMethods = async () => db.paymentMethods.toArray();
