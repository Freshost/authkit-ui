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
  useUpdateProfile,
  useChangePassword,
} from './hooks/useAuth';

export {
  useEnableTwoFactor,
  useConfirmTwoFactor,
  useDisableTwoFactor,
  useRecoveryCodesStatus,
  useRegenerateRecoveryCodes,
} from './hooks/useTwoFactor';
export {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useSetUserPassword,
} from './hooks/useUsers';
export { useAuthkitConfig } from './hooks/useConfig';
export { useAPITokens, useCreateAPIToken, useRevokeAPIToken, useRevokeAllAPITokens } from './hooks/useAPITokens';
export {
  useLoginHistory,
  useSessions,
  useTerminateSession,
  useTerminateOtherSessions,
} from './hooks/useSessions';
export {
  useImpersonate,
  useStopImpersonating,
  type StopImpersonatingOptions,
} from './hooks/useImpersonation';

// Components
export { AuthGuard, type AuthGuardProps } from './components/AuthGuard';
export { LoginPage, type LoginPageProps } from './components/LoginPage';
export { AccountPage, type AccountPageProps } from './components/AccountPage';
export { ProfileForm, type ProfileFormProps } from './components/ProfileForm';
export { LoginHistoryCard } from './components/LoginHistoryCard';
export { SessionsCard } from './components/SessionsCard';
export { APITokensCard } from './components/APITokensCard';
export {
  ImpersonationBanner,
  type ImpersonationBannerProps,
} from './components/ImpersonationBanner';
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
export {
  TwoFactorSetup,
  type TwoFactorSetupProps,
} from './components/twofactor/TwoFactorSetup';
export { TwoFactorSettings } from './components/twofactor/TwoFactorSettings';
export {
  DisableTwoFactor,
  type DisableTwoFactorProps,
} from './components/twofactor/DisableTwoFactor';
export { RecoveryCodes, type RecoveryCodesProps } from './components/twofactor/RecoveryCodes';
export { UsersPage, type UsersPageProps } from './components/users/UsersPage';
export {
  ImpersonateUserModal,
  type ImpersonateUserModalProps,
} from './components/users/ImpersonateUserModal';
export { UserFormModal, type UserFormModalProps } from './components/users/UserFormModal';
export {
  SetUserPasswordModal,
  type SetUserPasswordModalProps,
} from './components/users/SetUserPasswordModal';
export { DeleteUserModal, type DeleteUserModalProps } from './components/users/DeleteUserModal';

// Utilities
export { messageFrom, codeFrom } from './utils';

// i18n
export { registerAuthkitI18n, AUTHKIT_NS, en as authkitEnTranslations } from './i18n';
export type { AuthkitTranslations } from './i18n';
