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

// Hooks
export {
  authkitKeys,
  useMe,
  useLogin,
  useTwoFactorChallenge,
  useLogout,
  useChangePassword,
} from './hooks/useAuth';

// Components
export { AuthGuard, type AuthGuardProps } from './components/AuthGuard';
export { LoginPage, type LoginPageProps } from './components/LoginPage';
export { AccountPage, type AccountPageProps } from './components/AccountPage';
export {
  ChangePasswordForm,
  type ChangePasswordFormProps,
} from './components/ChangePasswordForm';
export {
  ChangePasswordModal,
  type ChangePasswordModalProps,
} from './components/ChangePasswordModal';
export {
  TwoFactorChallenge,
  type TwoFactorChallengeProps,
} from './components/twofactor/TwoFactorChallenge';

// Utilities
export { messageFrom, codeFrom } from './utils';

// i18n
export { registerAuthkitI18n, AUTHKIT_NS, en as authkitEnTranslations } from './i18n';
export type { AuthkitTranslations } from './i18n';
