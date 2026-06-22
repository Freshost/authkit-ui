import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router';

import { AuthkitProvider } from '@freshost/authkit-ui';
import '@freshost/ui/styles.css';

import { App } from './App';
import i18n from './i18n';
import { Toasts, notifyAdapter } from './notify';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <AuthkitProvider
            baseURL="/api/v1"
            notify={notifyAdapter}
            branding={{ appName: 'Authkit Demo', subtitle: 'Try every authkit feature' }}
            routes={{ login: '/login', home: '/', account: '/account' }}
          >
            <App />
            <Toasts />
          </AuthkitProvider>
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
