import type { i18n as I18nInstance } from 'i18next';

import { en } from './en';

/** i18n namespace all package strings live under. */
export const AUTHKIT_NS = 'authkit';

/**
 * Registers the package's English bundle under the `authkit` namespace, unless
 * the app already provided one. Called by <AuthkitProvider>; idempotent.
 * Apps localize by adding their own `authkit` bundle before/after mount.
 */
export function registerAuthkitI18n(i18n: I18nInstance): void {
  if (!i18n.hasResourceBundle('en', AUTHKIT_NS)) {
    // deep merge, do NOT overwrite existing keys → app translations win.
    i18n.addResourceBundle('en', AUTHKIT_NS, en, true, false);
  }
}

export { en };
export type { AuthkitTranslations } from './en';
