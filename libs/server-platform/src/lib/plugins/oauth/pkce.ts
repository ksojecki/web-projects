import { createHash, randomBytes } from 'node:crypto';

const PKCE_CODE_LENGTH = 32;

/**
 * Generate PKCE code verifier and challenge.
 */
export function generatePKCE(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  return { codeVerifier, codeChallenge };
}

/**
 * Generate PKCE code challenge from code verifier (SHA256).
 */
function generateCodeChallenge(codeVerifier: string): string {
  const hash = createHash('sha256');
  hash.update(codeVerifier);

  return hash.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Create a random code verifier for PKCE.
 */
function generateCodeVerifier(): string {
  return randomBytes(PKCE_CODE_LENGTH)
    .toString('base64')
    .replace(/[^a-zA-Z0-9_-]/g, '');
}
