import type {
  AuthenticationMethodsResponseBody,
  LoginRequestBody,
  OAuthCallbackRequestBody,
  OAuthCallbackResponseBody,
  OAuthProviderType,
  RegisterRequestBody,
  SessionResponse,
  UpdatePasswordRequestBody,
} from '@ksojecki/platform-shared';
import { JSON_HEADERS, requestJson, requestNoContent } from '../http';

export interface OAuthInitiateResponse {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export async function login(input: LoginRequestBody): Promise<SessionResponse> {
  return requestJson<SessionResponse>('/api/auth/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export async function register(
  input: RegisterRequestBody,
): Promise<SessionResponse> {
  return requestJson<SessionResponse>('/api/auth/register', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export async function initiateOAuth(
  provider: OAuthProviderType,
): Promise<OAuthInitiateResponse> {
  return requestJson<OAuthInitiateResponse>(
    `/api/auth/oauth/authorize/${provider}`,
    {
      method: 'POST',
    },
  );
}

export async function linkOAuthProvider(
  provider: OAuthProviderType,
): Promise<OAuthInitiateResponse> {
  return requestJson<OAuthInitiateResponse>(
    `/api/auth/oauth/link/${provider}`,
    {
      method: 'POST',
    },
  );
}

export async function completeOAuthCallback(
  provider: OAuthProviderType,
  input: OAuthCallbackRequestBody,
): Promise<OAuthCallbackResponseBody> {
  return requestJson<OAuthCallbackResponseBody>(
    `/api/auth/oauth/callback/${provider}`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    },
  );
}

export async function loadAuthenticationMethods(): Promise<AuthenticationMethodsResponseBody> {
  return requestJson<AuthenticationMethodsResponseBody>('/api/auth/methods', {
    method: 'GET',
  });
}

export async function updatePassword(
  input: UpdatePasswordRequestBody,
): Promise<void> {
  await requestNoContent('/api/auth/password', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}

export async function unlinkOAuthProvider(
  provider: OAuthProviderType,
): Promise<void> {
  await requestNoContent(`/api/auth/oauth/link/${provider}`, {
    method: 'DELETE',
  });
}

export async function loadSession(): Promise<SessionResponse> {
  return requestJson<SessionResponse>('/api/auth/session', {
    method: 'GET',
  });
}

export async function logout(): Promise<void> {
  await requestNoContent('/api/auth/logout', {
    method: 'POST',
  });
}
