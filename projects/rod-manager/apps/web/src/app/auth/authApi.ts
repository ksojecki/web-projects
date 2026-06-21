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
} from '@sojecki/platform-shared';

export interface OAuthInitiateResponse {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

export async function login(input: LoginRequestBody): Promise<SessionResponse> {
  return requestJson<SessionResponse>('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function register(
  input: RegisterRequestBody,
): Promise<SessionResponse> {
  return requestJson<SessionResponse>('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    headers: {
      'Content-Type': 'application/json',
    },
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

/**
 * Store OAuth state and code verifier in session storage
 */
export function storeOAuthState(state: string, codeVerifier: string): void {
  sessionStorage.setItem(
    `oauth_${state}`,
    JSON.stringify({ state, codeVerifier, timestamp: Date.now() }),
  );
}

/**
 * Retrieve and clear OAuth state from session storage
 */
export function retrieveOAuthState(
  state: string,
): { state: string; codeVerifier: string } | null {
  const stored = sessionStorage.getItem(`oauth_${state}`);
  if (!stored) {
    return null;
  }

  sessionStorage.removeItem(`oauth_${state}`);

  try {
    const parsed = JSON.parse(stored) as {
      state: string;
      codeVerifier: string;
      timestamp: number;
    };
    // Check if state is not older than 15 minutes
    if (Date.now() - parsed.timestamp > 15 * 60 * 1000) {
      return null;
    }

    return { state: parsed.state, codeVerifier: parsed.codeVerifier };
  } catch {
    return null;
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
