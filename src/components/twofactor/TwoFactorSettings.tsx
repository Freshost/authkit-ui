import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardTitle,
  Spinner,
  Stack,
  StackItem,
} from '@freshost/ui';

import { authkitKeys, useMe } from '../../hooks/useAuth';
import { useRegenerateRecoveryCodes } from '../../hooks/useTwoFactor';
import { AUTHKIT_NS } from '../../i18n';
import { DisableTwoFactor } from './DisableTwoFactor';
import { RecoveryCodes } from './RecoveryCodes';
import { TwoFactorSetup } from './TwoFactorSetup';

/**
 * The complete two-factor settings panel. Reads the user's 2FA state from
 * {@link useMe} and shows the right thing: enrollment when off, or recovery-code
 * regeneration + disable when on. Flipping between the two is driven by
 * invalidating the `me` query once an enable/disable completes — so callers just
 * drop `<TwoFactorSettings />` in and never wire the on/off branching themselves.
 */
export function TwoFactorSettings() {
  const { t } = useTranslation(AUTHKIT_NS);
  const me = useMe();
  const queryClient = useQueryClient();
  const regenerate = useRegenerateRecoveryCodes();
  const [regenerated, setRegenerated] = useState<string[] | null>(null);

  const refreshMe = () => {
    void queryClient.invalidateQueries({ queryKey: authkitKeys.me });
  };

  if (me.isLoading) {
    return (
      <Bullseye>
        <Spinner aria-label={t('common.loading')} />
      </Bullseye>
    );
  }

  const enabled = me.data?.twoFactorEnabled ?? false;

  if (!enabled) {
    return (
      <Card>
        <CardTitle>{t('twoFactor.setupTitle')}</CardTitle>
        <CardBody>
          {/* onFinished fires when the recovery codes are dismissed → refetch
              me → this panel flips to the enabled view. */}
          <TwoFactorSetup onFinished={refreshMe} />
        </CardBody>
      </Card>
    );
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <Alert variant="success" isInline isPlain title={t('twoFactor.enabledTitle')} />
      </StackItem>
      <StackItem>
        <Card>
          <CardTitle>{t('twoFactor.recoveryTitle')}</CardTitle>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <Button
                  variant="secondary"
                  isLoading={regenerate.isPending}
                  isDisabled={regenerate.isPending}
                  onClick={() =>
                    regenerate.mutate(undefined, {
                      onSuccess: (r) => setRegenerated(r.recoveryCodes),
                    })
                  }
                >
                  {t('twoFactor.recoveryRegenerate')}
                </Button>
              </StackItem>
              {regenerated ? (
                <StackItem>
                  <RecoveryCodes codes={regenerated} onDone={() => setRegenerated(null)} />
                </StackItem>
              ) : null}
            </Stack>
          </CardBody>
        </Card>
      </StackItem>
      <StackItem>
        <Card>
          <CardTitle>{t('twoFactor.disableTitle')}</CardTitle>
          <CardBody>
            <DisableTwoFactor
              onDisabled={() => {
                setRegenerated(null);
                refreshMe();
              }}
            />
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
}
