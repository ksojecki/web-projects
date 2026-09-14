import { joinPathFragments, names, type Tree } from '@nx/devkit';

export interface ProjectTemplateSchema {
  name: string;
}

export interface NormalizedOptions {
  apiPackageName: string;
  apiPort: number;
  chromeDebugPort: number;
  displayName: string;
  frontendBaseUrl: string;
  name: string;
  projectConfigConstName: string;
  projectPropertyName: string;
  projectRoot: string;
  webPackageName: string;
  webPort: number;
}

const DEFAULT_RUNTIME_OPTIONS = {
  apiPort: 3000,
  chromeDebugPort: 9222,
  frontendBaseUrl: 'https://localhost:3000',
  webPort: 4200,
};

const PROJECT_RUNTIME_OPTIONS: Record<string, typeof DEFAULT_RUNTIME_OPTIONS> = {
  budget: {
    apiPort: 3200,
    chromeDebugPort: 9444,
    frontendBaseUrl: 'https://localhost:3200',
    webPort: 4400,
  },
};

export function normalizeOptions(schema: ProjectTemplateSchema): NormalizedOptions {
  const parsedName = names(schema.name);
  const projectName = parsedName.fileName;
  const runtimeOptions = PROJECT_RUNTIME_OPTIONS[projectName] ?? DEFAULT_RUNTIME_OPTIONS;

  return {
    apiPackageName: `@ksojecki/${projectName}-api`,
    apiPort: runtimeOptions.apiPort,
    chromeDebugPort: runtimeOptions.chromeDebugPort,
    displayName: toDisplayName(projectName),
    frontendBaseUrl: runtimeOptions.frontendBaseUrl,
    name: projectName,
    projectConfigConstName: `${parsedName.propertyName}ProjectConfig`,
    projectPropertyName: parsedName.propertyName,
    projectRoot: joinPathFragments('projects', projectName),
    webPackageName: `@ksojecki/${projectName}-web`,
    webPort: runtimeOptions.webPort,
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
