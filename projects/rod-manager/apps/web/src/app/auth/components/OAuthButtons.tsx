import type { OAuthProviderType } from '@sojecki/platform-shared';
import { FaApple, FaFacebook, FaGoogle } from 'react-icons/fa';

interface OAuthButtonsProps {
  onProvider: (provider: OAuthProviderType) => void;
}

/**
 * Shared OAuth provider buttons. Calls onProvider with the selected provider name.
 */
export function OAuthButtons({ onProvider }: OAuthButtonsProps) {
  return (
    <div className="flex-col gap-4 flex">
      <button
        className="btn btn-outline w-full"
        onClick={() => {
          onProvider('google');
        }}
        type="button"
      >
        <FaGoogle className="h-5 w-5" />
        Google
      </button>

      <button
        className="btn btn-outline w-full"
        onClick={() => {
          onProvider('apple');
        }}
        type="button"
      >
        <FaApple className="h-5 w-5" />
        Apple
      </button>

      <button
        className="btn btn-outline w-full"
        onClick={() => {
          onProvider('facebook');
        }}
        type="button"
      >
        <FaFacebook className="h-5 w-5" />
        Facebook
      </button>
    </div>
  );
}
