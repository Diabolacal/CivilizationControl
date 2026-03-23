import type { GatePolicy, PostureMode } from "@/types/domain";

export interface ResolvedPolicy {
  access: boolean;
  toll: number;
  mode: PostureMode;
  hasPreset: boolean;
}

/**
 * Resolve the effective policy for a given gate, posture mode, and tribe.
 *
 * 1. Select the preset matching the active posture
 * 2. If no preset exists → free passage
 * 3. Look up the tribe in preset entries
 * 4. If found → use entry.access / entry.toll
 * 5. If not found → use preset defaults
 */
export function resolveEffectivePolicy(
  policy: GatePolicy | null,
  posture: PostureMode,
  tribeId: number,
): ResolvedPolicy {
  if (!policy) return { access: true, toll: 0, mode: posture, hasPreset: false };

  const preset = posture === "commercial" ? policy.commercialPreset : policy.defensePreset;
  if (!preset) return { access: true, toll: 0, mode: posture, hasPreset: false };

  const entry = preset.entries.find((e) => e.tribe === tribeId);
  if (entry) {
    return { access: entry.access, toll: entry.toll, mode: posture, hasPreset: true };
  }

  return { access: preset.defaultAccess, toll: preset.defaultToll, mode: posture, hasPreset: true };
}
