import {
  buildLoginPromptHref as buildSharedLoginPromptHref,
  type LoginPromptConfig,
} from '@ksojecki/platform-web-platform';

export interface FrontendProductRoutes {
  account: string;
  home: string;
  recipeDetail: string;
  recipeEdit: string;
  recipeNew: string;
  register: string;
}

export interface FrontendProductAuthConfig {
  guestRedirectTo: string;
  oauthAuthenticatedFallbackTo: string;
  oauthGuestFallbackTo: string;
  postLoginRedirectTo: string;
  postRegistrationRedirectTo: string;
}

export interface FrontendProductRegistrationConfig {
  disabledRedirectTo: string;
  enabled: boolean;
}

export interface FrontendProductConfig {
  auth: FrontendProductAuthConfig;
  loginPrompt: LoginPromptConfig;
  registration: FrontendProductRegistrationConfig;
  routes: FrontendProductRoutes;
}

export const frontendProductConfig: FrontendProductConfig = {
  routes: {
    home: '/',
    account: '/account',
    recipeDetail: '/recipe/:recipeId',
    recipeEdit: '/recipe/:recipeId/edit',
    recipeNew: '/recipe/new',
    register: '/register',
  },
  auth: {
    guestRedirectTo: '/?login=1',
    postLoginRedirectTo: '/',
    postRegistrationRedirectTo: '/',
    oauthAuthenticatedFallbackTo: '/',
    oauthGuestFallbackTo: '/',
  },
  registration: {
    enabled: true,
    disabledRedirectTo: '/',
  },
  loginPrompt: {
    queryParam: 'login',
    queryValue: '1',
  },
};

export function buildLoginPromptHref(): string {
  return buildSharedLoginPromptHref(
    frontendProductConfig.routes.home,
    frontendProductConfig.loginPrompt,
  );
}

export function buildRecipeDetailPath(recipeId: string): string {
  return frontendProductConfig.routes.recipeDetail.replace(
    ':recipeId',
    recipeId,
  );
}

export function buildRecipeEditPath(recipeId: string): string {
  return frontendProductConfig.routes.recipeEdit.replace(':recipeId', recipeId);
}
