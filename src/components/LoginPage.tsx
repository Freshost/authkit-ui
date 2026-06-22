import { useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { LoginForm, LoginPage as PFLoginPage } from '@freshost/ui';
import { ExclamationCircleIcon } from '@freshost/ui/icons';

import { isTwoFactorRequired, type UserResponse } from '../api/types';
import { useLogin } from '../hooks/useAuth';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { codeFrom } from '../utils';
import { TwoFactorChallenge } from './twofactor/TwoFactorChallenge';

export interface LoginPageProps {
  /**
   * Called after a fully successful login (including any 2FA challenge). Defaults
   * to navigating to the provider's `home` route.
   */
  onSuccess?: (user: UserResponse) => void;
  /** Prefill the email field (e.g. an SSO hint or a remembered address). */
  initialEmail?: string;
  /**
   * Prefill the password field. Intended for local demos / dev only — never
   * ship a real app with a hardcoded password.
   */
  initialPassword?: string;
  /** Footer list items (links) passed through to the PatternFly login page. */
  footer?: ReactNode;
  /** "Sign up" band content. */
  signUp?: ReactNode;
  /** "Forgot credentials" content. */
  forgotCredentials?: ReactNode;
}

/**
 * Drop-in login page built on the PatternFly LoginPage/LoginForm. Handles the
 * two-step 2FA login internally: a password login that returns
 * `{ two_factor: true }` swaps the form for the {@link TwoFactorChallenge}.
 * Branding (logo, titles, background) comes from <AuthkitProvider>.
 */
export function LoginPage({
  onSuccess,
  footer,
  signUp,
  forgotCredentials,
  initialEmail,
  initialPassword,
}: LoginPageProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const { branding, routes } = useAuthkit();
  const navigate = useNavigate();
  const login = useLogin();

  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState(initialPassword ?? '');
  const [remember, setRemember] = useState(false);
  const [pending2fa, setPending2fa] = useState(false);

  const handleSuccess = (user: UserResponse) => {
    if (onSuccess) {
      onSuccess(user);
    } else {
      navigate(routes.home, { replace: true });
    }
  };

  const submitPassword = (event: MouseEvent<HTMLButtonElement> | FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate(
      { email, password, remember },
      {
        onSuccess: (result) => {
          if (isTwoFactorRequired(result)) {
            setPending2fa(true);
          } else {
            handleSuccess(result);
          }
        },
      },
    );
  };

  const errorCode = login.isError ? codeFrom(login.error) : '';
  const errorText = login.isError
    ? errorCode === 'rate_limited'
      ? t('login.rateLimited')
      : errorCode === 'account_disabled'
        ? t('login.accountDisabled')
        : t('login.error')
    : '';

  return (
    <PFLoginPage
      brandImgSrc={branding.logo}
      brandImgAlt={branding.logoAlt ?? branding.appName ?? ''}
      backgroundImgSrc={branding.backgroundImage}
      loginTitle={pending2fa ? t('twoFactor.challengeTitle') : branding.appName ?? t('login.title')}
      loginSubtitle={
        pending2fa ? t('twoFactor.challengeSubtitle') : branding.subtitle ?? t('login.subtitle')
      }
      footerListItems={footer}
      signUpForAccountMessage={pending2fa ? undefined : signUp}
      forgotCredentials={pending2fa ? undefined : forgotCredentials}
    >
      {pending2fa ? (
        <TwoFactorChallenge onSuccess={handleSuccess} />
      ) : (
        <LoginForm
          usernameLabel={t('login.emailLabel')}
          passwordLabel={t('login.passwordLabel')}
          loginButtonLabel={login.isPending ? t('login.submitting') : t('login.submit')}
          usernameValue={email}
          onChangeUsername={(_event, v) => setEmail(v)}
          passwordValue={password}
          onChangePassword={(_event, v) => setPassword(v)}
          onLoginButtonClick={submitPassword}
          rememberMeLabel={t('login.rememberMe')}
          isRememberMeChecked={remember}
          onChangeRememberMe={(_event, checked) => setRemember(checked)}
          showHelperText={login.isError}
          helperText={errorText}
          helperTextIcon={<ExclamationCircleIcon />}
          isValidUsername={!login.isError}
          isValidPassword={!login.isError}
        />
      )}
    </PFLoginPage>
  );
}
