import { readJson, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import projectTemplateGenerator from './generator';

describe('projectTemplateGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(
      'package.json',
      JSON.stringify(
        {
          name: '@ksojecki/platform-source',
          private: true,
          scripts: {
            'dev:rod-manager':
              'node ./node_modules/nx/dist/bin/nx.js run @ksojecki/rod-manager-api:serve --no-tui',
          },
        },
        null,
        2,
      ),
    );
    tree.write(
      'tsconfig.json',
      JSON.stringify(
        {
          extends: './tsconfig.base.json',
          references: [],
        },
        null,
        2,
      ),
    );
  });

  it('scaffolds template-based api and web apps without rod-manager dependencies', async () => {
    await projectTemplateGenerator(tree, { name: 'recepturomat' });

    expect(tree.exists('projects/recepturomat/apps/api/src/main.ts')).toBe(
      true,
    );
    expect(
      tree.exists('projects/recepturomat/apps/api/src/productConfig.ts'),
    ).toBe(true);
    expect(
      tree.exists('projects/recepturomat/apps/web/src/app/routes.tsx'),
    ).toBe(true);
    expect(
      tree.exists(
        'projects/recepturomat/apps/web/src/app/account/AccountPage.tsx',
      ),
    ).toBe(true);
    expect(
      tree.exists('projects/recepturomat/apps/web/src/app/auth/LoginPanel.tsx'),
    ).toBe(false);
    expect(
      tree.exists(
        'projects/recepturomat/apps/web/src/app/layout/components/Navbar.tsx',
      ),
    ).toBe(false);

    const apiPackageJson = readJson(
      tree,
      'projects/recepturomat/apps/api/package.json',
    ) as {
      dependencies: Record<string, string>;
      name: string;
    };
    const webPackageJson = readJson(
      tree,
      'projects/recepturomat/apps/web/package.json',
    ) as {
      dependencies: Record<string, string>;
      name: string;
    };

    expect(apiPackageJson.name).toBe('@ksojecki/recepturomat-api');
    expect(apiPackageJson.dependencies).toEqual(
      expect.objectContaining({
        '@ksojecki/platform-server-platform': '0.0.1',
      }),
    );
    expect(apiPackageJson.dependencies).not.toHaveProperty(
      '@ksojecki/rod-manager-pages-server',
    );

    expect(webPackageJson.name).toBe('@ksojecki/recepturomat-web');
    expect(webPackageJson.dependencies).toEqual(
      expect.objectContaining({
        '@ksojecki/platform-web-platform': '0.0.1',
      }),
    );

    const rootPackageJson = readJson(tree, 'package.json') as {
      scripts: Record<string, string>;
    };
    expect(rootPackageJson.scripts).toEqual(
      expect.objectContaining({
        'dev:rod-manager':
          'node ./node_modules/nx/dist/bin/nx.js run @ksojecki/rod-manager-api:serve --no-tui',
        'dev:recepturomat':
          'node ./node_modules/nx/dist/bin/nx.js run @ksojecki/recepturomat-api:serve --no-tui',
      }),
    );
    expect(rootPackageJson.scripts).not.toHaveProperty('dev');

    const productConfig = tree.read(
      'projects/recepturomat/apps/api/src/productConfig.ts',
      'utf-8',
    );
    expect(productConfig).toContain("projectId: 'recepturomat'");
    expect(productConfig).toContain('RECEPTUROMAT_AUTH_DB_PATH');
    expect(productConfig).toContain(
      'dist/projects/recepturomat/apps/web/client',
    );

    const routesSource = tree.read(
      'projects/recepturomat/apps/web/src/app/routes.tsx',
      'utf-8',
    );
    expect(routesSource).toContain('@ksojecki/platform-web-platform');
    expect(routesSource).not.toContain('@ksojecki/rod-manager');
    expect(routesSource).toContain('<RegisterPage');

    const webProductConfig = tree.read(
      'projects/recepturomat/apps/web/src/app/productConfig.ts',
      'utf-8',
    );
    expect(webProductConfig).toContain(
      'buildLoginPromptHref as buildSharedLoginPromptHref',
    );
    expect(webProductConfig).toContain('type LoginPromptConfig');
    expect(webProductConfig).toContain(
      "routes: {\n    home: '/',\n    account: '/account',\n    register: '/register',\n  },",
    );
    expect(webProductConfig).toContain(
      "auth: {\n    guestRedirectTo: '/?login=1',\n    postLoginRedirectTo: '/account',\n    postRegistrationRedirectTo: '/account',\n    oauthAuthenticatedFallbackTo: '/account',\n    oauthGuestFallbackTo: '/',\n  },",
    );
    expect(webProductConfig).toContain(
      "registration: {\n    enabled: true,\n    disabledRedirectTo: '/',\n  },",
    );
    expect(webProductConfig).toContain(
      "loginPrompt: {\n    queryParam: 'login',\n    queryValue: '1',\n  },",
    );
    expect(webProductConfig).toContain('return buildSharedLoginPromptHref(');
    expect(webProductConfig).toContain('frontendProductConfig.loginPrompt');

    const appLayoutSource = tree.read(
      'projects/recepturomat/apps/web/src/app/layout/AppLayout.tsx',
      'utf-8',
    );
    expect(appLayoutSource).toContain('PlatformNavbar');
    expect(appLayoutSource).toContain('PlatformFooter');

    const i18nSource = tree.read(
      'projects/recepturomat/apps/web/src/app/i18n/i18n.ts',
      'utf-8',
    );
    expect(i18nSource).toContain("menuLogin: 'Log in'");
    expect(i18nSource).toContain(
      "passwordSectionTitle: 'Create account with password'",
    );

    const rootTsConfig = readJson(tree, 'tsconfig.json') as {
      references: Array<{ path: string }>;
    };
    expect(rootTsConfig.references).toEqual(
      expect.arrayContaining([
        { path: './projects/recepturomat/apps/api' },
        { path: './projects/recepturomat/apps/web' },
      ]),
    );
  });
});
