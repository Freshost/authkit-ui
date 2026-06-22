import { useTranslation } from 'react-i18next';

import { Modal, ModalBody, ModalHeader } from '@freshost/ui';

import { AUTHKIT_NS } from '../i18n';
import { ChangePasswordForm } from './ChangePasswordForm';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** The change-password form in a modal — for app-shell user menus. */
export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  return (
    <Modal variant="small" isOpen={isOpen} onClose={onClose} aria-label={t('account.title')}>
      <ModalHeader title={t('account.title')} />
      <ModalBody>
        <ChangePasswordForm onSuccess={onClose} onCancel={onClose} />
      </ModalBody>
    </Modal>
  );
}
