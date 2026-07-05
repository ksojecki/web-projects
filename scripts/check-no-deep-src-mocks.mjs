import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const sourceFilePattern = /\.(?:[cm]?[jt]sx?)$/;
const deepSrcMockPattern =
  /vi\.mock\(\s*['"`][^'"`]*(?:libs|projects)\/[^'"`]+\/src(?:\/[^'"`]*)?['"`]/g;
const ignoredDirectories = new Set([
  '.git',
  '.nx',
  'coverage',
  'dist',
  'node_modules',
]);

const fileArguments = process.argv.slice(2);
const filesToCheck =
  fileArguments.length > 0
    ? fileArguments
        .map((filePath) => path.resolve(filePath))
        .filter((filePath) => sourceFilePattern.test(filePath))
    : collectSourceFiles(process.cwd());

const violations = filesToCheck.flatMap(findViolations);

if (violations.length > 0) {
  console.error('Deep source vi.mock paths are not allowed:');

  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} ${violation.match}`);
  }

  process.exit(1);
}

function collectSourceFiles(directoryPath) {
  const entries = readdirSync(directoryPath, { withFileTypes: true });
  const sourceFiles = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      sourceFiles.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (entry.isFile() && sourceFilePattern.test(entry.name)) {
      sourceFiles.push(entryPath);
    }
  }

  return sourceFiles;
}

function findViolations(filePath) {
  if (!statSync(filePath).isFile()) {
    return [];
  }

  const content = readFileSync(filePath, 'utf8');
  const matches = [...content.matchAll(deepSrcMockPattern)];

  return matches.map((match) => ({
    file: path.relative(process.cwd(), filePath),
    line: content.slice(0, match.index).split('\n').length,
    match: match[0],
  }));
}
