import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Bullseye,
  Content,
  EmptyState,
  EmptyStateBody,
  Pagination,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarItem,
} from '@freshost/ui';

import type { AdminLoginQuery } from '../api/types';
import { useAdminLogins } from '../hooks/useAdminLogins';
import { AUTHKIT_NS } from '../i18n';
import { AdminLoginsTable } from './AdminLoginsTable';

interface AdminLoginFilters {
  user: string;
  ip: string;
  method: '' | 'password' | 'remember';
}

const emptyFilters: AdminLoginFilters = { user: '', ip: '', method: '' };

function quoteSearchValue(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function searchValueFor(filters: AdminLoginFilters): string {
  return [
    filters.user && `user:${quoteSearchValue(filters.user)}`,
    filters.ip && `ip:${quoteSearchValue(filters.ip)}`,
    filters.method && `method:${filters.method}`,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Role-gated, server-filtered and paginated overview of successful sign-ins. */
export function AdminLoginsPage() {
  const { t } = useTranslation(AUTHKIT_NS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<AdminLoginFilters>(emptyFilters);
  const [searchValue, setSearchValue] = useState('');
  const [hasFilterError, setHasFilterError] = useState(false);

  const query: AdminLoginQuery = {
    page,
    perPage,
    sort,
    ...(filters.user ? { user: filters.user } : {}),
    ...(filters.ip ? { ip: filters.ip } : {}),
    ...(filters.method ? { method: filters.method } : {}),
  };
  const logins = useAdminLogins(query);
  const hasFilters = Boolean(filters.user || filters.ip || filters.method);

  const replaceFilters = (next: AdminLoginFilters) => {
    setFilters(next);
    setSearchValue(searchValueFor(next));
    setPage(1);
  };

  const clearFilter = (name: keyof AdminLoginFilters) => {
    replaceFilters({ ...filters, [name]: '' });
  };

  const clearAllFilters = () => {
    setHasFilterError(false);
    replaceFilters(emptyFilters);
  };

  const applySearch = (values: Record<string, string>) => {
    const method = values.method?.trim().toLowerCase();
    if (method && method !== 'password' && method !== 'remember') {
      setHasFilterError(true);
      return;
    }
    setHasFilterError(false);
    replaceFilters({
      user: (values.user ?? values.haswords ?? '').trim(),
      ip: (values.ip ?? '').trim(),
      method: method === 'password' || method === 'remember' ? method : '',
    });
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="h1">{t('adminLogins.title')}</Content>
        <Content component="p">{t('adminLogins.description')}</Content>
      </StackItem>
      <StackItem>
        <Toolbar
          id="admin-logins-toolbar"
          clearAllFilters={clearAllFilters}
          clearFiltersButtonText={t('adminLogins.clearFilters')}
          collapseListedFiltersBreakpoint="xl"
        >
          <ToolbarContent>
            <ToolbarFilter
              categoryName={t('adminLogins.userLabel')}
              labels={filters.user ? [filters.user] : []}
              deleteLabel={() => clearFilter('user')}
              deleteLabelGroup={() => clearFilter('user')}
            >
              <SearchInput
                aria-label={t('adminLogins.searchLabel')}
                placeholder={t('adminLogins.searchPlaceholder')}
                value={searchValue}
                attributes={[
                  { attr: 'user', display: t('adminLogins.userLabel') },
                  { attr: 'ip', display: t('adminLogins.ipLabel') },
                  { attr: 'method', display: t('adminLogins.methodLabel') },
                ]}
                advancedSearchDelimiter=":"
                hasWordsAttrLabel={t('adminLogins.userLabel')}
                submitSearchButtonLabel={t('adminLogins.applyFilters')}
                resetButtonLabel={t('adminLogins.clearFilters')}
                openMenuButtonAriaLabel={t('adminLogins.openFilters')}
                onChange={(_event, value) => {
                  setSearchValue(value);
                  setHasFilterError(false);
                }}
                onSearch={(_event, _value, values) => applySearch(values)}
                onClear={clearAllFilters}
              />
            </ToolbarFilter>
            <ToolbarFilter
              categoryName={t('adminLogins.ipLabel')}
              labels={filters.ip ? [filters.ip] : []}
              deleteLabel={() => clearFilter('ip')}
              deleteLabelGroup={() => clearFilter('ip')}
              showToolbarItem={false}
            >
              <span />
            </ToolbarFilter>
            <ToolbarFilter
              categoryName={t('adminLogins.methodLabel')}
              labels={
                filters.method
                  ? [
                      filters.method === 'remember'
                        ? t('loginHistory.methodRemember')
                        : t('loginHistory.methodPassword'),
                    ]
                  : []
              }
              deleteLabel={() => clearFilter('method')}
              deleteLabelGroup={() => clearFilter('method')}
              showToolbarItem={false}
            >
              <span />
            </ToolbarFilter>
            {logins.data ? (
              <ToolbarItem align={{ default: 'alignEnd' }}>
                {t('adminLogins.total', { count: logins.data.total })}
              </ToolbarItem>
            ) : null}
          </ToolbarContent>
        </Toolbar>
      </StackItem>
      {hasFilterError ? (
        <StackItem>
          <Alert variant="warning" isInline title={t('adminLogins.invalidMethodFilter')} />
        </StackItem>
      ) : null}
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
          <EmptyState
            headingLevel="h2"
            titleText={hasFilters ? t('adminLogins.noResults') : t('adminLogins.empty')}
          >
            <EmptyStateBody>
              {hasFilters
                ? t('adminLogins.noResultsDescription')
                : t('adminLogins.emptyDescription')}
            </EmptyStateBody>
          </EmptyState>
        </StackItem>
      ) : (
        <>
          <StackItem>
            <AdminLoginsTable
              items={logins.data.items}
              ariaLabel={t('adminLogins.title')}
              sort={sort}
              onSort={(nextSort) => {
                setSort(nextSort);
                setPage(1);
              }}
            />
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
