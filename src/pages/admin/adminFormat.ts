export function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
