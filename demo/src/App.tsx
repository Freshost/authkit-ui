import { Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import { Button, Content, PageSection, Stack, StackItem } from '@freshost/ui';
import { AccountPage, AuthGuard, LoginPage, UsersPage, useLogout, useMe } from '@freshost/authkit-ui';

import { SecurityPage } from './pages/SecurityPage';

function HomePage() {
  const { t } = useTranslation();
  const me = useMe();
  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="h1">{t('home.title')}</Content>
      </StackItem>
      {me.data ? (
        <StackItem>
          <Content component="p">
            {t('home.signedInAs', { email: me.data.email, role: me.data.role })}
          </Content>
        </StackItem>
      ) : null}
      <StackItem>
        <Content component="p">{t('home.intro')}</Content>
      </StackItem>
    </Stack>
  );
}

function Shell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();

  const linkStyle = { display: 'block', padding: '6px 0', textDecoration: 'none' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 200, padding: 24, borderRight: '1px solid var(--pf-t--global--border--color--default)' }}>
        <Content component="h3">Authkit Demo</Content>
        <Link to="/" style={linkStyle}>{t('nav.home')}</Link>
        <Link to="/account" style={linkStyle}>{t('nav.account')}</Link>
        <Link to="/security" style={linkStyle}>{t('nav.security')}</Link>
        <Link to="/users" style={linkStyle}>{t('nav.users')}</Link>
        <div style={{ marginTop: 16 }}>
          <Button
            variant="secondary"
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
          >
            {t('nav.logout')}
          </Button>
        </div>
      </nav>
      <main style={{ flex: 1 }}>
        <PageSection>
          <Outlet />
        </PageSection>
      </main>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <AuthGuard>
            <Shell />
          </AuthGuard>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
