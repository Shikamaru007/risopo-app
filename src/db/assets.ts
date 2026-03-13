import { db } from './client';
import { AssetRecord } from '../types/invoice';

export const addAsset = async (asset: AssetRecord) => db.assets.add(asset);
export const getAsset = async (id: string) => db.assets.get(id);
export const deleteAsset = async (id: string) => db.assets.delete(id);
export const listAssets = async () => db.assets.toArray();
