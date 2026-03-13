import { db } from './client';
export const addAsset = async (asset) => db.assets.add(asset);
export const getAsset = async (id) => db.assets.get(id);
export const deleteAsset = async (id) => db.assets.delete(id);
export const listAssets = async () => db.assets.toArray();
