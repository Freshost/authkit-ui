import { useState } from 'react';

import { Button, Card, CardBody, CardTitle, Content, Stack, StackItem } from '@freshost/ui';
import {
  DisableTwoFactor,
  RecoveryCodes,
  TwoFactorSetup,
  useRegenerateRecoveryCodes,
} from '@freshost/authkit-ui';

/**
 * Exercises the whole 2FA surface. Since the backend's /me does not report 2FA
 * state, every panel is shown; trying one that doesn't apply (e.g. enabling when
 * already enabled) surfaces the backend error as a toast.
 */
export function SecurityPage() {
  const regenerate = useRegenerateRecoveryCodes();
  const [regenerated, setRegenerated] = useState<string[] | null>(null);

  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="h1">Security</Content>
      </StackItem>

      <StackItem>
        <Card>
          <CardTitle>Set up two-factor authentication</CardTitle>
          <CardBody>
            <TwoFactorSetup />
          </CardBody>
        </Card>
      </StackItem>

      <StackItem>
        <Card>
          <CardTitle>Regenerate recovery codes</CardTitle>
          <CardBody>
            <Button
              variant="secondary"
              isLoading={regenerate.isPending}
              isDisabled={regenerate.isPending}
              onClick={() =>
                regenerate.mutate(undefined, { onSuccess: (r) => setRegenerated(r.recoveryCodes) })
              }
            >
              Regenerate
            </Button>
            {regenerated ? (
              <div style={{ marginTop: 16 }}>
                <RecoveryCodes codes={regenerated} />
              </div>
            ) : null}
          </CardBody>
        </Card>
      </StackItem>

      <StackItem>
        <Card>
          <CardTitle>Disable two-factor authentication</CardTitle>
          <CardBody>
            <DisableTwoFactor />
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
}
