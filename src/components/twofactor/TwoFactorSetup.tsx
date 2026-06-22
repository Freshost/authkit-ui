import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

import {
  ActionGroup,
  Alert,
  Bullseye,
  Button,
  Content,
  Form,
  FormGroup,
  Stack,
  StackItem,
  TextInput,
} from '@freshost/ui';

import type { TwoFactorEnrollmentResponse } from '../../api/types';
import { useConfirmTwoFactor, useEnableTwoFactor } from '../../hooks/useTwoFactor';
import { AUTHKIT_NS } from '../../i18n';
import { RecoveryCodes } from './RecoveryCodes';

export interface TwoFactorSetupProps {
  /** Called after enrollment is confirmed; receives the new recovery codes. */
  onEnabled?: (recoveryCodes: string[]) => void;
  /** Called when the user dismisses the recovery codes (enrollment fully done). */
  onFinished?: () => void;
  /** When provided, renders a Cancel button on the initial step (e.g. in a modal). */
  onCancel?: () => void;
}

/**
 * Self-contained enrollment flow: start → scan QR / enter secret → confirm code
 * → show one-time recovery codes. Every step is dismissable: the QR step has a
 * "Start over" action and the recovery-codes step a "Done" action.
 */
export function TwoFactorSetup({ onEnabled, onFinished, onCancel }: TwoFactorSetupProps) {
  const { t } = useTranslation(AUTHKIT_NS);
  const enable = useEnableTwoFactor();
  const confirm = useConfirmTwoFactor();

  const [enrollment, setEnrollment] = useState<TwoFactorEnrollmentResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState('');

  const reset = () => {
    setEnrollment(null);
    setRecoveryCodes(null);
    setCode('');
  };

  const start = () => enable.mutate(undefined, { onSuccess: setEnrollment });

  const submitConfirm = (event: FormEvent) => {
    event.preventDefault();
    confirm.mutate(
      { code },
      {
        onSuccess: (res) => {
          setRecoveryCodes(res.recoveryCodes);
          onEnabled?.(res.recoveryCodes);
        },
      },
    );
  };

  if (recoveryCodes) {
    return (
      <RecoveryCodes
        codes={recoveryCodes}
        title={t('twoFactor.enabledTitle')}
        onDone={() => {
          reset();
          onFinished?.();
        }}
      />
    );
  }

  if (!enrollment) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Content component="p">{t('twoFactor.setupIntro')}</Content>
        </StackItem>
        <StackItem>
          <Button onClick={start} isLoading={enable.isPending} isDisabled={enable.isPending}>
            {t('twoFactor.setupTitle')}
          </Button>{' '}
          {onCancel ? (
            <Button variant="link" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          ) : null}
        </StackItem>
      </Stack>
    );
  }

  return (
    <Form onSubmit={submitConfirm}>
      <Content component="p">{t('twoFactor.setupIntro')}</Content>
      <Bullseye>
        <QRCodeSVG value={enrollment.otpauthUrl} size={180} />
      </Bullseye>
      <Content component="small">
        {t('twoFactor.cantScan')} <code>{enrollment.secret}</code>
      </Content>
      {confirm.isError ? (
        <Alert variant="danger" isInline title={t('twoFactor.invalidCode')} />
      ) : null}
      <FormGroup label={t('twoFactor.confirmCodeLabel')} isRequired fieldId="authkit-2fa-confirm">
        <TextInput
          id="authkit-2fa-confirm"
          value={code}
          onChange={(_event, v) => setCode(v)}
          isRequired
          autoComplete="one-time-code"
          autoFocus
        />
      </FormGroup>
      <ActionGroup>
        <Button
          type="submit"
          isLoading={confirm.isPending}
          isDisabled={confirm.isPending || code.length === 0}
        >
          {confirm.isPending ? t('twoFactor.confirming') : t('twoFactor.confirm')}
        </Button>
        {/* Always dismissable: back out of the QR step. */}
        <Button variant="link" onClick={reset} isDisabled={confirm.isPending}>
          {t('common.cancel')}
        </Button>
      </ActionGroup>
    </Form>
  );
}
