import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionGroup, Alert, Button, Form, FormGroup, TextInput } from '@freshost/ui';

import { useMe, useUpdateProfile } from '../hooks/useAuth';
import { AUTHKIT_NS } from '../i18n';
import { codeFrom, messageFrom } from '../utils';

export interface ProfileFormProps {
  /** Called after the profile is successfully saved. */
  onSuccess?: () => void;
  /** When provided, renders a Cancel button that calls this. */
  onCancel?: () => void;
  /** Override the submit button label. */
  submitLabel?: string;
}

/**
 * Edits the current user's own name and email, prefilled from <useMe>. Email is
 * required; a colliding email maps to a localized "already taken" message. Used
 * by <AccountPage>.
 */
export function ProfileForm({ onSuccess, onCancel, submitLabel }: ProfileFormProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const { data: me } = useMe();
  const update = useUpdateProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Seed the fields from the current user once it loads (and when it changes).
  useEffect(() => {
    if (me) {
      setName(me.name ?? '');
      setEmail(me.email ?? '');
    }
  }, [me]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate(
      { email: email.trim(), name: name.trim() },
      { onSuccess: () => onSuccess?.() },
    );
  };

  const error = update.isError
    ? codeFrom(update.error) === 'already_exists'
      ? t('profile.emailTaken')
      : messageFrom(update.error, t('profile.error'))
    : null;

  const dirty = me ? name.trim() !== (me.name ?? '') || email.trim() !== me.email : false;

  return (
    <Form onSubmit={submit}>
      {error ? <Alert variant="danger" isInline title={error} /> : null}
      <FormGroup label={t('profile.nameLabel')} fieldId="authkit-profile-name">
        <TextInput
          id="authkit-profile-name"
          value={name}
          onChange={(_event, v) => setName(v)}
          autoComplete="name"
        />
      </FormGroup>
      <FormGroup label={t('profile.emailLabel')} isRequired fieldId="authkit-profile-email">
        <TextInput
          id="authkit-profile-email"
          type="email"
          value={email}
          onChange={(_event, v) => setEmail(v)}
          isRequired
          autoComplete="email"
        />
      </FormGroup>
      <ActionGroup>
        <Button
          type="submit"
          isLoading={update.isPending}
          isDisabled={update.isPending || !dirty}
        >
          {submitLabel ?? t('profile.submit')}
        </Button>
        {onCancel ? (
          <Button variant="link" onClick={onCancel} isDisabled={update.isPending}>
            {t('common.cancel')}
          </Button>
        ) : null}
      </ActionGroup>
    </Form>
  );
}
