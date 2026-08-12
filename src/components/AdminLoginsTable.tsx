import { useTranslation } from 'react-i18next';

import { Content, Table, Tbody, Td, Th, Thead, Tr } from '@freshost/ui';

import type { AdminLoginEvent } from '../api/types';
import { AUTHKIT_NS } from '../i18n';

function formatDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

interface AdminLoginsTableProps {
  items: AdminLoginEvent[];
  ariaLabel: string;
}

/** Shared presentation used by the full page and dashboard card. */
export function AdminLoginsTable({ items, ariaLabel }: AdminLoginsTableProps) {
  const { t } = useTranslation(AUTHKIT_NS);

  return (
    <Table aria-label={ariaLabel} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('adminLogins.userLabel')}</Th>
          <Th>{t('adminLogins.whenLabel')}</Th>
          <Th>{t('adminLogins.methodLabel')}</Th>
          <Th>{t('adminLogins.ipLabel')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {items.map((entry) => (
          <Tr key={entry.id}>
            <Td dataLabel={t('adminLogins.userLabel')}>
              <Content component="p">
                <b>{entry.userName || entry.userEmail}</b>
                {entry.userName ? (
                  <>
                    <br />
                    {entry.userEmail}
                  </>
                ) : null}
              </Content>
            </Td>
            <Td dataLabel={t('adminLogins.whenLabel')}>{formatDate(entry.createdAt)}</Td>
            <Td dataLabel={t('adminLogins.methodLabel')}>
              {entry.action === 'auth.login_remember'
                ? t('loginHistory.methodRemember')
                : t('loginHistory.methodPassword')}
            </Td>
            <Td dataLabel={t('adminLogins.ipLabel')}>
              {entry.ip || t('adminLogins.unknownIp')}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
