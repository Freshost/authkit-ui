import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Label,
  Spinner,
} from '@freshost/ui';
import { ArrowRightIcon, HistoryIcon } from '@freshost/ui/icons';

import { useAdminLogins } from '../hooks/useAdminLogins';
import { AUTHKIT_NS } from '../i18n';
import { AdminLoginsTable } from './AdminLoginsTable';

export interface AdminLoginsCardProps {
  /** Number of recent sign-ins to show. Clamped to the backend range 1–100. */
  limit?: number;
  /** Optional host-supplied heading. */
  title?: ReactNode;
  /** Render a "View all" action that delegates navigation to the host app. */
  onViewAll?: () => void;
  className?: string;
}

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 5;
  return Math.min(100, Math.max(1, Math.trunc(limit)));
}

/** Compact dashboard card showing the most recent successful user sign-ins. */
export function AdminLoginsCard({
  limit = 5,
  title,
  onViewAll,
  className,
}: AdminLoginsCardProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const pageSize = normalizeLimit(limit);
  const logins = useAdminLogins({ page: 1, perPage: pageSize, sort: 'desc' });

  return (
    <Card
      component="section"
      aria-label={t('adminLogins.cardTitle')}
      className={className}
      isFullHeight
    >
      <CardTitle>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          gap={{ default: 'gapSm' }}
        >
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
              <FlexItem>
                <HistoryIcon aria-hidden />
              </FlexItem>
              <FlexItem>{title ?? t('adminLogins.cardTitle')}</FlexItem>
            </Flex>
          </FlexItem>
          {logins.data ? (
            <FlexItem>
              <Label color="blue" isCompact>
                {t('adminLogins.total', { count: logins.data.total })}
              </Label>
            </FlexItem>
          ) : null}
        </Flex>
      </CardTitle>
      <CardBody>
        {logins.isLoading ? (
          <Bullseye>
            <Spinner aria-label={t('common.loading')} />
          </Bullseye>
        ) : logins.isError ? (
          <Alert variant="danger" isInline title={t('adminLogins.error')} />
        ) : !logins.data || logins.data.items.length === 0 ? (
          <Content component="p">{t('adminLogins.empty')}</Content>
        ) : (
          <AdminLoginsTable
            items={logins.data.items}
            ariaLabel={t('adminLogins.cardTitle')}
          />
        )}
      </CardBody>
      {onViewAll ? (
        <CardFooter>
          <Button
            variant="link"
            isInline
            icon={<ArrowRightIcon />}
            iconPosition="right"
            onClick={onViewAll}
          >
            {t('adminLogins.viewAll')}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
