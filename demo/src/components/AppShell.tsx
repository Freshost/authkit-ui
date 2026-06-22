import { useState, type ComponentType, type ReactNode, type Ref } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  Content,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  Nav,
  NavItem,
  NavList,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  type MenuToggleElement,
} from '@freshost/ui';
import {
  BarsIcon,
  CogIcon,
  DesktopIcon,
  HomeIcon,
  KeyIcon,
  MoonIcon,
  SecurityIcon,
  SignOutAltIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
  type SVGIconProps,
} from '@freshost/ui/icons';
import { useLogout, useMe } from '@freshost/authkit-ui';

import { getStoredTheme, setStoredTheme, type ThemeMode } from '../theme';

interface NavItemDef {
  href: string;
  labelKey: string;
  icon: ComponentType<SVGIconProps>;
  match?: (pathname: string) => boolean;
}

const NAV: NavItemDef[] = [
  { href: '/', labelKey: 'nav.dashboard', icon: HomeIcon, match: (p) => p === '/' },
  { href: '/account', labelKey: 'nav.account', icon: KeyIcon },
  { href: '/security', labelKey: 'nav.security', icon: SecurityIcon },
  { href: '/users', labelKey: 'nav.users', icon: UsersIcon },
];

function isActive(item: NavItemDef, pathname: string): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

/**
 * PatternFly v6 application shell: `Page` + `Masthead` (toggle / brand / theme +
 * user menus) + `PageSidebar` vertical `Nav`, with content in a filled
 * `PageSection`. Mirrors the freshproxy / dns-console shells.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const me = useMe();

  const masthead = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton variant="plain" aria-label={t('nav.toggle')}>
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo component={(props) => <Link {...props} to="/" />}>
            <Content component="p">
              <b>Authkit</b> Demo
            </Content>
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar isFullHeight isStatic>
          <ToolbarContent>
            <ToolbarGroup align={{ default: 'alignEnd' }} gap={{ default: 'gapSm' }}>
              <ToolbarItem>
                <ThemeMenu />
              </ToolbarItem>
              <ToolbarItem>
                <UserMenu
                  label={me.data?.name || me.data?.email || ''}
                  email={me.data?.email ?? ''}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <Nav aria-label={t('nav.primary')}>
          <NavList>
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavItem key={item.href} isActive={isActive(item, pathname)}>
                  <Link to={item.href}>
                    <Flex
                      alignItems={{ default: 'alignItemsCenter' }}
                      gap={{ default: 'gapSm' }}
                      flexWrap={{ default: 'nowrap' }}
                    >
                      <FlexItem>
                        <Icon aria-hidden />
                      </FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}>{t(item.labelKey)}</FlexItem>
                    </Flex>
                  </Link>
                </NavItem>
              );
            })}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page masthead={masthead} sidebar={sidebar} isManagedSidebar isContentFilled>
      <PageSection isFilled hasOverflowScroll aria-label={t('nav.primary')}>
        {children}
      </PageSection>
    </Page>
  );
}

function ThemeMenu() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);
  const [isOpen, setIsOpen] = useState(false);

  const choose = (next: ThemeMode) => {
    setMode(next);
    setStoredTheme(next);
    setIsOpen(false);
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          aria-label={t('nav.theme')}
          isExpanded={isOpen}
          onClick={() => setIsOpen((o) => !o)}
          icon={mode === 'dark' ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
        />
      )}
    >
      <DropdownList>
        <DropdownItem icon={<SunIcon />} onClick={() => choose('light')}>
          {t('nav.themeLight')}
        </DropdownItem>
        <DropdownItem icon={<MoonIcon />} onClick={() => choose('dark')}>
          {t('nav.themeDark')}
        </DropdownItem>
        <DropdownItem icon={<DesktopIcon />} onClick={() => choose('system')}>
          {t('nav.themeSystem')}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

function UserMenu({ label, email }: { label: string; email: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={() => setIsOpen(false)}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          onClick={() => setIsOpen((o) => !o)}
          icon={<UserIcon aria-hidden />}
        >
          {label}
        </MenuToggle>
      )}
    >
      <DropdownGroup label={email}>
        <DropdownList>
          <DropdownItem icon={<CogIcon />} onClick={() => navigate('/account')}>
            {t('nav.accountSettings')}
          </DropdownItem>
          <DropdownItem
            icon={<SignOutAltIcon />}
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
          >
            {t('nav.logout')}
          </DropdownItem>
        </DropdownList>
      </DropdownGroup>
    </Dropdown>
  );
}
