import { formatFiles, updateJson, type Tree } from '@nx/devkit';
import { writeApiApp } from './api';
import { normalizeOptions, type NormalizedOptions, type ProjectTemplateSchema } from './shared';
import { writeWebApp } from './web';

export async function projectTemplateGenerator(
  tree: Tree,
  schema: ProjectTemplateSchema,
): Promise<void> {
  const options = normalizeOptions(schema);

  writeApiApp(tree, options);
  writeWebApp(tree, options);
  updateRootPackageScripts(tree, options);
  updateRootTsConfigReferences(tree, options);

  await formatFiles(tree);
}

export default projectTemplateGenerator;

function updateRootPackageScripts(tree: Tree, options: NormalizedOptions): void {
  updateJson(
    tree,
    'package.json',
    (value: { scripts?: Record<string, string>; [key: string]: unknown }) => {
      const scripts = value.scripts ?? {};
      scripts[`dev:${options.name}`] =
        `node ./node_modules/nx/dist/bin/nx.js run ${options.apiPackageName}:dev --no-tui`;
      delete scripts[`launch:${options.name}`];
      value.scripts = scripts;
      return value;
    },
  );
}

function updateRootTsConfigReferences(tree: Tree, options: NormalizedOptions): void {
  updateJson(
    tree,
    'tsconfig.json',
    (value: { references?: Array<{ path: string }>; [key: string]: unknown }) => {
      const references = value.references ?? [];
      const nextPaths = new Set(references.map((reference) => reference.path));
      nextPaths.add(`./${options.projectRoot}/apps/api`);
      nextPaths.add(`./${options.projectRoot}/apps/web`);

      value.references = Array.from(nextPaths)
        .toSorted()
        .map((path) => ({ path }));

      return value;
    },
  );
}
