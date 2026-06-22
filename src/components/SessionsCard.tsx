import { useTranslation } from 'react-i18next';

import {
  Bullseye,
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  Label,
  Spinner,
  Split,
  SplitItem,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@freshost/ui';

import { useSessions, useTerminateOtherSessions, useTerminateSession } from '../hooks/useSessions';
import { AUTHKIT_NS } from '../i18n';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

/**
 * Card listing the current user's active sessions with device / IP / last-active
 * detail, a per-session terminate action, and a "sign out other sessions" button.
 */
export function SessionsCard() {
  const { t } = useTranslation(AUTHKIT_NS);
  const { data, isLoading } = useSessions();
  const terminate = useTerminateSession();
  const terminateOthers = useTerminateOtherSessions();

  const hasOthers = (data ?? []).some((s) => !s.current);

  return (
    <Card>
      <CardTitle>
        <Split hasGutter>
          <SplitItem isFilled>{t('sessions.title')}</SplitItem>
          {hasOthers ? (
            <SplitItem>
              <Button
                variant="secondary"
                isDanger
                isLoading={terminateOthers.isPending}
                isDisabled={terminateOthers.isPending}
                onClick={() => terminateOthers.mutate()}
              >
                {t('sessions.signOutOthers')}
              </Button>
            </SplitItem>
          ) : null}
        </Split>
      </CardTitle>
      <CardBody>
        {isLoading ? (
          <Bullseye>
            <Spinner aria-label={t('common.loading')} />
          </Bullseye>
        ) : !data || data.length === 0 ? (
          <Content component="p">{t('sessions.empty')}</Content>
        ) : (
          <Table aria-label={t('sessions.title')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('sessions.deviceLabel')}</Th>
                <Th>{t('sessions.ipLabel')}</Th>
                <Th>{t('sessions.lastActiveLabel')}</Th>
                <Th screenReaderText={t('sessions.actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {data.map((session) => (
                <Tr key={session.id}>
                  <Td dataLabel={t('sessions.deviceLabel')}>
                    {session.userAgent || t('sessions.unknownDevice')}
                    {session.current ? (
                      <>
                        {' '}
                        <Label color="blue" isCompact>
                          {t('sessions.currentBadge')}
                        </Label>
                      </>
                    ) : null}
                  </Td>
                  <Td dataLabel={t('sessions.ipLabel')}>{session.ip}</Td>
                  <Td dataLabel={t('sessions.lastActiveLabel')}>
                    {formatDate(session.lastActiveAt)}
                  </Td>
                  <Td isActionCell>
                    {session.current ? null : (
                      <Button
                        variant="link"
                        isDanger
                        isInline
                        isDisabled={terminate.isPending}
                        onClick={() => terminate.mutate(session.id)}
                      >
                        {t('sessions.terminate')}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
