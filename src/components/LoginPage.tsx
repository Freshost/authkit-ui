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
export function LoginPage({ onSuccess, footer, signUp, forgotCredentials }: LoginPageProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const { branding, routes } = useAuthkit();
  const navigate = useNavigate();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      { email, password },
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

  const errorText = login.isError
    ? codeFrom(login.error) === 'rate_limited'
      ? t('login.rateLimited')
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
