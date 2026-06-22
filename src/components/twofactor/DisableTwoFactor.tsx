import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionGroup, Alert, Button, Content, Form, FormGroup, TextInput } from '@freshost/ui';

import { useDisableTwoFactor } from '../../hooks/useTwoFactor';
import { AUTHKIT_NS } from '../../i18n';
import { messageFrom } from '../../utils';

export interface DisableTwoFactorProps {
  /** Called after 2FA is successfully disabled. */
  onDisabled?: () => void;
  /** When provided, renders a Cancel button calling this. */
  onCancel?: () => void;
}

/** Password re-auth form that disables 2FA (a stolen session alone can't remove it). */
export function DisableTwoFactor({ onDisabled, onCancel }: DisableTwoFactorProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const disable = useDisableTwoFactor();
  const [password, setPassword] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    disable.mutate(
      { password },
      {
        onSuccess: () => {
          setPassword('');
          onDisabled?.();
        },
      },
    );
  };

  return (
    <Form onSubmit={submit}>
      <Content component="p">{t('twoFactor.disableIntro')}</Content>
      {disable.isError ? (
        <Alert variant="danger" isInline title={messageFrom(disable.error, t('twoFactor.error'))} />
      ) : null}
      <FormGroup label={t('twoFactor.disablePasswordLabel')} isRequired fieldId="authkit-2fa-disable-pw">
        <TextInput
          id="authkit-2fa-disable-pw"
          type="password"
          value={password}
          onChange={(_event, v) => setPassword(v)}
          isRequired
          autoComplete="current-password"
        />
      </FormGroup>
      <ActionGroup>
        <Button
          type="submit"
          variant="danger"
          isLoading={disable.isPending}
          isDisabled={disable.isPending || password.length === 0}
        >
          {t('twoFactor.disable')}
        </Button>
        {onCancel ? (
          <Button variant="link" onClick={onCancel} isDisabled={disable.isPending}>
            {t('common.cancel')}
          </Button>
        ) : null}
      </ActionGroup>
    </Form>
  );
}
