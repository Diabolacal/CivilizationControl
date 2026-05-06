/**
 * signalFolder — post-parse digest-level folding for governance clusters.
 *
 * 1. Posture switch: When a single PTB updates G gates + T turrets,
 *    the chain emits ≤G PostureChangedEvents + T ExtensionAuthorizedEvents.
 *    Folded into one "Network Posture Set" governance signal.
 *
 * 2. Directive deploy: When a directive is applied to N gates in one PTB,
 *    the chain emits N PolicyPresetSetEvents. Folded into one
 *    "Gate Directive Deployed" governance signal.
 *
 * Non-cluster signals pass through untouched.
 */

import type { SignalEvent } from "@/types/domain";

// ─── Labels assigned by eventParser ──────────────────────────────────

/** Label the parser assigns to posture::PostureChangedEvent */
const POSTURE_CHANGED_LABEL = "Posture Changed";

/** Label the parser assigns to world::turret::ExtensionAuthorizedEvent */
const TURRET_DOCTRINE_LABEL = "Turret Doctrine Set";

/** Label the parser assigns to gate_control::PolicyPresetSetEvent */
const PRESET_SET_LABEL = "Gate Directive Updated";

/** Minimum cluster size to trigger folding (events in same digest). */
const MIN_CLUSTER_SIZE = 2;

// ─── Folding ─────────────────────────────────────────────────────────

/**
 * Fold governance clusters into synthesized signals per transaction digest.
 * Handles posture-switch clusters and directive-deploy clusters.
 * Non-cluster signals pass through unchanged.
 */
export function foldPostureSignals(signals: SignalEvent[]): SignalEvent[] {
  // Group signals by txDigest
  const byDigest = new Map<string, SignalEvent[]>();
  for (const s of signals) {
    const group = byDigest.get(s.txDigest);
    if (group) {
      group.push(s);
    } else {
      byDigest.set(s.txDigest, [s]);
    }
  }

  const result: SignalEvent[] = [];

  for (const [, group] of byDigest) {
    const postureEvents = group.filter((s) => s.label === POSTURE_CHANGED_LABEL);
    const turretDoctrineEvents = group.filter((s) => s.label === TURRET_DOCTRINE_LABEL);
    const presetEvents = group.filter((s) => s.label === PRESET_SET_LABEL);
    const postureClusterSize = postureEvents.length + turretDoctrineEvents.length;

    // 1. Posture-switch cluster
    const shouldFoldPosture =
      (postureEvents.length > 0 && postureClusterSize >= MIN_CLUSTER_SIZE) ||
      turretDoctrineEvents.length >= MIN_CLUSTER_SIZE;

    // 2. Directive-deploy cluster (≥2 preset events in same digest)
    const shouldFoldPreset = presetEvents.length >= MIN_CLUSTER_SIZE;

    if (shouldFoldPosture) {
      // Separate non-posture signals — they pass through unchanged
      const nonPostureSignals = group.filter(
        (s) => s.label !== POSTURE_CHANGED_LABEL && s.label !== TURRET_DOCTRINE_LABEL,
      );

      result.push(synthesizePostureSignal(postureEvents, turretDoctrineEvents));
      result.push(...nonPostureSignals);
    } else if (shouldFoldPreset) {
      // Separate non-preset signals — they pass through unchanged
      const nonPresetSignals = group.filter((s) => s.label !== PRESET_SET_LABEL);

      result.push(synthesizeDirectiveSignal(presetEvents));
      result.push(...nonPresetSignals);
    } else {
      // Not a cluster — pass all signals through
      result.push(...group);
    }
  }

  // Re-sort by timestamp descending (same order as parseChainEvents)
  result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return result;
}

// ─── Synthesis ───────────────────────────────────────────────────────

function synthesizePostureSignal(
  postureEvents: SignalEvent[],
  turretDoctrineEvents: SignalEvent[],
): SignalEvent {
  // Infer target posture: prefer PostureChangedEvent, fall back to turret description
  const primaryDescription = postureEvents.length > 0
    ? postureEvents[0].description
    : turretDoctrineEvents[0].description;
  const targetPosture = inferTargetPosture(primaryDescription);

  // Use earliest timestamp from the cluster for stable sort position
  const all = [...postureEvents, ...turretDoctrineEvents];
  const earliest = all.reduce((min, s) =>
    s.timestamp < min.timestamp ? s : min,
  );

  return {
    id: `${earliest.txDigest}:folded`,
    txDigest: earliest.txDigest,
    eventSeq: "folded",
    timestamp: earliest.timestamp,
    kind: "posture_changed",
    label: "Network Posture Set",
    description: `${targetPosture} posture applied`,
    category: "governance",
    variant: "neutral",
    relatedObjectId: earliest.relatedObjectId,
    sender: earliest.sender,
  };
}

function inferTargetPosture(description: string): string {
  // Parser description format: "Network posture: Commercial → Defense"
  const arrowIdx = description.indexOf("→");
  if (arrowIdx !== -1) {
    const after = description.slice(arrowIdx + 1).trim();
    if (after === "Defense" || after === "Commercial") return after;
  }
  // Fallback: check for known posture names anywhere in the description
  if (description.includes("Defense")) return "Defense";
  if (description.includes("Commercial")) return "Commercial";
  return "Updated";
}

// ─── Directive folding ───────────────────────────────────────────────

function synthesizeDirectiveSignal(presetEvents: SignalEvent[]): SignalEvent {
  const earliest = presetEvents.reduce((min, s) =>
    s.timestamp < min.timestamp ? s : min,
  );

  // Infer mode from the first event description (e.g., "Commercial preset applied (2 entries)")
  const mode = inferDirectiveMode(presetEvents[0].description);
  const gateCount = presetEvents.length;

  const description = gateCount > 1
    ? `${mode} directive deployed to ${gateCount} gates`
    : `${mode} directive deployed`;

  return {
    id: `${earliest.txDigest}:folded`,
    txDigest: earliest.txDigest,
    eventSeq: "folded",
    timestamp: earliest.timestamp,
    kind: "gate_policy_preset_changed",
    label: "Gate Directive Deployed",
    description,
    category: "governance",
    variant: "neutral",
    relatedObjectId: earliest.relatedObjectId,
    sender: earliest.sender,
  };
}

function inferDirectiveMode(description: string): string {
  if (description.startsWith("Commercial")) return "Commercial";
  if (description.startsWith("Defense")) return "Defense";
  return "Gate";
}
