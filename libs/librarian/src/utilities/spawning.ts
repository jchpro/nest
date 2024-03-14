export function prepareCommand(command: string): string {
  return process.platform === 'win32' ? `${command}.cmd` : command;
}
