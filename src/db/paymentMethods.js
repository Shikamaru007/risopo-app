import { db } from './client';
export const addPaymentMethod = async (method) => db.paymentMethods.add(method);
export const updatePaymentMethod = async (id, changes) => db.paymentMethods.update(id, changes);
export const deletePaymentMethod = async (id) => db.paymentMethods.delete(id);
export const listPaymentMethods = async () => db.paymentMethods.toArray();
