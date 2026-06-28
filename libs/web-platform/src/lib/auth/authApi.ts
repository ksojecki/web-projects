import type {
  AuthenticationMethodsResponseBody,
  ApiErrorResponse,
  LoginRequestBody,
  OAuthCallbackRequestBody,
  OAuthCallbackResponseBody,
  OAuthProviderType,
  RegisterRequestBody,
  SessionResponse,
  UpdatePasswordRequestBody,
} from '@ksojecki/platform-shared';

export interface OAuthInitiateResponse {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

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
  const response = await fetch('/api/auth/password', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function unlinkOAuthProvider(
  provider: OAuthProviderType,
): Promise<void> {
  const response = await fetch(`/api/auth/oauth/link/${provider}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function loadSession(): Promise<SessionResponse> {
  return requestJson<SessionResponse>('/api/auth/session', {
    method: 'GET',
  });
}

export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await parseErrorMessage(response));
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const error = (await response.json()) as ApiErrorResponse;

    if (error.message.length > 0) {
      return error.message;
    }
  } catch {
    return 'Unexpected server error.';
  }

  return 'Unexpected server error.';
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
}
