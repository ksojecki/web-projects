import { describe, expect, it } from 'vitest';
import type {
  AuthenticationMethodStatus,
  AuthenticationMethodsResponseBody,
  OAuthCallbackQueryParams,
  OAuthCallbackRequestBody,
  OAuthCallbackResponseBody,
  OAuthInitiateRequestBody,
  LoginRequestBody,
  RegisterRequestBody,
  UpdatePasswordRequestBody,
  SessionResponse,
  OAuthProviderType,
} from './auth.dto';

describe('auth dto', () => {
  it('matches expected login payload shape', () => {
    const payload: LoginRequestBody = {
      email: 'admin@rod-manager.local',
      password: 'admin1234',
    };

    expect(payload).toEqual({
      email: 'admin@rod-manager.local',
      password: 'admin1234',
    });
  });

  it('matches expected register payload shape', () => {
    const payload: RegisterRequestBody = {
      email: 'newuser@rod-manager.local',
      name: 'New',
      surname: 'User',
      password: 'password123',
    };

    expect(payload.password).toBe('password123');
  });

  it('covers oauth provider union values', () => {
    const providers: OAuthProviderType[] = ['google', 'apple', 'facebook'];

    expect(providers).toEqual(['google', 'apple', 'facebook']);
  });

  it('covers authentication method union shapes', () => {
    const methods: AuthenticationMethodStatus[] = [
      {
        type: 'password',
        connected: false,
        canDisconnect: false,
      },
      {
        type: 'oauth',
        provider: 'google',
        connected: true,
        canDisconnect: true,
      },
    ];

    expect(methods).toEqual([
      {
        type: 'password',
        connected: false,
        canDisconnect: false,
      },
      {
        type: 'oauth',
        provider: 'google',
        connected: true,
        canDisconnect: true,
      },
    ]);
  });

  it('covers update password payload shape', () => {
    const payload: UpdatePasswordRequestBody = {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    };

    expect(payload).toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
  });

  it('covers oauth initiate payload shape', () => {
    const payload: OAuthInitiateRequestBody = {
      provider: 'google',
      codeChallenge: 'challenge-value',
      codeChallengeMethod: 'S256',
    };

    expect(payload).toEqual({
      provider: 'google',
      codeChallenge: 'challenge-value',
      codeChallengeMethod: 'S256',
    });
  });

  it('covers oauth callback query and body shapes', () => {
    const query: OAuthCallbackQueryParams = {
      code: 'callback-code',
      state: 'callback-state',
      provider: 'apple',
    };
    const body: OAuthCallbackRequestBody = {
      code: 'callback-code',
      state: 'callback-state',
    };

    expect(query).toEqual({
      code: 'callback-code',
      state: 'callback-state',
      provider: 'apple',
    });
    expect(body).toEqual({
      code: 'callback-code',
      state: 'callback-state',
    });
  });

  it('covers oauth callback response shape', () => {
    const response: OAuthCallbackResponseBody = {
      intent: 'login',
      redirectTo: '/dashboard',
      message: 'Signed in successfully',
    };

    expect(response).toEqual({
      intent: 'login',
      redirectTo: '/dashboard',
      message: 'Signed in successfully',
    });
  });

  it('covers authentication methods response envelope', () => {
    const response: AuthenticationMethodsResponseBody = {
      methods: [
        {
          type: 'password',
          connected: true,
          canDisconnect: false,
        },
        {
          type: 'oauth',
          provider: 'facebook',
          connected: false,
          canDisconnect: true,
        },
      ],
    };

    expect(response).toEqual({
      methods: [
        {
          type: 'password',
          connected: true,
          canDisconnect: false,
        },
        {
          type: 'oauth',
          provider: 'facebook',
          connected: false,
          canDisconnect: true,
        },
      ],
    });
  });

  it('matches expected session response shape', () => {
    const response: SessionResponse = {
      authenticated: true,
      user: {
        id: 'initial-admin-user',
        email: 'admin@rod-manager.local',
        name: 'Administrator',
        surname: '',
        displayName: 'Administrator',
        role: 'admin',
        preferredLanguage: 'en',
      },
    };

    expect(response.user.email).toBe('admin@rod-manager.local');
  });
});
