import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// The package registers its own `authkit` namespace on mount; here we only need
// the app's own strings (the `translation` namespace).
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: {
        nav: {
          primary: 'Primary navigation',
          toggle: 'Toggle navigation',
          dashboard: 'Dashboard',
          account: 'Account',
          security: 'Security',
          users: 'Users',
          changePassword: 'Change password',
          logout: 'Sign out',
          theme: 'Theme',
          themeLight: 'Light',
          themeDark: 'Dark',
          themeSystem: 'System',
        },
        home: {
          title: 'Dashboard',
          signedInAs: 'Signed in as {{email}}',
          intro: 'A live playground for goravel-authkit. Pick a card to try a feature.',
          open: 'Open',
          account: {
            title: 'Account',
            desc: 'Change your password. Other sessions are signed out on change.',
          },
          security: {
            title: 'Two-factor',
            desc: 'Enroll in TOTP 2FA, view recovery codes, or disable it.',
          },
          users: {
            title: 'Users',
            desc: 'Create, edit and delete users and reset their passwords.',
          },
        },
      },
    },
  },
});

export default i18n;
