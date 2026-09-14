// Node 26 executes this CLI directly with type stripping and therefore needs
// the explicit TypeScript extension at runtime.
import { migrateLedgerCsv, LedgerCsvError } from './ledger-csv.ts';

function usage(): never {
  throw new LedgerCsvError(
    'Usage: npm run budget:migrate-ledger -- --csv <path> --database <path> [--spreadsheet-id <id>] [--source-name <name>]',
  );
}

function parseArgs(args: readonly string[]): {
  csvPath: string;
  databasePath: string;
  spreadsheetId?: string;
  sourceName?: string;
} {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith('--')) {
      usage();
    }
    const key = argument.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      usage();
    }
    values.set(key, value);
    index += 1;
  }
  const csvPath = values.get('csv');
  const databasePath = values.get('database');
  if (!csvPath || !databasePath) {
    usage();
  }
  return {
    csvPath,
    databasePath,
    spreadsheetId: values.get('spreadsheet-id'),
    sourceName: values.get('source-name'),
  };
}

try {
  const report = migrateLedgerCsv(parseArgs(process.argv.slice(2)));
  process.stdout.write(
    [
      `Import ${report.importId} (${report.sourceName})`,
      `inserted: ${report.inserted}`,
      `skipped: ${report.skipped}`,
      `invalid: ${report.invalid}`,
      `ambiguous: ${report.ambiguous}`,
      `checksum: ${report.fileChecksum}`,
    ].join('\n') + '\n',
  );
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
