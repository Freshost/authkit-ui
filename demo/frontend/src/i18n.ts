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
        nav: { home: 'Home', account: 'Account', security: 'Security', users: 'Users', logout: 'Sign out' },
        home: {
          title: 'Authkit demo',
          signedInAs: 'Signed in as {{email}} ({{role}})',
          intro: 'Use the menu to try every authkit feature: change password, two-factor, and user management.',
        },
      },
    },
  },
});

export default i18n;
