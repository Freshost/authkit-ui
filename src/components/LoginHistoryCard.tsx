import { useTranslation } from 'react-i18next';

import {
  Bullseye,
  Card,
  CardBody,
  CardTitle,
  Content,
  Spinner,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@freshost/ui';

import { useLoginHistory } from '../hooks/useSessions';
import { AUTHKIT_NS } from '../i18n';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

/** Card listing the current user's recent successful sign-ins with their IP. */
export function LoginHistoryCard() {
  const { t } = useTranslation(AUTHKIT_NS);
  const { data, isLoading } = useLoginHistory();

  return (
    <Card>
      <CardTitle>{t('loginHistory.title')}</CardTitle>
      <CardBody>
        {isLoading ? (
          <Bullseye>
            <Spinner aria-label={t('common.loading')} />
          </Bullseye>
        ) : !data || data.length === 0 ? (
          <Content component="p">{t('loginHistory.empty')}</Content>
        ) : (
          <Table aria-label={t('loginHistory.title')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('loginHistory.whenLabel')}</Th>
                <Th>{t('loginHistory.methodLabel')}</Th>
                <Th>{t('loginHistory.ipLabel')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((entry, i) => (
                <Tr key={`${entry.createdAt}-${i}`}>
                  <Td dataLabel={t('loginHistory.whenLabel')}>{formatDate(entry.createdAt)}</Td>
                  <Td dataLabel={t('loginHistory.methodLabel')}>
                    {entry.action === 'auth.login_remember'
                      ? t('loginHistory.methodRemember')
                      : t('loginHistory.methodPassword')}
                  </Td>
                  <Td dataLabel={t('loginHistory.ipLabel')}>{entry.ip}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
