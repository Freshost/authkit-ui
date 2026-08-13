import { Banner, Button, Flex, FlexItem } from '@freshost/ui';
import { UndoAltIcon, UserSecretIcon } from '@freshost/ui/icons';
import { useTranslation } from 'react-i18next';

import type { UserResponse } from '../api/types';
import { useMe } from '../hooks/useAuth';
import { useStopImpersonating } from '../hooks/useImpersonation';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';

export interface ImpersonationBannerProps {
  /** Called after stop; actor is null when leaving a cross-guard target portal. */
  onStopped?: (actor: UserResponse | null) => void;
  className?: string;
}

/** Slim persistent identity bar; mount it immediately before the application shell. */
export function ImpersonationBanner({ onStopped, className }: ImpersonationBannerProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const { guard } = useAuthkit();
  const me = useMe();
  const actor = me.data?.impersonatedBy;
  const restoreActor = !guard || !actor || actor.guard === guard;
  const stop = useStopImpersonating({ restoreActor });

  if (!me.data || !actor) {
    return null;
  }

  return (
    <Banner
      className={className}
      status="warning"
      isSticky
      screenReaderText={t('impersonation.bannerStatus')}
    >
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        gap={{ default: 'gapSm' }}
        flexWrap={{ default: 'nowrap' }}
      >
        <FlexItem>
          <UserSecretIcon aria-hidden />
        </FlexItem>
        <FlexItem
          flex={{ default: 'flex_1' }}
          style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          <strong>{t('impersonation.bannerTitle', { email: me.data.email })}</strong>
        </FlexItem>
        <FlexItem>
          <Button
            variant="secondary"
            size="sm"
            icon={<UndoAltIcon aria-hidden />}
            aria-label={t('impersonation.stop')}
            isLoading={stop.isPending}
            isDisabled={stop.isPending}
            spinnerAriaLabel={t('impersonation.stopping')}
            onClick={() =>
              stop.mutate(undefined, {
                onSuccess: (restoredActor) => onStopped?.(restoredActor),
              })
            }
          >
            {stop.isPending ? t('impersonation.stopping') : t('impersonation.exit')}
          </Button>
        </FlexItem>
      </Flex>
    </Banner>
  );
}
