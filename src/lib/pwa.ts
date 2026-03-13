import { registerSW } from 'virtual:pwa-register';

export const enablePwa = () => {
  registerSW({ immediate: true });
};
