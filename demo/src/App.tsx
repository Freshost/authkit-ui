import { Navigate, Outlet, Route, Routes } from 'react-router';

import { AccountPage, AdminLoginsPage, AuthGuard, LoginPage, UsersPage } from '@freshost/authkit-ui';

import { AppShell } from './components/AppShell';
import { ThemeToggle } from './components/ThemeToggle';
import { DashboardPage } from './pages/DashboardPage';
import { SecurityPage } from './pages/SecurityPage';

/**
 * The package LoginPage fills the viewport and has no masthead, so float the
 * theme toggle in the top-right corner over it.
 */
function LoginScreen() {
  return (
    <>
      <div style={{ position: 'fixed', top: 'var(--pf-t--global--spacer--md)', right: 'var(--pf-t--global--spacer--md)', zIndex: 9999 }}>
        <ThemeToggle />
      </div>
      <LoginPage {...((import.meta as any).env?.DEV ? { initialEmail: 'admin@demo.test', initialPassword: 'password123' } : {})} />
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route
        element={
          <AuthGuard>
            <AppShell>
              <Outlet />
            </AppShell>
          </AuthGuard>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/sign-ins" element={<AdminLoginsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
