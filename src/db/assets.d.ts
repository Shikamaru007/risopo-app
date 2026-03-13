import { AssetRecord } from '../types/invoice';
export declare const addAsset: (asset: AssetRecord) => Promise<string>;
export declare const getAsset: (id: string) => Promise<AssetRecord | undefined>;
export declare const deleteAsset: (id: string) => Promise<void>;
export declare const listAssets: () => Promise<AssetRecord[]>;
