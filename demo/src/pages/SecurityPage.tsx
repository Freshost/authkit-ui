import { useTranslation } from 'react-i18next';

import { Stack, StackItem, Title } from '@freshost/ui';
import { TwoFactorSettings } from '@freshost/authkit-ui';

/**
 * Two-factor settings. `<TwoFactorSettings>` reads the user's 2FA state and
 * shows the right thing — enrollment when off, recovery + disable when on — so
 * there is nothing to branch on here.
 */
export function SecurityPage() {
  const { t } = useTranslation();
  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1">{t('nav.security')}</Title>
      </StackItem>
      <StackItem>
        <TwoFactorSettings />
      </StackItem>
    </Stack>
  );
}
