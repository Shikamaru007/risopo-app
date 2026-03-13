import { db } from './client';
const SETTINGS_ID = 1;
export const getSettings = async () => db.settings.get(SETTINGS_ID);
export const upsertSettings = async (settings) => {
    return db.settings.put({ ...settings, id: SETTINGS_ID });
};
