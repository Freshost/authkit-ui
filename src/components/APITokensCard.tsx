import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActionGroup,
  Alert,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  Content,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Table,
  Tbody,
  Td,
  TextInput,
  Th,
  Thead,
  Tr,
} from '@freshost/ui';

import type { APITokenResponse, IssuedAPITokenResponse } from '../api/types';
import {
  useAPITokens,
  useCreateAPIToken,
  useRevokeAllAPITokens,
  useRevokeAPIToken,
} from '../hooks/useAPITokens';
import { useMe } from '../hooks/useAuth';
import { useAuthkitConfig } from '../hooks/useConfig';
import { AUTHKIT_NS } from '../i18n';
import { useAuthkit } from '../provider';
import { codeFrom, messageFrom } from '../utils';

function dateInputValue(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function APITokensCard() {
  const { t } = useTranslation(AUTHKIT_NS);
  const { notify } = useAuthkit();
  const meta = useAuthkitConfig().data?.apiTokens;
  const me = useMe().data;
  const tokens = useAPITokens();
  const create = useCreateAPIToken();
  const revoke = useRevokeAPIToken();
  const revokeAll = useRevokeAllAPITokens();
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<IssuedAPITokenResponse | null>(null);
  const [revoking, setRevoking] = useState<APITokenResponse | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [name, setName] = useState('');
  const [expires, setExpires] = useState(() => dateInputValue(meta?.defaultLifetimeDays ?? 30));
  const [scopes, setScopes] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  const maxDate = useMemo(
    () => dateInputValue(meta?.maxLifetimeDays ?? 365),
    [meta?.maxLifetimeDays],
  );
  const active = (tokens.data ?? []).filter(
    (token) => new Date(token.expiresAt).getTime() > Date.now(),
  );

  const resetCreate = () => {
    setName('');
    setExpires(dateInputValue(meta?.defaultLifetimeDays ?? 30));
    setScopes([]);
    setPassword('');
    setTwoFactorCode('');
    setClientError(null);
    create.reset();
  };

  const closeCreate = () => {
    setCreating(false);
    resetCreate();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setClientError(null);
    const expiresAt = new Date(`${expires}T23:59:59Z`);
    if (!name.trim() || Number.isNaN(expiresAt.getTime())) {
      setClientError(t('apiTokens.invalidForm'));
      return;
    }
    create.mutate(
      {
        name,
        expiresAt: expiresAt.toISOString(),
        scopes,
        password,
        twoFactorCode: twoFactorCode || undefined,
      },
      {
        onSuccess: (result) => {
          setCreating(false);
          resetCreate();
          setIssued(result);
        },
      },
    );
  };

  const createError = create.isError
    ? codeFrom(create.error) === 'wrong_password'
      ? t('account.wrongPassword')
      : messageFrom(create.error, t('apiTokens.error'))
    : null;

  const copyToken = () => {
    if (!issued) return;
    void navigator.clipboard?.writeText(issued.token);
    notify.success(t('apiTokens.copied'));
  };

  return (
    <>
      <Card>
        <CardTitle>
          <Split hasGutter>
            <SplitItem isFilled>{t('apiTokens.title')}</SplitItem>
            <SplitItem>
              <Button onClick={() => setCreating(true)}>{t('apiTokens.create')}</Button>
            </SplitItem>
            {active.length > 1 ? (
              <SplitItem>
                <Button variant="secondary" isDanger onClick={() => setRevokingAll(true)}>
                  {t('apiTokens.revokeAll')}
                </Button>
              </SplitItem>
            ) : null}
          </Split>
        </CardTitle>
        <CardBody>
          {tokens.isLoading ? (
            <Bullseye>
              <Spinner aria-label={t('common.loading')} />
            </Bullseye>
          ) : !tokens.data?.length ? (
            <Content component="p">{t('apiTokens.empty')}</Content>
          ) : (
            <Table aria-label={t('apiTokens.title')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('apiTokens.name')}</Th>
                  <Th>{t('apiTokens.scopes')}</Th>
                  <Th>{t('apiTokens.expires')}</Th>
                  <Th>{t('apiTokens.lastUsed')}</Th>
                  <Th screenReaderText={t('sessions.actions')} />
                </Tr>
              </Thead>
              <Tbody>
                {tokens.data.map((token) => (
                  <Tr key={token.id}>
                    <Td dataLabel={t('apiTokens.name')}>{token.name}</Td>
                    <Td dataLabel={t('apiTokens.scopes')}>
                      {token.scopes.length
                        ? token.scopes.map((scope) => (
                            <Label key={scope} isCompact>
                              {scope}
                            </Label>
                          ))
                        : t('apiTokens.noScopes')}
                    </Td>
                    <Td dataLabel={t('apiTokens.expires')}>{formatDate(token.expiresAt)}</Td>
                    <Td dataLabel={t('apiTokens.lastUsed')}>{formatDate(token.lastUsedAt)}</Td>
                    <Td isActionCell>
                      <Button variant="link" isDanger isInline onClick={() => setRevoking(token)}>
                        {t('apiTokens.revoke')}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {creating ? (
        <Modal variant="small" isOpen onClose={closeCreate} aria-label={t('apiTokens.createTitle')}>
          <ModalHeader title={t('apiTokens.createTitle')} />
          <ModalBody>
            <Form onSubmit={submit}>
              {clientError ?? createError ? (
                <Alert variant="danger" isInline title={clientError ?? createError ?? ''} />
              ) : null}
              <FormGroup label={t('apiTokens.name')} isRequired fieldId="authkit-token-name">
                <TextInput id="authkit-token-name" value={name} onChange={(_e, value) => setName(value)} isRequired />
              </FormGroup>
              <FormGroup label={t('apiTokens.expires')} isRequired fieldId="authkit-token-expiry">
                <TextInput id="authkit-token-expiry" type="date" value={expires} max={maxDate} onChange={(_e, value) => setExpires(value)} isRequired />
              </FormGroup>
              {meta?.allowedScopes.length ? (
                <FormGroup label={t('apiTokens.scopes')} fieldId="authkit-token-scopes">
                  <Stack>
                    {meta.allowedScopes.map((scope) => (
                      <StackItem key={scope}>
                        <Checkbox id={`authkit-token-scope-${scope}`} label={scope} isChecked={scopes.includes(scope)} onChange={(_e, checked) => setScopes((current) => checked ? [...current, scope] : current.filter((value) => value !== scope))} />
                      </StackItem>
                    ))}
                  </Stack>
                </FormGroup>
              ) : null}
              <FormGroup label={t('account.currentPasswordLabel')} isRequired fieldId="authkit-token-password">
                <TextInput id="authkit-token-password" type="password" value={password} onChange={(_e, value) => setPassword(value)} autoComplete="current-password" isRequired />
              </FormGroup>
              {me?.twoFactorEnabled ? <FormGroup label={t('twoFactor.codeLabel')} isRequired fieldId="authkit-token-2fa"><TextInput id="authkit-token-2fa" value={twoFactorCode} onChange={(_e, value) => setTwoFactorCode(value)} inputMode="numeric" autoComplete="one-time-code" isRequired /></FormGroup> : null}
              <ActionGroup><Button type="submit" isLoading={create.isPending} isDisabled={create.isPending}>{t('apiTokens.create')}</Button><Button variant="link" onClick={closeCreate}>{t('common.cancel')}</Button></ActionGroup>
            </Form>
          </ModalBody>
        </Modal>
      ) : null}

      {issued ? (
        <Modal variant="medium" isOpen onClose={() => setIssued(null)} aria-label={t('apiTokens.createdTitle')}>
          <ModalHeader title={t('apiTokens.createdTitle')} />
          <ModalBody><Stack hasGutter><StackItem><Alert variant="warning" isInline title={t('apiTokens.shownOnce')} /></StackItem><StackItem><Content component="pre">{issued.token}</Content></StackItem></Stack></ModalBody>
          <ModalFooter><Button onClick={copyToken}>{t('apiTokens.copy')}</Button><Button variant="link" onClick={() => setIssued(null)}>{t('common.close')}</Button></ModalFooter>
        </Modal>
      ) : null}

      {revoking ? (
        <Modal variant="small" isOpen onClose={() => setRevoking(null)} aria-label={t('apiTokens.revokeTitle', { name: revoking.name })}>
          <ModalHeader title={t('apiTokens.revokeTitle', { name: revoking.name })} titleIconVariant="warning" />
          <ModalBody><Content component="p">{t('apiTokens.revokeBody')}</Content></ModalBody>
          <ModalFooter><Button variant="danger" isLoading={revoke.isPending} onClick={() => revoke.mutate(revoking.id, { onSuccess: () => setRevoking(null) })}>{t('apiTokens.revoke')}</Button><Button variant="link" onClick={() => setRevoking(null)}>{t('common.cancel')}</Button></ModalFooter>
        </Modal>
      ) : null}

      {revokingAll ? (
        <Modal variant="small" isOpen onClose={() => setRevokingAll(false)} aria-label={t('apiTokens.revokeAllTitle')}>
          <ModalHeader title={t('apiTokens.revokeAllTitle')} titleIconVariant="warning" />
          <ModalBody><Content component="p">{t('apiTokens.revokeAllBody')}</Content></ModalBody>
          <ModalFooter><Button variant="danger" isLoading={revokeAll.isPending} onClick={() => revokeAll.mutate(undefined, { onSuccess: () => setRevokingAll(false) })}>{t('apiTokens.revokeAll')}</Button><Button variant="link" onClick={() => setRevokingAll(false)}>{t('common.cancel')}</Button></ModalFooter>
        </Modal>
      ) : null}
    </>
  );
}
