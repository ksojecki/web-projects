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
        footerBrowseTitle: 'Recipes',
        languageEnglish: 'EN',
        languageLabel: 'Language',
        languagePolish: 'PL',
        menuAddRecipe: 'Add recipe',
        menuHome: 'Recipes',
        menuAccount: 'Account',
        menuLogin: 'Log in',
        menuLogout: 'Log out',
        menuRegister: 'Register',
        sessionLoading: 'Checking session',
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
        authentication: {
          title: 'Authentication methods',
          description:
            'Manage how you sign in to your account. At least one authentication method must remain connected.',
          loadError: 'Failed to load authentication methods.',
          linkStartError: 'Failed to start authentication method linking.',
          unlinkError: 'Failed to disconnect authentication method.',
          connected: 'Connected',
          notConnected: 'Not connected',
          passwordLabel: 'Password',
          passwordCannotBeDisabled:
            'Password authentication can be changed, but it cannot be disabled after it is set.',
          setPasswordTitle: 'Set password',
          setPasswordDescription:
            'Add a local password so you can sign in without an external provider.',
          changePasswordTitle: 'Change password',
          changePasswordDescription:
            'Update your local password for password-based sign in.',
          currentPasswordLabel: 'Current password',
          newPasswordLabel: 'New password',
          confirmPasswordLabel: 'Confirm new password',
          setPasswordAction: 'Set password',
          changePasswordAction: 'Change password',
          savingPasswordAction: 'Saving password...',
          cancelAction: 'Cancel',
          connectAction: 'Connect',
          connectingAction: 'Connecting...',
          disconnectAction: 'Disconnect',
          disconnectingAction: 'Disconnecting...',
          requiredAction: 'Required',
          lastMethodHint:
            'This method cannot be disconnected because it is currently the only active sign-in method.',
          passwordConnected: 'Password authentication has been enabled.',
          passwordChanged: 'Password has been updated.',
          oauthDisconnected: '{{provider}} has been disconnected.',
        },
        password: {
          currentRequired: 'Current password is required.',
          newMinLength: 'New password must be at least 8 characters long.',
          confirmRequired: 'Password confirmation is required.',
          confirmMismatch: 'Password confirmation must match the new password.',
        },
      },
      recipes: {
        actions: {
          add: 'Add recipe',
          back: 'Back',
          cancel: 'Cancel',
          clear: 'Clear',
          delete: 'Delete',
          edit: 'Edit',
          save: 'Save',
          saving: 'Saving...',
        },
        authRequired: {
          action: 'Log in to continue',
          description:
            'Recipe pages now use the shared platform session. Sign in to browse and edit recipes.',
          hint: 'Use your existing account to open the full recipe workspace.',
          title: 'Authentication required',
        },
        detail: {
          currentYieldLabel: 'Current yield',
          defaultYield: 'Base recipe: {{weight}} g',
          description:
            'Adjust the target batch size and follow linked sub-recipes from the same page.',
          ingredientRecipe: 'Recipe reference: {{recipeId}}',
          ingredientsCount: '{{count}} ingredients',
          ingredientsDescription:
            'Amounts update automatically when you change the target yield.',
          ingredients: 'Ingredients',
          invalidTitle: 'Recipe unavailable',
          loadingDescription:
            'Preparing the recipe workspace and checking your current session.',
          loadingHint: 'Fetching recipe details and recalculating ingredients.',
          missingRecipeId: 'Missing recipe identifier.',
          newWeight: 'New weight',
          notFound: 'Recipe not found.',
          pieces: 'pieces',
          recipeIdLabel: 'Recipe id',
          scalingDescription:
            'Enter a target amount in grams or pieces to recalculate ingredient quantities.',
          scalingTitle: 'Scale recipe',
          title: '{{name}}',
        },
        errors: {
          invalidNumber: 'Enter a valid number.',
          loadFailed: 'Could not load recipes.',
          missingFields: 'Fill in the required recipe fields.',
          submitFailed: 'Could not save the recipe.',
        },
        form: {
          addIngredient: 'Add ingredient',
          amount: 'Amount',
          defaultWeight: 'Default weight',
          description:
            'Keep the recipe id stable and describe ingredients the same way they are used during production.',
          detailsDescription:
            'Define the recipe name, stable identifier, and base yield used for recalculation.',
          detailsTitle: 'Recipe details',
          emptyIngredients: 'Add at least one ingredient.',
          ingredientCardTitle: 'Ingredient',
          ingredientName: 'Ingredient name',
          ingredientRecipeId: 'Referenced recipe id',
          ingredientsDescription:
            'List all ingredients in production order and optionally connect them to another recipe.',
          ingredients: 'Ingredients',
          loadingDescription:
            'Opening the recipe editor and loading the latest saved values.',
          loadingHint: 'Preparing editable recipe data.',
          name: 'Recipe name',
          recipeId: 'Recipe id',
          removeIngredient: 'Remove ingredient',
          titleEdit: 'Edit recipe',
          titleNew: 'New recipe',
          unit: 'Unit',
        },
        list: {
          count: '{{count}} recipes',
          description:
            'Browse saved recipes, open details, and jump into editing from a single consistent workspace.',
          empty: 'No recipes match this search.',
          emptyHint:
            'Try a broader phrase or add a new recipe to start the collection.',
          emptyTitle: 'No matching recipes',
          loadingDescription:
            'Preparing the recipe catalog and confirming your current session.',
          loadingHint: 'Loading recipe list and search index.',
          openRecipe: 'Open recipe details',
          search: 'Search recipes',
          searchHint:
            'Search by recipe name or identifier. Results update as you type.',
          searchTitle: 'Find recipe',
          title: 'Recipes',
        },
      },
      loading: 'Loading recipes...',
      units: {
        g: 'g',
        ml: 'ml',
        pcs: 'pcs',
      },
    },
  },
});

export default i18n;
