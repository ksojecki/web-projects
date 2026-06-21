import type { OAuthUserInfo } from '@sojecki/platform-shared';

interface OAuthUserInfoInput {
  id: string;
  email: string;
  name?: string;
  surname?: string;
  displayName?: string;
  picture?: string;
}

/**
 * Decode JWT payload without signature verification for extracting profile claims.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length < 2 || parts[1].length === 0) {
    throw new Error('Invalid JWT payload');
  }

  const payload = parts[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const decoded = Buffer.from(padded, 'base64').toString('utf-8');

  return JSON.parse(decoded) as Record<string, unknown>;
}

export function normalizeValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildOAuthUserInfo(input: OAuthUserInfoInput): OAuthUserInfo {
  const id = input.id.trim();
  const email = input.email.trim();
  const name = (input.name ?? '').trim();
  const surname = (input.surname ?? '').trim();
  const displayName = (input.displayName ?? '').trim();

  if (id.length === 0 || email.length === 0) {
    throw new Error('OAuth provider did not return required id or email');
  }

  if (name.length > 0 || surname.length > 0) {
    return {
      id,
      email,
      name,
      surname,
      picture: input.picture,
    };
  }

  const splitName = splitDisplayName(displayName);
  return {
    id,
    email,
    name: splitName.name,
    surname: splitName.surname,
    picture: input.picture,
  };
}

function splitDisplayName(displayName: string): {
  name: string;
  surname: string;
} {
  const trimmed = displayName.trim();
  if (trimmed.length === 0) {
    return { name: '', surname: '' };
  }

  const [first, ...rest] = trimmed.split(/\s+/);
  return {
    name: first,
    surname: rest.join(' '),
  };
}
