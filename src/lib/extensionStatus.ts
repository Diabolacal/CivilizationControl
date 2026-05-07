import type { ExtensionStatus } from "@/types/domain";

export type ProvenExtensionStatus = Exclude<ExtensionStatus, "unknown">;

export function coerceExtensionStatus(value: ExtensionStatus | null | undefined): ExtensionStatus {
  return value ?? "unknown";
}

export function isExtensionAuthorizationAttentionStatus(
  value: ExtensionStatus | null | undefined,
): boolean {
  return value === "none" || value === "stale";
}

export function mergeExtensionStatus(
  preferred: ExtensionStatus | null | undefined,
  fallback: ExtensionStatus | null | undefined,
): ExtensionStatus {
  if (preferred === "authorized" || fallback === "authorized") {
    return "authorized";
  }

  if (preferred == null || preferred === "unknown") {
    return fallback ?? "unknown";
  }

  if (fallback == null || fallback === "unknown") {
    return preferred;
  }

  return preferred;
}
