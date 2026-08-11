import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardTitle, Stack, StackItem } from '@freshost/ui';

import { useAuthkitConfig } from '../hooks/useConfig';
import { AUTHKIT_NS } from '../i18n';
import { ChangePasswordForm, type ChangePasswordFormProps } from './ChangePasswordForm';
import { LoginHistoryCard } from './LoginHistoryCard';
import { ProfileForm } from './ProfileForm';
import { SessionsCard } from './SessionsCard';
import { APITokensCard } from './APITokensCard';

export interface AccountPageProps {
  /** Forwarded to the change-password form (e.g. navigate after success). */
  onSuccess?: ChangePasswordFormProps['onSuccess'];
}

/**
 * Drop-in account page: profile (edit own name + email), change password, recent
 * sign-in activity, and active sessions. The activity / sessions cards appear
 * only when the backend enables the audit-log / sessions features.
 */
export function AccountPage({ onSuccess }: AccountPageProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const features = useAuthkitConfig().data?.features;

  return (
    <Stack hasGutter>
      <StackItem>
        <Card>
          <CardTitle>{t('profile.title')}</CardTitle>
          <CardBody>
            <ProfileForm />
          </CardBody>
        </Card>
      </StackItem>
      <StackItem>
        <Card>
          <CardTitle>{t('account.title')}</CardTitle>
          <CardBody>
            <ChangePasswordForm onSuccess={onSuccess} />
          </CardBody>
        </Card>
      </StackItem>
      {features?.sessions ? (
        <StackItem>
          <SessionsCard />
        </StackItem>
      ) : null}
      {features?.apiTokens ? (
        <StackItem>
          <APITokensCard />
        </StackItem>
      ) : null}
      {features?.auditLog ? (
        <StackItem>
          <LoginHistoryCard />
        </StackItem>
      ) : null}
    </Stack>
  );
}
