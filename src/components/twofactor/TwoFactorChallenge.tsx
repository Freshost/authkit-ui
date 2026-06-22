import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionGroup, Alert, Button, Form, FormGroup, TextInput } from '@freshost/ui';

import type { UserResponse } from '../../api/types';
import { useTwoFactorChallenge } from '../../hooks/useAuth';
import { AUTHKIT_NS } from '../../i18n';

export interface TwoFactorChallengeProps {
  /** Called once the challenge succeeds and the session is established. */
  onSuccess: (user: UserResponse) => void;
}

/**
 * The second step of a two-step login: prompts for a TOTP code, with a toggle to
 * fall back to a single-use recovery code. Rendered by <LoginPage> after a
 * password login returns `{ two_factor: true }`.
 */
export function TwoFactorChallenge({ onSuccess }: TwoFactorChallengeProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const challenge = useTwoFactorChallenge();
  const [useRecovery, setUseRecovery] = useState(false);
  const [value, setValue] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = useRecovery ? { recoveryCode: value } : { code: value };
    challenge.mutate(body, { onSuccess });
  };

  return (
    <Form onSubmit={submit}>
      {challenge.isError ? (
        <Alert variant="danger" isInline title={t('twoFactor.invalidCode')} />
      ) : null}
      <FormGroup
        label={useRecovery ? t('twoFactor.recoveryCodeLabel') : t('twoFactor.codeLabel')}
        isRequired
        fieldId="authkit-2fa-code"
      >
        <TextInput
          id="authkit-2fa-code"
          value={value}
          onChange={(_event, v) => setValue(v)}
          isRequired
          autoComplete="one-time-code"
          autoFocus
        />
      </FormGroup>
      <ActionGroup>
        <Button
          type="submit"
          isBlock
          isLoading={challenge.isPending}
          isDisabled={challenge.isPending || value.length === 0}
        >
          {challenge.isPending ? t('twoFactor.verifying') : t('twoFactor.verify')}
        </Button>
        <Button
          variant="link"
          isInline
          onClick={() => {
            setUseRecovery((v) => !v);
            setValue('');
          }}
        >
          {useRecovery ? t('twoFactor.useAuthCode') : t('twoFactor.useRecoveryCode')}
        </Button>
      </ActionGroup>
    </Form>
  );
}
