import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Bullseye,
  Content,
  EmptyState,
  EmptyStateBody,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  MenuToggle,
  Pagination,
  Popper,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
} from '@freshost/ui';
import { RhUiFilterFillIcon } from '@freshost/ui/icons';

import type { AdminLoginQuery } from '../api/types';
import { useAdminLogins } from '../hooks/useAdminLogins';
import { AUTHKIT_NS } from '../i18n';
import { AdminLoginsTable } from './AdminLoginsTable';

type FilterAttribute = 'user' | 'ip' | 'method';

interface AdminLoginFilters {
  user: string;
  ip: string;
  method: '' | 'password' | 'remember';
}

const emptyFilters: AdminLoginFilters = { user: '', ip: '', method: '' };

/** Role-gated, server-filtered and paginated overview of successful sign-ins. */
export function AdminLoginsPage() {
  const { t } = useTranslation(AUTHKIT_NS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<AdminLoginFilters>(emptyFilters);
  const [activeAttribute, setActiveAttribute] = useState<FilterAttribute>('user');

  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = useState(false);
  const attributeToggleRef = useRef<HTMLButtonElement>(null);
  const attributeMenuRef = useRef<HTMLDivElement>(null);
  const attributeContainerRef = useRef<HTMLDivElement>(null);

  const [isMethodMenuOpen, setIsMethodMenuOpen] = useState(false);
  const methodToggleRef = useRef<HTMLButtonElement>(null);
  const methodMenuRef = useRef<HTMLDivElement>(null);
  const methodContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Tab') return;
      if (
        isAttributeMenuOpen &&
        (attributeMenuRef.current?.contains(event.target as Node) ||
          attributeToggleRef.current?.contains(event.target as Node))
      ) {
        setIsAttributeMenuOpen(false);
        attributeToggleRef.current?.focus();
      }
      if (
        isMethodMenuOpen &&
        (methodMenuRef.current?.contains(event.target as Node) ||
          methodToggleRef.current?.contains(event.target as Node))
      ) {
        setIsMethodMenuOpen(false);
        methodToggleRef.current?.focus();
      }
    };
    const handleClick = (event: MouseEvent) => {
      if (
        isAttributeMenuOpen &&
        !attributeMenuRef.current?.contains(event.target as Node) &&
        !attributeToggleRef.current?.contains(event.target as Node)
      ) {
        setIsAttributeMenuOpen(false);
      }
      if (
        isMethodMenuOpen &&
        !methodMenuRef.current?.contains(event.target as Node) &&
        !methodToggleRef.current?.contains(event.target as Node)
      ) {
        setIsMethodMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [isAttributeMenuOpen, isMethodMenuOpen]);

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

  const replaceFilter = <K extends keyof AdminLoginFilters>(
    name: K,
    value: AdminLoginFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
  };

  const attributeLabels: Record<FilterAttribute, string> = {
    user: t('adminLogins.userLabel'),
    ip: t('adminLogins.ipLabel'),
    method: t('adminLogins.methodLabel'),
  };

  const attributeToggle = (
    <MenuToggle
      ref={attributeToggleRef}
      icon={<RhUiFilterFillIcon />}
      isExpanded={isAttributeMenuOpen}
      onClick={(event) => {
        event.stopPropagation();
        setIsAttributeMenuOpen((open) => !open);
      }}
    >
      {attributeLabels[activeAttribute]}
    </MenuToggle>
  );
  const attributeMenu = (
    <Menu
      ref={attributeMenuRef}
      aria-label={t('adminLogins.attributeMenuLabel')}
      onSelect={(_event, itemId) => {
        setActiveAttribute(itemId as FilterAttribute);
        setIsAttributeMenuOpen(false);
        attributeToggleRef.current?.focus();
      }}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="user">{attributeLabels.user}</MenuItem>
          <MenuItem itemId="ip">{attributeLabels.ip}</MenuItem>
          <MenuItem itemId="method">{attributeLabels.method}</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const methodLabel = filters.method
    ? filters.method === 'remember'
      ? t('loginHistory.methodRemember')
      : t('loginHistory.methodPassword')
    : '';
  const methodToggle = (
    <MenuToggle
      ref={methodToggleRef}
      isExpanded={isMethodMenuOpen}
      onClick={(event) => {
        event.stopPropagation();
        setIsMethodMenuOpen((open) => !open);
      }}
    >
      {methodLabel || t('adminLogins.methodPlaceholder')}
    </MenuToggle>
  );
  const methodMenu = (
    <Menu
      ref={methodMenuRef}
      aria-label={t('adminLogins.methodMenuLabel')}
      selected={filters.method}
      onSelect={(_event, itemId) => {
        const method = itemId === 'remember' ? 'remember' : 'password';
        replaceFilter('method', method);
        setIsMethodMenuOpen(false);
        methodToggleRef.current?.focus();
      }}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="password">{t('loginHistory.methodPassword')}</MenuItem>
          <MenuItem itemId="remember">{t('loginHistory.methodRemember')}</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

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
            <ToolbarToggleGroup toggleIcon={<RhUiFilterFillIcon />} breakpoint="xl">
              <ToolbarGroup variant="filter-group">
                <ToolbarItem>
                  <div ref={attributeContainerRef}>
                    <Popper
                      trigger={attributeToggle}
                      triggerRef={attributeToggleRef}
                      popper={attributeMenu}
                      popperRef={attributeMenuRef}
                      appendTo={attributeContainerRef.current || undefined}
                      isVisible={isAttributeMenuOpen}
                    />
                  </div>
                </ToolbarItem>
                <ToolbarFilter
                  categoryName={attributeLabels.user}
                  labels={filters.user ? [filters.user] : []}
                  deleteLabel={() => replaceFilter('user', '')}
                  deleteLabelGroup={() => replaceFilter('user', '')}
                  showToolbarItem={activeAttribute === 'user'}
                >
                  <SearchInput
                    aria-label={t('adminLogins.userSearchLabel')}
                    placeholder={t('adminLogins.userSearchPlaceholder')}
                    value={filters.user}
                    onChange={(_event, value) => replaceFilter('user', value)}
                    onClear={() => replaceFilter('user', '')}
                  />
                </ToolbarFilter>
                <ToolbarFilter
                  categoryName={attributeLabels.ip}
                  labels={filters.ip ? [filters.ip] : []}
                  deleteLabel={() => replaceFilter('ip', '')}
                  deleteLabelGroup={() => replaceFilter('ip', '')}
                  showToolbarItem={activeAttribute === 'ip'}
                >
                  <SearchInput
                    aria-label={t('adminLogins.ipSearchLabel')}
                    placeholder={t('adminLogins.ipSearchPlaceholder')}
                    value={filters.ip}
                    onChange={(_event, value) => replaceFilter('ip', value)}
                    onClear={() => replaceFilter('ip', '')}
                  />
                </ToolbarFilter>
                <ToolbarFilter
                  categoryName={attributeLabels.method}
                  labels={methodLabel ? [methodLabel] : []}
                  deleteLabel={() => replaceFilter('method', '')}
                  deleteLabelGroup={() => replaceFilter('method', '')}
                  showToolbarItem={activeAttribute === 'method'}
                >
                  <div ref={methodContainerRef}>
                    <Popper
                      trigger={methodToggle}
                      triggerRef={methodToggleRef}
                      popper={methodMenu}
                      popperRef={methodMenuRef}
                      appendTo={methodContainerRef.current || undefined}
                      isVisible={isMethodMenuOpen}
                    />
                  </div>
                </ToolbarFilter>
              </ToolbarGroup>
            </ToolbarToggleGroup>
            {logins.data ? (
              <ToolbarItem align={{ default: 'alignEnd' }}>
                {t('adminLogins.total', { count: logins.data.total })}
              </ToolbarItem>
            ) : null}
          </ToolbarContent>
        </Toolbar>
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
