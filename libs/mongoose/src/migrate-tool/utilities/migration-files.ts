/**
 * Whether the file name looks like a generated migration (`2026-10-11-120000_some_name.ts`).
 * Other `.ts` files that may sit in the migrations directory, such as `*.test.ts`, are not migrations.
 */
export function isMigrationFile(fileName: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-\d{6}_[^.]+\.ts$/.test(fileName);
}
