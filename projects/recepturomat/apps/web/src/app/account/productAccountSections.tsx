import type { AccountSection } from '@ksojecki/platform-web-platform';

export function useProductAccountSections(): AccountSection[] {
  return [
    {
      id: 'starter-notes',
      content: (
        <div className="rounded-box border border-base-300 p-4">
          <h2 className="text-lg font-medium">Recepturomat starter notes</h2>
          <p className="text-base-content/75">
            Replace this section list with product-specific account content. The
            surrounding account shell and auth mechanics stay shared in
            libs/web-platform.
          </p>
        </div>
      ),
    },
  ];
}
