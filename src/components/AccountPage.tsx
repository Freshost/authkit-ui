import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardTitle } from '@freshost/ui';

import { AUTHKIT_NS } from '../i18n';
import { ChangePasswordForm, type ChangePasswordFormProps } from './ChangePasswordForm';

export interface AccountPageProps {
  /** Forwarded to the change-password form (e.g. navigate after success). */
  onSuccess?: ChangePasswordFormProps['onSuccess'];
}

/** Drop-in account page: a card wrapping the change-password form. */
export function AccountPage({ onSuccess }: AccountPageProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  return (
    <Card>
      <CardTitle>{t('account.title')}</CardTitle>
      <CardBody>
        <ChangePasswordForm onSuccess={onSuccess} />
      </CardBody>
    </Card>
  );
}
