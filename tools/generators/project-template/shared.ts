import { joinPathFragments, names, type Tree } from '@nx/devkit';

export interface ProjectTemplateSchema {
  name: string;
}

export interface NormalizedOptions {
  apiPackageName: string;
  displayName: string;
  name: string;
  projectConfigConstName: string;
  projectPropertyName: string;
  projectRoot: string;
  webPackageName: string;
}

export function normalizeOptions(schema: ProjectTemplateSchema): NormalizedOptions {
  const parsedName = names(schema.name);
  const projectName = parsedName.fileName;

  return {
    apiPackageName: `@ksojecki/${projectName}-api`,
    displayName: toDisplayName(projectName),
    name: projectName,
    projectConfigConstName: `${parsedName.propertyName}ProjectConfig`,
    projectPropertyName: parsedName.propertyName,
    projectRoot: joinPathFragments('projects', projectName),
    webPackageName: `@ksojecki/${projectName}-web`,
  };
}

export function writeJson(tree: Tree, filePath: string, value: unknown): void {
  writeFile(tree, filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function writeFile(tree: Tree, filePath: string, content: string): void {
  tree.write(filePath, content);
}

function toDisplayName(projectName: string): string {
  return projectName
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}
