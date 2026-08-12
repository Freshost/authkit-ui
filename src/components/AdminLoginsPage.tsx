import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Bullseye,
  Content,
  EmptyState,
  EmptyStateBody,
  Pagination,
  Spinner,
  Stack,
  StackItem,
} from '@freshost/ui';

import { useAdminLogins } from '../hooks/useAdminLogins';
import { AUTHKIT_NS } from '../i18n';
import { AdminLoginsTable } from './AdminLoginsTable';

/** Role-gated, server-paginated overview of successful sign-ins for a guard. */
export function AdminLoginsPage() {
  const { t } = useTranslation(AUTHKIT_NS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const logins = useAdminLogins(page, perPage);

  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="h1">{t('adminLogins.title')}</Content>
        <Content component="p">{t('adminLogins.description')}</Content>
      </StackItem>
      {logins.isLoading ? (
        <StackItem isFilled>
          <Bullseye>
            <Spinner aria-label={t('common.loading')} />
          </Bullseye>
        </StackItem>
      ) : logins.isError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('adminLogins.error')} />
        </StackItem>
      ) : !logins.data || logins.data.items.length === 0 ? (
        <StackItem>
          <EmptyState headingLevel="h2" titleText={t('adminLogins.empty')}>
            <EmptyStateBody>{t('adminLogins.emptyDescription')}</EmptyStateBody>
          </EmptyState>
        </StackItem>
      ) : (
        <>
          <StackItem>
            <AdminLoginsTable items={logins.data.items} ariaLabel={t('adminLogins.title')} />
          </StackItem>
          <StackItem>
            <Pagination
              itemCount={logins.data.total}
              page={logins.data.page}
              perPage={logins.data.perPage}
              perPageOptions={[
                { title: '10', value: 10 },
                { title: '20', value: 20 },
                { title: '50', value: 50 },
              ]}
              onSetPage={(_event, nextPage) => setPage(nextPage)}
              onPerPageSelect={(_event, nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
              isDisabled={logins.isFetching}
              variant="bottom"
            />
          </StackItem>
        </>
      )}
    </Stack>
  );
}
