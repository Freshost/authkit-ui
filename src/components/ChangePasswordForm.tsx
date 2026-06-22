import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionGroup, Alert, Button, Form, FormGroup, TextInput } from '@freshost/ui';

import { useChangePassword } from '../hooks/useAuth';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { codeFrom, messageFrom } from '../utils';

export interface ChangePasswordFormProps {
  /** Called after the password is successfully changed. */
  onSuccess?: () => void;
  /** When provided, renders a Cancel button that calls this. */
  onCancel?: () => void;
  /** Override the submit button label. */
  submitLabel?: string;
}

/**
 * Current/new/confirm password form with client-side validation (length +
 * match) and localized server-error mapping. Used standalone by <AccountPage>
 * and inside <ChangePasswordModal>.
 */
export function ChangePasswordForm({ onSuccess, onCancel, submitLabel }: ChangePasswordFormProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const { minPasswordLength } = useAuthkit();
  const change = useChangePassword();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setClientError(null);
    if (next.length < minPasswordLength) {
      setClientError(t('account.tooShort', { min: minPasswordLength }));
      return;
    }
    if (next !== confirm) {
      setClientError(t('account.mismatch'));
      return;
    }
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setConfirm('');
          onSuccess?.();
        },
      },
    );
  };

  const serverError = change.isError
    ? codeFrom(change.error) === 'wrong_password'
      ? t('account.wrongPassword')
      : messageFrom(change.error, t('account.error'))
    : null;
  const error = clientError ?? serverError;

  return (
    <Form onSubmit={submit}>
      {error ? <Alert variant="danger" isInline title={error} /> : null}
      <FormGroup label={t('account.currentPasswordLabel')} isRequired fieldId="authkit-cp-current">
        <TextInput
          id="authkit-cp-current"
          type="password"
          value={current}
          onChange={(_event, v) => setCurrent(v)}
          isRequired
          autoComplete="current-password"
        />
      </FormGroup>
      <FormGroup label={t('account.newPasswordLabel')} isRequired fieldId="authkit-cp-new">
        <TextInput
          id="authkit-cp-new"
          type="password"
          value={next}
          onChange={(_event, v) => setNext(v)}
          isRequired
          autoComplete="new-password"
        />
      </FormGroup>
      <FormGroup label={t('account.confirmPasswordLabel')} isRequired fieldId="authkit-cp-confirm">
        <TextInput
          id="authkit-cp-confirm"
          type="password"
          value={confirm}
          onChange={(_event, v) => setConfirm(v)}
          isRequired
          autoComplete="new-password"
        />
      </FormGroup>
      <ActionGroup>
        <Button type="submit" isLoading={change.isPending} isDisabled={change.isPending}>
          {submitLabel ?? t('account.submit')}
        </Button>
        {onCancel ? (
          <Button variant="link" onClick={onCancel} isDisabled={change.isPending}>
            {t('common.cancel')}
          </Button>
        ) : null}
      </ActionGroup>
    </Form>
  );
}
