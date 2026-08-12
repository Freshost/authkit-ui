import { Alert, AlertActionLink } from '@freshost/ui';
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

/** Persistent identity warning and exit action; mount it in the application shell. */
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
    <Alert
      className={className}
      variant="warning"
      isInline
      isLiveRegion
      title={t('impersonation.bannerTitle', { email: me.data.email })}
      actionLinks={
        <AlertActionLink
          isDisabled={stop.isPending}
          onClick={() => stop.mutate(undefined, { onSuccess: onStopped })}
        >
          {stop.isPending ? t('impersonation.stopping') : t('impersonation.stop')}
        </AlertActionLink>
      }
    >
      {t('impersonation.bannerBody', { email: actor.email })}
    </Alert>
  );
}
