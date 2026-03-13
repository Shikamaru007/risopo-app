import { SettingsRecord } from '../types/settings';
export declare const getSettings: () => Promise<SettingsRecord | undefined>;
export declare const upsertSettings: (settings: SettingsRecord) => Promise<number>;
