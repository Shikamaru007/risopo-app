import { SettingsRecord } from '../types/settings';

type SettingsCache = {
  data: SettingsRecord;
  savedAt?: string;
};

type LogoCache = {
  id: string;
  dataUrl: string;
};

const SETTINGS_CACHE_KEY = 'settingsCache-v2';
const SETTINGS_LOGO_CACHE_KEY = 'settingsLogo-v1';

export const readSettingsCache = () => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = window.localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as SettingsCache;
    if (!parsed?.data) return null;
    const savedAt = parsed.savedAt ? new Date(parsed.savedAt) : null;
    return { data: parsed.data, savedAt };
  } catch {
    return null;
  }
};

export const writeSettingsCache = (data: SettingsRecord, savedAt: Date) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SETTINGS_CACHE_KEY,
      JSON.stringify({ data, savedAt: savedAt.toISOString() })
    );
  } catch {
    // ignore cache failures
  }
};

export const clearSettingsCache = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SETTINGS_CACHE_KEY);
  } catch {
    // ignore cache failures
  }
};

export const readLogoCache = (id?: string | null) => {
  if (typeof window === 'undefined' || !id) return null;
  try {
    const cached = window.localStorage.getItem(SETTINGS_LOGO_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as LogoCache;
    if (!parsed?.id || !parsed?.dataUrl) return null;
    return parsed.id === id ? parsed.dataUrl : null;
  } catch {
    return null;
  }
};

export const writeLogoCache = (id: string, dataUrl: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SETTINGS_LOGO_CACHE_KEY,
      JSON.stringify({ id, dataUrl })
    );
  } catch {
    // ignore cache failures
  }
};

export const clearLogoCache = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SETTINGS_LOGO_CACHE_KEY);
  } catch {
    // ignore cache failures
  }
};
