function normalizeMultipartValue(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "undefined") {
      return undefined;
    }

    if (trimmed === "null") {
      return null;
    }
  }

  return value;
}

export function normalizeMultipartBody<T extends Record<string, unknown>>(
  body: T,
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    const normalized = normalizeMultipartValue(value);

    if (normalized === undefined) {
      continue;
    }

    result[key] = normalized;
  }
  return result as T;
}
