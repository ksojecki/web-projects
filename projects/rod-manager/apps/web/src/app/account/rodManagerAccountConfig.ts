import type { AccountSectionsHook } from '@ksojecki/platform-web-platform';
import { useRodManagerAccountSections } from './rodManagerAccountSections';

export interface ProductAccountConfig {
  useSections: AccountSectionsHook;
}

/**
 * Product-local account configuration stays responsible for product-specific
 * sections and settings persistence. Only reusable shell mechanics live in
 * libs/web-platform.
 */
export const rodManagerAccountConfig: ProductAccountConfig = {
  useSections: useRodManagerAccountSections,
};
