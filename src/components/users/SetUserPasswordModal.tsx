import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@freshost/ui';

import type { UserResponse } from '../../api/types';
import { useSetUserPassword } from '../../hooks/useUsers';
import { AUTHKIT_NS } from '../../i18n';
import { useAuthkit } from '../../provider';

export interface SetUserPasswordModalProps {
  user: UserResponse;
  onClose: () => void;
}

const FORM_ID = 'authkit-set-password-form';

/** Admin "reset password" modal for a target user. */
export function SetUserPasswordModal({ user, onClose }: SetUserPasswordModalProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const { minPasswordLength } = useAuthkit();
  const setPassword = useSetUserPassword();
  const [password, setPasswordValue] = useState('');
  const title = t('users.resetPasswordTitle', { name: user.name || user.email });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPassword.mutate({ id: user.id, body: { password } }, { onSuccess: onClose });
  };

  return (
    <Modal variant="small" isOpen onClose={onClose} aria-label={title}>
      <ModalHeader title={title} />
      <ModalBody>
        <Form onSubmit={submit} id={FORM_ID}>
          <FormGroup label={t('users.newPasswordLabel')} isRequired fieldId="authkit-set-password">
            <TextInput
              id="authkit-set-password"
              type="password"
              value={password}
              onChange={(_event, v) => setPasswordValue(v)}
              isRequired
              minLength={minPasswordLength}
              autoComplete="new-password"
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          type="submit"
          form={FORM_ID}
          isLoading={setPassword.isPending}
          isDisabled={setPassword.isPending || password.length === 0}
        >
          {t('users.resetPassword')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={setPassword.isPending}>
          {t('common.cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
