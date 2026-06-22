import { useTranslation } from 'react-i18next';

import { Alert, Button, Content, List, ListItem, Split, SplitItem, Stack, StackItem } from '@freshost/ui';
import { CopyIcon } from '@freshost/ui/icons';

import { useAuthkit } from '../../provider';
import { AUTHKIT_NS } from '../../i18n';

export interface RecoveryCodesProps {
  codes: string[];
  /** Heading shown above the codes. Defaults to the "Recovery codes" title. */
  title?: string;
  /** When provided, renders a Done button calling this. */
  onDone?: () => void;
}

/**
 * Presents one-time recovery codes with a copy-all action and a warning that
 * they are shown only once. Purely presentational — the codes come from a
 * confirm/regenerate result or {@link useRecoveryCodes}.
 */
export function RecoveryCodes({ codes, title, onDone }: RecoveryCodesProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const { notify } = useAuthkit();

  const copyAll = () => {
    void navigator.clipboard?.writeText(codes.join('\n'));
    notify.success(t('twoFactor.recoveryCopied'));
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="h3">{title ?? t('twoFactor.recoveryTitle')}</Content>
      </StackItem>
      <StackItem>
        <Alert variant="warning" isInline isPlain title={t('twoFactor.recoveryIntro')} />
      </StackItem>
      <StackItem>
        <List isPlain>
          {codes.map((code) => (
            <ListItem key={code}>
              <code>{code}</code>
            </ListItem>
          ))}
        </List>
      </StackItem>
      <StackItem>
        <Split hasGutter>
          <SplitItem>
            <Button variant="secondary" icon={<CopyIcon />} onClick={copyAll}>
              {t('twoFactor.recoveryCopy')}
            </Button>
          </SplitItem>
          {onDone ? (
            <SplitItem>
              <Button variant="primary" onClick={onDone}>
                {t('common.close')}
              </Button>
            </SplitItem>
          ) : null}
        </Split>
      </StackItem>
    </Stack>
  );
}
