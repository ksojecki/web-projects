export interface StoredOAuthState {
  codeVerifier: string;
  state: string;
}

interface StoredOAuthStateRecord extends StoredOAuthState {
  timestamp: number;
}

const OAUTH_STATE_PREFIX = 'oauth_';
const OAUTH_STATE_MAX_AGE_MS = 15 * 60 * 1000;

export function storeOAuthState(state: string, codeVerifier: string): void {
  sessionStorage.setItem(
    `${OAUTH_STATE_PREFIX}${state}`,
    JSON.stringify({ state, codeVerifier, timestamp: Date.now() }),
  );
}

export function retrieveOAuthState(state: string): StoredOAuthState | null {
  const stored = sessionStorage.getItem(`${OAUTH_STATE_PREFIX}${state}`);

  if (stored === null) {
    return null;
  }

  sessionStorage.removeItem(`${OAUTH_STATE_PREFIX}${state}`);

  try {
    const parsed = JSON.parse(stored);

    if (!isStoredOAuthStateRecord(parsed)) {
      return null;
    }

    if (Date.now() - parsed.timestamp > OAUTH_STATE_MAX_AGE_MS) {
      return null;
    }

    return {
      state: parsed.state,
      codeVerifier: parsed.codeVerifier,
    };
  } catch {
    return null;
  }
}

function isStoredOAuthStateRecord(
  value: unknown,
): value is StoredOAuthStateRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.state === 'string' &&
    typeof value.codeVerifier === 'string' &&
    typeof value.timestamp === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
