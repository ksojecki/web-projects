import type { AccountExtraSectionsHook } from '@ksojecki/platform-web-platform';
import { useProductExtraAccountSections } from './productAccountSections';

export interface ProductAccountConfig {
  useExtraSections: AccountExtraSectionsHook;
}

export const productAccountConfig: ProductAccountConfig = {
  useExtraSections: useProductExtraAccountSections,
};
