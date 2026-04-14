export function generateKeyPrefix(name: string): string {
  return name.replace(/[^a-zA-Z]/g, "").slice(0, 5);
}
