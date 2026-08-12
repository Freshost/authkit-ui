import { useTranslation } from 'react-i18next';

import { Button, Content, Modal, ModalBody, ModalFooter, ModalHeader } from '@freshost/ui';

import type { UserResponse } from '../../api/types';
import { useImpersonate } from '../../hooks/useImpersonation';
import { AUTHKIT_NS } from '../../i18n';

export interface ImpersonateUserModalProps {
  user: UserResponse;
  onClose: () => void;
  onImpersonated?: (user: UserResponse) => void;
}

/** Confirmation modal for same-guard user impersonation. */
export function ImpersonateUserModal({
  user,
  onClose,
  onImpersonated,
}: ImpersonateUserModalProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const impersonate = useImpersonate();
  const title = t('impersonation.confirmTitle', { email: user.email });

  return (
    <Modal variant="small" isOpen onClose={onClose} aria-label={title}>
      <ModalHeader title={title} titleIconVariant="warning" />
      <ModalBody>
        <Content component="p">{t('impersonation.confirmBody')}</Content>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isLoading={impersonate.isPending}
          isDisabled={impersonate.isPending}
          onClick={() =>
            impersonate.mutate(
              { userId: user.id },
              {
                onSuccess: (target) => {
                  onClose();
                  onImpersonated?.(target);
                },
              },
            )
          }
        >
          {t('impersonation.start')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={impersonate.isPending}>
          {t('common.cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
