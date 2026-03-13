import { db } from './client';
import { SettingsRecord } from '../types/settings';

const SETTINGS_ID = 1;

export const getSettings = async () => db.settings.get(SETTINGS_ID);

export const upsertSettings = async (settings: SettingsRecord) => {
  return db.settings.put({ ...settings, id: SETTINGS_ID });
};
