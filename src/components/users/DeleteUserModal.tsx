import { useTranslation } from 'react-i18next';

import { Button, Content, Modal, ModalBody, ModalFooter, ModalHeader } from '@freshost/ui';

import type { UserResponse } from '../../api/types';
import { useDeleteUser } from '../../hooks/useUsers';
import { AUTHKIT_NS } from '../../i18n';

export interface DeleteUserModalProps {
  user: UserResponse;
  onClose: () => void;
}

/** Confirmation modal for deleting a user. */
export function DeleteUserModal({ user, onClose }: DeleteUserModalProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const del = useDeleteUser();
  const title = t('users.deleteTitle', { email: user.email });

  return (
    <Modal variant="small" isOpen onClose={onClose} aria-label={title}>
      <ModalHeader title={title} titleIconVariant="warning" />
      <ModalBody>
        <Content component="p">{t('users.deleteBody')}</Content>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          isLoading={del.isPending}
          isDisabled={del.isPending}
          onClick={() => del.mutate(user.id, { onSuccess: onClose })}
        >
          {t('users.delete')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={del.isPending}>
          {t('common.cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
