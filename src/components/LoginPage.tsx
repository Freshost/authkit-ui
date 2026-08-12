import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  LoginPage as PFLoginPage,
  Switch,
  TextInput,
} from '@freshost/ui';
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@freshost/ui/icons';

import { isTwoFactorRequired, type UserResponse } from '../api/types';
import { useLogin } from '../hooks/useAuth';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { loginErrorKey } from '../utils';
import { TwoFactorChallenge } from './twofactor/TwoFactorChallenge';

/**
 * True only in a dev build under a Vite-like bundler. The package may be
 * consumed outside Vite (so `import.meta.env` can be undefined) — in that case
 * we treat it as NOT dev and never prefill the password. Accessed via `as any`
 * because the library tsconfig has no `import.meta.env` typings.
 */
const IS_DEV = (import.meta as any).env?.DEV === true;

let warnedInsecurePassword = false;

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
 * Drop-in login page built on the PatternFly LoginPage. The credential form is
 * composed from PatternFly form primitives (rather than the stock `LoginForm`)
 * so remember-me is a nicer `Switch` and the password field has a show/hide
 * toggle. Handles the two-step 2FA login internally: a password login that
 * returns `{ two_factor: true }` swaps the form for the {@link TwoFactorChallenge}.
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

  // `initialPassword` is a dev-only convenience: ignore it outside a dev build
  // so a hardcoded credential can never prefill in production. Warn once in dev.
  if (IS_DEV && initialPassword && !warnedInsecurePassword) {
    warnedInsecurePassword = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[authkit-ui] LoginPage `initialPassword` is set. This is for local demos / dev only and must never be used in production.',
    );
  }

  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState(IS_DEV ? initialPassword ?? '' : '');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pending2fa, setPending2fa] = useState(false);

  const handleSuccess = (user: UserResponse) => {
    if (onSuccess) {
      onSuccess(user);
    } else {
      navigate(routes.home, { replace: true });
    }
  };

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
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

  const errorText = login.isError ? t(loginErrorKey(login.error)) : '';

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
        <Form onSubmit={submitPassword}>
          {login.isError && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="error" icon={<ExclamationCircleIcon />}>
                  {errorText}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}

          <FormGroup label={t('login.emailLabel')} isRequired fieldId="authkit-login-username">
            <TextInput
              id="authkit-login-username"
              name="username"
              type="email"
              autoComplete="username"
              autoFocus
              isRequired
              value={email}
              validated={login.isError ? 'error' : 'default'}
              onChange={(_event, v) => setEmail(v)}
            />
          </FormGroup>

          <FormGroup label={t('login.passwordLabel')} isRequired fieldId="authkit-login-password">
            <InputGroup>
              <InputGroupItem isFill>
                <TextInput
                  id="authkit-login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  isRequired
                  value={password}
                  validated={login.isError ? 'error' : 'default'}
                  onChange={(_event, v) => setPassword(v)}
                />
              </InputGroupItem>
              <InputGroupItem>
                <Button
                  variant="control"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  onClick={() => setShowPassword((s) => !s)}
                  icon={showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                />
              </InputGroupItem>
            </InputGroup>
          </FormGroup>

          <FormGroup fieldId="authkit-login-remember">
            <Switch
              id="authkit-login-remember"
              label={t('login.rememberMe')}
              isChecked={remember}
              onChange={(_event, checked) => setRemember(checked)}
            />
          </FormGroup>

          <ActionGroup>
            <Button variant="primary" type="submit" isBlock isDisabled={login.isPending}>
              {login.isPending ? t('login.submitting') : t('login.submit')}
            </Button>
          </ActionGroup>
        </Form>
      )}
    </PFLoginPage>
  );
}
