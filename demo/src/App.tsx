import { Navigate, Outlet, Route, Routes } from 'react-router';

import { AccountPage, AuthGuard, LoginPage, UsersPage } from '@freshost/authkit-ui';

import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { SecurityPage } from './pages/SecurityPage';

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage initialEmail="admin@demo.test" initialPassword="password123" />}
      />
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
