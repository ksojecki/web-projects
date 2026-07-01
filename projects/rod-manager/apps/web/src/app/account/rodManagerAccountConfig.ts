import type { AccountExtraSectionsHook } from '@ksojecki/platform-web-platform';
import { useRodManagerExtraAccountSections } from './rodManagerAccountSections';

export interface ProductAccountConfig {
  useExtraSections: AccountExtraSectionsHook;
}

/**
 * Product-local account configuration stays responsible for product-specific
 * sections and settings persistence. Only reusable shell mechanics live in
 * libs/web-platform.
 */
export const rodManagerAccountConfig: ProductAccountConfig = {
  useExtraSections: useRodManagerExtraAccountSections,
};
