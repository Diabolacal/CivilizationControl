export function getFailedTransactionMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  for (const key of ["error", "message", "failure", "reason"]) {
    const text = candidate[key];
    if (typeof text === "string" && text.trim().length > 0) {
      return text;
    }
  }

  const effects = candidate.effects as { status?: { error?: unknown } } | undefined;
  const effectsError = effects?.status?.error;
  return typeof effectsError === "string" && effectsError.trim().length > 0 ? effectsError : null;
}