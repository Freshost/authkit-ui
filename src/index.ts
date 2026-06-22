// Public API of @freshost/authkit-ui.

// Provider + context
export { AuthkitProvider, useAuthkit } from './provider';
export type {
  AuthkitProviderProps,
  AuthkitBranding,
  AuthkitRoutes,
  AuthkitContextValue,
} from './provider';

// API client
export { createAuthkitClient, AuthkitError } from './api/client';
export type { AuthkitClient, CreateAuthkitClientOptions } from './api/client';

// Notification adapter
export { noopNotify } from './notify';
export type { NotifyAdapter } from './notify';

// Contract types
export * from './api/types';

// i18n
export { registerAuthkitI18n, AUTHKIT_NS, en as authkitEnTranslations } from './i18n';
export type { AuthkitTranslations } from './i18n';
