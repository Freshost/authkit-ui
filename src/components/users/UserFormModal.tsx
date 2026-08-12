import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@freshost/ui';

import type { UserResponse } from '../../api/types';
import { useAuthkitConfig } from '../../hooks/useConfig';
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

  // Roles come from the backend config (the single source of truth). When a role
  // set is configured we render a select; otherwise free text. Include the
  // user's current role even if it's outside the set so editing never drops it.
  const roles = useAuthkitConfig().data?.roles ?? [];
  const roleOptions =
    roles.length > 0 && user?.role && !roles.includes(user.role) ? [user.role, ...roles] : roles;
  const defaultRole =
    user?.role ?? roleOptions.find((candidate) => candidate !== 'admin') ?? roleOptions[0] ?? 'user';

  const [email, setEmail] = useState(user?.email ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [role, setRole] = useState(defaultRole);
  const [disabled, setDisabled] = useState(user?.disabled ?? false);
  const [password, setPassword] = useState('');
  const pending = create.isPending || update.isPending;
  const title = isEdit ? t('users.editTitle') : t('users.createTitle');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isEdit && user) {
      update.mutate({ id: user.id, body: { email, name, role, disabled } }, { onSuccess: onClose });
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
            {roleOptions.length > 0 ? (
              <FormSelect
                id="authkit-user-role"
                value={role}
                onChange={(_event, v) => setRole(v)}
                aria-label={t('users.roleLabel')}
              >
                {roleOptions.map((r) => (
                  <FormSelectOption key={r} value={r} label={r} />
                ))}
              </FormSelect>
            ) : (
              <TextInput id="authkit-user-role" value={role} onChange={(_event, v) => setRole(v)} />
            )}
          </FormGroup>
          {isEdit ? (
            <FormGroup fieldId="authkit-user-disabled">
              <Checkbox
                id="authkit-user-disabled"
                label={t('users.disabledLabel')}
                description={t('users.disabledHint')}
                isChecked={disabled}
                onChange={(_event, checked) => setDisabled(checked)}
              />
            </FormGroup>
          ) : (
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
          )}
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
