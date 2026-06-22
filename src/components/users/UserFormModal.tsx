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
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { AUTHKIT_NS } from '../../i18n';
import { useAuthkit } from '../../provider';

export interface UserFormModalProps {
  /** When set the modal edits this user; otherwise it creates a new one. */
  user?: UserResponse | null;
  onClose: () => void;
}

const FORM_ID = 'authkit-user-form';

/** Create/edit user modal. Password is only collected on create. */
export function UserFormModal({ user, onClose }: UserFormModalProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const { minPasswordLength } = useAuthkit();
  const isEdit = Boolean(user);
  const create = useCreateUser();
  const update = useUpdateUser();

  const [email, setEmail] = useState(user?.email ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [role, setRole] = useState(user?.role ?? 'admin');
  const [password, setPassword] = useState('');
  const pending = create.isPending || update.isPending;
  const title = isEdit ? t('users.editTitle') : t('users.createTitle');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isEdit && user) {
      update.mutate({ id: user.id, body: { email, name, role } }, { onSuccess: onClose });
    } else {
      create.mutate({ email, name, role, password }, { onSuccess: onClose });
    }
  };

  return (
    <Modal variant="small" isOpen onClose={onClose} aria-label={title}>
      <ModalHeader title={title} />
      <ModalBody>
        <Form onSubmit={submit} id={FORM_ID}>
          <FormGroup label={t('users.emailLabel')} isRequired fieldId="authkit-user-email">
            <TextInput
              id="authkit-user-email"
              type="email"
              value={email}
              onChange={(_event, v) => setEmail(v)}
              isRequired
              autoComplete="off"
            />
          </FormGroup>
          <FormGroup label={t('users.nameLabel')} fieldId="authkit-user-name">
            <TextInput
              id="authkit-user-name"
              value={name}
              onChange={(_event, v) => setName(v)}
              autoComplete="off"
            />
          </FormGroup>
          <FormGroup label={t('users.roleLabel')} fieldId="authkit-user-role">
            <TextInput id="authkit-user-role" value={role} onChange={(_event, v) => setRole(v)} />
          </FormGroup>
          {!isEdit ? (
            <FormGroup label={t('users.passwordLabel')} isRequired fieldId="authkit-user-password">
              <TextInput
                id="authkit-user-password"
                type="password"
                value={password}
                onChange={(_event, v) => setPassword(v)}
                isRequired
                minLength={minPasswordLength}
                autoComplete="new-password"
              />
            </FormGroup>
          ) : null}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form={FORM_ID} isLoading={pending} isDisabled={pending}>
          {isEdit ? t('common.save') : t('common.create')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={pending}>
          {t('common.cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
