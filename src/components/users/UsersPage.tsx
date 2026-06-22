import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActionsColumn,
  Alert,
  Bullseye,
  Button,
  Content,
  EmptyState,
  EmptyStateBody,
  Label,
  Spinner,
  Stack,
  StackItem,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tr,
} from '@freshost/ui';
import { PlusIcon } from '@freshost/ui/icons';

import type { UserResponse } from '../../api/types';
import { useAuthkitConfig } from '../../hooks/useConfig';
import { useUsers } from '../../hooks/useUsers';
import { AUTHKIT_NS } from '../../i18n';
import { DeleteUserModal } from './DeleteUserModal';
import { SetUserPasswordModal } from './SetUserPasswordModal';
import { UserFormModal } from './UserFormModal';

type ModalState =
  | { kind: 'create' }
  | { kind: 'edit'; user: UserResponse }
  | { kind: 'password'; user: UserResponse }
  | { kind: 'delete'; user: UserResponse }
  | null;

function formatDate(iso: string): string {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

/**
 * Drop-in user-management page: a table of users with create / edit / reset-
 * password / delete actions. Requires the backend `user_management` feature.
 */
export function UsersPage() {
  const { t } = useTranslation(AUTHKIT_NS);
  const { data: users, isLoading, isError } = useUsers();
  // Warm the config cache so the role select is ready when a modal opens.
  useAuthkitConfig();
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="h1">{t('users.title')}</Content>
      </StackItem>
      <StackItem>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Button icon={<PlusIcon />} onClick={() => setModal({ kind: 'create' })}>
                {t('users.addUser')}
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </StackItem>
      <StackItem>
        {isLoading ? (
          <Bullseye>
            <Spinner aria-label={t('common.loading')} />
          </Bullseye>
        ) : isError ? (
          <Alert variant="danger" isInline title={t('users.error')} />
        ) : !users || users.length === 0 ? (
          <EmptyState headingLevel="h2" titleText={t('users.empty')}>
            <EmptyStateBody>{t('users.empty')}</EmptyStateBody>
          </EmptyState>
        ) : (
          <Table aria-label={t('users.title')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('users.emailLabel')}</Th>
                <Th>{t('users.nameLabel')}</Th>
                <Th>{t('users.roleLabel')}</Th>
                <Th>{t('users.createdAtLabel')}</Th>
                <Th screenReaderText={t('users.actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td dataLabel={t('users.emailLabel')}>
                    {user.email}
                    {user.disabled ? (
                      <>
                        {' '}
                        <Label color="red" isCompact>
                          {t('users.disabledBadge')}
                        </Label>
                      </>
                    ) : null}
                  </Td>
                  <Td dataLabel={t('users.nameLabel')}>{user.name}</Td>
                  <Td dataLabel={t('users.roleLabel')}>{user.role}</Td>
                  <Td dataLabel={t('users.createdAtLabel')}>{formatDate(user.createdAt)}</Td>
                  <Td isActionCell>
                    <ActionsColumn
                      items={[
                        { title: t('users.edit'), onClick: () => setModal({ kind: 'edit', user }) },
                        {
                          title: t('users.resetPassword'),
                          onClick: () => setModal({ kind: 'password', user }),
                        },
                        { isSeparator: true },
                        {
                          title: t('users.delete'),
                          isDanger: true,
                          onClick: () => setModal({ kind: 'delete', user }),
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </StackItem>

      {modal?.kind === 'create' ? <UserFormModal onClose={close} /> : null}
      {modal?.kind === 'edit' ? <UserFormModal user={modal.user} onClose={close} /> : null}
      {modal?.kind === 'password' ? (
        <SetUserPasswordModal user={modal.user} onClose={close} />
      ) : null}
      {modal?.kind === 'delete' ? <DeleteUserModal user={modal.user} onClose={close} /> : null}
    </Stack>
  );
}
