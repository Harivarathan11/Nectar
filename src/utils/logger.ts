export function logger(message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  if (args.length > 0) {
    console.log(`[${timestamp}] ${message}`, ...args);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}
