import type { AccountSectionsHook } from '@sojecki/platform-web-platform';
import { useProductAccountSections } from './productAccountSections';

export interface ProductAccountConfig {
  useSections: AccountSectionsHook;
}

export const productAccountConfig: ProductAccountConfig = {
  useSections: useProductAccountSections,
};
