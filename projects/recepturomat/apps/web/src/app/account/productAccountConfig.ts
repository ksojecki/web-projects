import type { AccountSectionsHook } from '@ksojecki/platform-web-platform';
import { useProductAccountSections } from './productAccountSections';

export interface ProductAccountConfig {
  useSections: AccountSectionsHook;
}

export const productAccountConfig: ProductAccountConfig = {
  useSections: useProductAccountSections,
};
