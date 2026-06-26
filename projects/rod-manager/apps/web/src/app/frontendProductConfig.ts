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

export interface FrontendProductLoginPromptConfig {
  queryParam: string;
  queryValue: string;
}

export interface FrontendProductConfig {
  routes: FrontendProductRoutes;
  auth: FrontendProductAuthConfig;
  registration: FrontendProductRegistrationConfig;
  loginPrompt: FrontendProductLoginPromptConfig;
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

export function isLoginPromptRequested(searchParams: URLSearchParams): boolean {
  return (
    searchParams.get(frontendProductConfig.loginPrompt.queryParam) ===
    frontendProductConfig.loginPrompt.queryValue
  );
}

export function clearLoginPrompt(
  searchParams: URLSearchParams,
): URLSearchParams {
  const nextSearchParams = new URLSearchParams(searchParams);
  nextSearchParams.delete(frontendProductConfig.loginPrompt.queryParam);
  return nextSearchParams;
}
