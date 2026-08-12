import type { ComponentType } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Gallery,
  Label,
  Stack,
  StackItem,
  Title,
} from '@freshost/ui';
import {
  ArrowRightIcon,
  KeyIcon,
  SecurityIcon,
  UsersIcon,
  type SVGIconProps,
} from '@freshost/ui/icons';
import { AdminLoginsCard, useMe } from '@freshost/authkit-ui';

interface Feature {
  to: string;
  icon: ComponentType<SVGIconProps>;
  titleKey: string;
  descKey: string;
}

const FEATURES: Feature[] = [
  { to: '/account', icon: KeyIcon, titleKey: 'home.account.title', descKey: 'home.account.desc' },
  { to: '/security', icon: SecurityIcon, titleKey: 'home.security.title', descKey: 'home.security.desc' },
  { to: '/users', icon: UsersIcon, titleKey: 'home.users.title', descKey: 'home.users.desc' },
];

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const me = useMe();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1">{t('home.title')}</Title>
      </StackItem>
      {me.data ? (
        <StackItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Content component="p">{t('home.signedInAs', { email: me.data.email })}</Content>
            </FlexItem>
            <FlexItem>
              <Label color="green">{me.data.role}</Label>
            </FlexItem>
          </Flex>
        </StackItem>
      ) : null}
      <StackItem>
        <Content component="p">{t('home.intro')}</Content>
      </StackItem>
      <StackItem>
        <Gallery hasGutter minWidths={{ default: '100%', sm: '260px' }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.to} isFullHeight>
                <CardTitle>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    <FlexItem>
                      <Icon aria-hidden />
                    </FlexItem>
                    <FlexItem>{t(f.titleKey)}</FlexItem>
                  </Flex>
                </CardTitle>
                <CardBody>{t(f.descKey)}</CardBody>
                <CardFooter>
                  <Button
                    variant="secondary"
                    icon={<ArrowRightIcon />}
                    iconPosition="right"
                    onClick={() => navigate(f.to)}
                  >
                    {t('home.open')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </Gallery>
      </StackItem>
      <StackItem>
        <AdminLoginsCard limit={5} onViewAll={() => navigate('/sign-ins')} />
      </StackItem>
    </Stack>
  );
}
