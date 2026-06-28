import {
  buildLoginPromptHref as buildSharedLoginPromptHref,
  type LoginPromptConfig,
} from '@ksojecki/platform-web-platform';

export interface FrontendProductRoutes {
  home: string;
  account: string;
  contentManagement: string;
  register: string;
}

export interface FrontendProductAuthConfig {
  guestRedirectTo: string;
  postLoginRedirectTo: string;
  postRegistrationRedirectTo: string;
  oauthAuthenticatedFallbackTo: string;
  oauthGuestFallbackTo: string;
}

export interface FrontendProductRegistrationConfig {
  enabled: boolean;
  disabledRedirectTo: string;
}

export interface FrontendProductConfig {
  routes: FrontendProductRoutes;
  auth: FrontendProductAuthConfig;
  registration: FrontendProductRegistrationConfig;
  loginPrompt: LoginPromptConfig;
}

export const frontendProductConfig: FrontendProductConfig = {
  routes: {
    home: '/',
    account: '/account',
    contentManagement: '/pages',
    register: '/register',
  },
  auth: {
    guestRedirectTo: '/?login=1',
    postLoginRedirectTo: '/account',
    postRegistrationRedirectTo: '/account',
    oauthAuthenticatedFallbackTo: '/account',
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
