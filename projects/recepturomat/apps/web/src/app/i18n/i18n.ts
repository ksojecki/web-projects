import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      layout: {
        appName: 'Recepturomat',
        menuHome: 'Home',
        menuAccount: 'Account',
        menuLogin: 'Log in',
        menuLogout: 'Log out',
        menuRegister: 'Register',
        footerText: 'Recepturomat',
      },
      auth: {
        or: 'or',
        title: 'Log in',
        hint: 'Use a local account or continue with OAuth.',
        emailLabel: 'Email',
        emailRequired: 'Email is required.',
        emailInvalid: 'Enter a valid email address.',
        passwordLabel: 'Password',
        passwordRequired: 'Password is required.',
        submit: 'Sign in',
        submitting: 'Signing in...',
        checkingSession: 'Checking session...',
        unexpectedError: 'Unexpected server error.',
        validationRequired: 'is required.',
        oauthDivider: 'or continue with',
        noAccount: "Don't have an account?",
        registerLink: 'Register',
        register: {
          title: 'Create account',
          passwordSectionTitle: 'Create account with password',
          passwordSectionHint:
            'Create a local account with your name, email, and password.',
          oauthSectionTitle: 'Create account with OAuth',
          oauthSectionHint:
            'Use your provider profile details to create an account.',
          oauthDivider: 'or continue with',
          nameLabel: 'First name',
          nameRequired: 'First name is required.',
          surnameLabel: 'Last name',
          surnameRequired: 'Last name is required.',
          emailLabel: 'Email',
          emailRequired: 'Email is required.',
          emailInvalid: 'Enter a valid email address.',
          passwordLabel: 'Password',
          passwordHint:
            'Required for account creation with email and password.',
          passwordMinLength: 'Password must be at least 8 characters.',
          submit: 'Create account',
          submitting: 'Creating account...',
          alreadyHaveAccount: 'Already have an account?',
          loginLink: 'Log in',
        },
      },
      home: {
        badge: 'Generated project',
        title: 'Recepturomat',
        description:
          'This starter product wires the shared backend and frontend platform libraries into a minimal product-local shell. Extend routes, branding, and sections here without copying auth shell code.',
        signedInCta: 'Open account',
        signedOutCta: 'Log in',
        registerCta: 'Register',
        authStateTitle: 'Current auth state',
        authenticatedState: 'Signed in as {{email}}.',
        guestState: 'Guest session.',
      },
      account: {
        title: 'Recepturomat account',
        welcome: 'Welcome back, {{name}}.',
        fallbackUserName: 'user',
        roleLabel: 'Role',
      },
    },
  },
});
