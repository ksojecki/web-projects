import type { AuthUser } from '@ksojecki/platform-shared';
import { Page } from '@ksojecki/platform-ui';
import type { AccountSection } from './types';

export interface AccountShellProps {
  roleLabel: string;
  sections: AccountSection[];
  title: string;
  user: AuthUser | null;
  welcomeMessage: string;
}

export function AccountShell({
  roleLabel,
  sections,
  title,
  user,
  welcomeMessage,
}: AccountShellProps) {
  return (
    <Page>
      <Page.Title>{title}</Page.Title>
      <Page.Content>
        <p>{welcomeMessage}</p>
        <p className="text-sm text-base-content/70">{user?.email ?? ''}</p>
        <p className="text-sm text-base-content/70">
          {roleLabel}: {user?.role ?? 'user'}
        </p>
        {sections.map((section) => (
          <section key={section.id}>{section.content}</section>
        ))}
      </Page.Content>
    </Page>
  );
}
