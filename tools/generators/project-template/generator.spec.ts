import { readJson, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import projectTemplateGenerator from './generator';

type PackageJsonWithDependencies = {
  dependencies: Record<string, string>;
  name: string;
};

type RootPackageJson = {
  scripts: Record<string, string>;
};

type ApiProjectPackageJson = {
  nx: {
    targets: Record<string, { options?: Record<string, string> }>;
  };
};

type TsConfigWithReferences = {
  references: Array<{ path: string }>;
};

type JsonObject = Record<string, unknown>;

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
              'node ./node_modules/nx/dist/bin/nx.js run @ksojecki/rod-manager-api:dev --no-tui',
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

    const apiPackageJson = readPackageJsonWithDependencies(
      tree,
      'projects/recepturomat/apps/api/package.json',
    );
    const webPackageJson = readPackageJsonWithDependencies(
      tree,
      'projects/recepturomat/apps/web/package.json',
    );

    expect(apiPackageJson.name).toBe('@ksojecki/recepturomat-api');
    expect(apiPackageJson.dependencies).toEqual(
      expect.objectContaining({
        '@ksojecki/platform-shared': '0.0.1',
        '@ksojecki/platform-server-platform': '0.0.1',
      }),
    );
    expect(apiPackageJson.dependencies).not.toHaveProperty('dotenv');
    expect(apiPackageJson.dependencies).not.toHaveProperty('fastify');
    expect(apiPackageJson.dependencies).not.toHaveProperty(
      '@ksojecki/rod-manager-pages-server',
    );

    expect(webPackageJson.name).toBe('@ksojecki/recepturomat-web');
    expect(webPackageJson.dependencies).toEqual(
      expect.objectContaining({
        '@ksojecki/platform-web-platform': '0.0.1',
      }),
    );

    const rootPackageJson = readRootPackageJson(tree, 'package.json');
    expect(rootPackageJson.scripts).toEqual(
      expect.objectContaining({
        'dev:rod-manager':
          'node ./node_modules/nx/dist/bin/nx.js run @ksojecki/rod-manager-api:dev --no-tui',
        'dev:recepturomat':
          'node ./node_modules/nx/dist/bin/nx.js run @ksojecki/recepturomat-api:dev --no-tui',
      }),
    );
    expect(rootPackageJson.scripts).not.toHaveProperty('dev');
    expect(rootPackageJson.scripts).not.toHaveProperty('launch:rod-manager');
    expect(rootPackageJson.scripts).not.toHaveProperty('launch:recepturomat');

    const productConfig = tree.read(
      'projects/recepturomat/apps/api/src/productConfig.ts',
      'utf-8',
    );
    expect(productConfig).toContain("projectId: 'recepturomat'");
    expect(productConfig).toContain("loadProductEnv('recepturomat')");
    expect(productConfig).toContain("getProductAuthDbPath('recepturomat')");
    expect(productConfig).toContain('getProductSeedInitialUser()');
    expect(productConfig).toContain(
      'dist/projects/recepturomat/apps/web/client',
    );

    const apiMain = tree.read(
      'projects/recepturomat/apps/api/src/main.ts',
      'utf-8',
    );
    expect(apiMain).toContain('startProductServer');
    expect(apiMain).not.toContain('Fastify from');

    const apiProjectPackageJson = readApiProjectPackageJson(
      tree,
      'projects/recepturomat/apps/api/package.json',
    );
    expect(apiProjectPackageJson.nx.targets.dev.options?.command).toContain(
      'tools/launch/launch-product.mjs',
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

    const accountPageSource = tree.read(
      'projects/recepturomat/apps/web/src/app/account/AccountPage.tsx',
      'utf-8',
    );
    expect(accountPageSource).toContain('useDefaultAccountSections');
    expect(accountPageSource).not.toContain('productAccountConfig');
    expect(
      tree.exists(
        'projects/recepturomat/apps/web/src/app/account/productAccountConfig.ts',
      ),
    ).toBe(false);
    expect(
      tree.exists(
        'projects/recepturomat/apps/web/src/app/account/productAccountSections.tsx',
      ),
    ).toBe(false);

    const i18nSource = tree.read(
      'projects/recepturomat/apps/web/src/app/i18n/i18n.ts',
      'utf-8',
    );
    expect(i18nSource).toContain("menuLogin: 'Log in'");
    expect(i18nSource).toContain(
      "passwordSectionTitle: 'Create account with password'",
    );

    const rootTsConfig = readTsConfigWithReferences(tree, 'tsconfig.json');
    expect(rootTsConfig.references).toEqual(
      expect.arrayContaining([
        { path: './projects/recepturomat/apps/api' },
        { path: './projects/recepturomat/apps/web' },
      ]),
    );
  });
});

function readApiProjectPackageJson(
  tree: Tree,
  path: string,
): ApiProjectPackageJson {
  const value = readJson(tree, path);

  if (!isApiProjectPackageJson(value)) {
    throw new Error(
      `Expected ${path} to contain Nx public dev target metadata.`,
    );
  }

  return value;
}

function readPackageJsonWithDependencies(
  tree: Tree,
  path: string,
): PackageJsonWithDependencies {
  const value = readJson(tree, path);

  if (!isPackageJsonWithDependencies(value)) {
    throw new Error(`Expected ${path} to contain name and dependencies.`);
  }

  return value;
}

function readRootPackageJson(tree: Tree, path: string): RootPackageJson {
  const value = readJson(tree, path);

  if (!isRootPackageJson(value)) {
    throw new Error(`Expected ${path} to contain scripts.`);
  }

  return value;
}

function readTsConfigWithReferences(
  tree: Tree,
  path: string,
): TsConfigWithReferences {
  const value = readJson(tree, path);

  if (!isTsConfigWithReferences(value)) {
    throw new Error(`Expected ${path} to contain TypeScript references.`);
  }

  return value;
}

function hasStringRecordProperty(
  value: JsonObject,
  key: string,
): value is JsonObject & Record<typeof key, Record<string, string>> {
  const property = value[key];

  return (
    typeof property === 'object' &&
    property !== null &&
    Object.values(property).every((entry) => typeof entry === 'string')
  );
}

function hasJsonObjectProperty(
  value: JsonObject,
  key: string,
): value is JsonObject & Record<typeof key, JsonObject> {
  const property = value[key];

  return typeof property === 'object' && property !== null;
}

function isApiProjectPackageJson(
  value: unknown,
): value is ApiProjectPackageJson {
  if (!isJsonObject(value) || !hasJsonObjectProperty(value, 'nx')) {
    return false;
  }

  const { nx } = value;

  return hasJsonObjectProperty(nx, 'targets');
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null;
}

function isPackageJsonWithDependencies(
  value: unknown,
): value is PackageJsonWithDependencies {
  return (
    isJsonObject(value) &&
    typeof value.name === 'string' &&
    hasStringRecordProperty(value, 'dependencies')
  );
}

function isRootPackageJson(value: unknown): value is RootPackageJson {
  return isJsonObject(value) && hasStringRecordProperty(value, 'scripts');
}

function isTsConfigWithReferences(
  value: unknown,
): value is TsConfigWithReferences {
  return (
    isJsonObject(value) &&
    Array.isArray(value.references) &&
    value.references.every(
      (reference) =>
        isJsonObject(reference) && typeof reference.path === 'string',
    )
  );
}
