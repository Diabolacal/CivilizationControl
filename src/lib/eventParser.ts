/**
 * Event parser — transforms raw Sui chain events into UI-friendly SignalEvents.
 *
 * Supports all CivilizationControl custom events (v2a):
 *   GateControl: PolicyPresetSetEvent, PolicyPresetRemovedEvent,
 *                TreasurySetEvent, TollCollectedEvent, PermitIssuedEvent
 *   TradePost:   ListingCreatedEvent, ListingPurchasedEvent, ListingCancelledEvent
 *   Posture:     PostureChangedEvent
 *   Turrets:     BouncerTargetingEvent, DefenseTargetingEvent, TurretResponseEvent
 */

import { CC_ORIGINAL_PACKAGE_ID, WORLD_ORIGINAL_PACKAGE_ID } from "@/constants";
import { resolveItemTypeName } from "@/lib/typeCatalog";
import { resolveTribeName } from "@/lib/tribeCatalog";
import { formatLux } from "@/lib/currency";
import type { SignalEvent, SignalCategory, SignalVariant } from "@/types/domain";

/**
 * Fully-qualified on-chain event type strings.
 * Uses CC_ORIGINAL_PACKAGE_ID for types defined in v1 (type-origin anchoring).
 */
export const CC_EVENT_TYPES = {
  PRESET_SET: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::PolicyPresetSetEvent`,
  PRESET_REMOVED: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::PolicyPresetRemovedEvent`,
  TREASURY_SET: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::TreasurySetEvent`,
  TOLL_COLLECTED: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::TollCollectedEvent`,
  PERMIT_ISSUED: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::PermitIssuedEvent`,
  LISTING_CREATED: `${CC_ORIGINAL_PACKAGE_ID}::trade_post::ListingCreatedEvent`,
  LISTING_PURCHASED: `${CC_ORIGINAL_PACKAGE_ID}::trade_post::ListingPurchasedEvent`,
  LISTING_CANCELLED: `${CC_ORIGINAL_PACKAGE_ID}::trade_post::ListingCancelledEvent`,
  POSTURE_CHANGED: `${CC_ORIGINAL_PACKAGE_ID}::posture::PostureChangedEvent`,
  BOUNCER_TARGETING: `${CC_ORIGINAL_PACKAGE_ID}::turret_bouncer::BouncerTargetingEvent`,
  DEFENSE_TARGETING: `${CC_ORIGINAL_PACKAGE_ID}::turret_defense::DefenseTargetingEvent`,
  TURRET_RESPONSE: `${CC_ORIGINAL_PACKAGE_ID}::turret_events::TurretResponseEvent`,
  TURRET_TARGETING: `${CC_ORIGINAL_PACKAGE_ID}::turret::TurretTargetingEvent`,
  // World-level turret events (emitted by world::turret module on extension changes)
  TURRET_EXT_AUTHORIZED: `${WORLD_ORIGINAL_PACKAGE_ID}::turret::ExtensionAuthorizedEvent`,
  TURRET_EXT_REVOKED: `${WORLD_ORIGINAL_PACKAGE_ID}::turret::ExtensionRevokedEvent`,
  // World-level status events (emitted via gate::online / gate::offline)
  STATUS_CHANGED: `${WORLD_ORIGINAL_PACKAGE_ID}::status::StatusChangedEvent`,
} as const;

/** Shape of a raw event from SuiClient.queryEvents data array. */
export interface RawSuiEvent {
  id: { txDigest: string; eventSeq: string };
  type: string;
  parsedJson?: Record<string, unknown>;
  timestampMs?: string;
  sender?: string;
}

interface EventDescriptor {
  label: string;
  /** Override label dynamically based on event data (e.g., directional status labels). */
  dynamicLabel?: (json: Record<string, unknown>) => string | null;
  describe: (json: Record<string, unknown>) => string;
  category: SignalCategory;
  variant: SignalVariant;
  relatedIdField?: string;
  secondaryIdField?: string;
  amountField?: string;
  /** Field containing the operator address for ownership scoping (e.g. "seller"). */
  ownerAddressField?: string;
}

const EVENT_MAP: Record<string, EventDescriptor> = {
  [CC_EVENT_TYPES.PRESET_SET]: {
    label: "Gate Directive Updated",
    describe: (j) => {
      const modes = ["Commercial", "Defense"];
      const modeName = modes[Number(j.mode ?? 0)] ?? "Unknown";
      return `${modeName} directive updated`;
    },
    category: "governance",
    variant: "neutral",
    relatedIdField: "gate_id",
  },
  [CC_EVENT_TYPES.PRESET_REMOVED]: {
    label: "Policy Preset Removed",
    describe: (j) => {
      const modes = ["Commercial", "Defense"];
      const modeName = modes[Number(j.mode ?? 0)] ?? "Unknown";
      return `${modeName} preset removed`;
    },
    category: "governance",
    variant: "info",
    relatedIdField: "gate_id",
  },
  [CC_EVENT_TYPES.TREASURY_SET]: {
    label: "Treasury Updated",
    describe: (j) => {
      const addr = String(j.treasury ?? "").slice(0, 10);
      return `Treasury set to ${addr}…`;
    },
    category: "governance",
    variant: "neutral",
    relatedIdField: "gate_id",
  },
  [CC_EVENT_TYPES.TOLL_COLLECTED]: {
    label: "Toll Collected",
    describe: (j) => `${formatLux(Number(j.amount ?? 0))} Lux toll collected`,
    category: "transit",
    variant: "revenue",
    relatedIdField: "gate_id",
    amountField: "amount",
  },
  [CC_EVENT_TYPES.PERMIT_ISSUED]: {
    label: "Transit Authorized",
    describe: (j) => {
      const modes = ["Commercial", "Defense"];
      const modeName = modes[Number(j.mode ?? 0)] ?? "?";
      const tribeName = j.tribe_id != null ? resolveTribeName(Number(j.tribe_id)) : "Unknown";
      return `${tribeName} cleared (${modeName}), toll ${formatLux(Number(j.toll ?? 0))} Lux`;
    },
    category: "transit",
    variant: "neutral",
    relatedIdField: "gate_id",
    amountField: "toll",
  },
  [CC_EVENT_TYPES.LISTING_CREATED]: {
    label: "Listing Created",
    describe: (j) => {
      const name = j.item_type_id ? resolveItemTypeName(Number(j.item_type_id)) : "item";
      return `${j.quantity ?? 0}× ${name} listed at ${formatLux(Number(j.price ?? 0))} Lux`;
    },
    category: "trade",
    variant: "neutral",
    relatedIdField: "storage_unit_id",
    secondaryIdField: "listing_id",
    amountField: "price",
  },
  [CC_EVENT_TYPES.LISTING_PURCHASED]: {
    label: "Trade Settled",
    describe: (j) => {
      const name = j.item_type_id ? resolveItemTypeName(Number(j.item_type_id)) : "item";
      return `${j.quantity ?? 0}× ${name} purchased for ${formatLux(Number(j.price ?? 0))} Lux`;
    },
    category: "trade",
    variant: "revenue",
    secondaryIdField: "listing_id",
    amountField: "price",
    ownerAddressField: "seller",
  },
  [CC_EVENT_TYPES.LISTING_CANCELLED]: {
    label: "Listing Cancelled",
    describe: () => "Listing withdrawn by seller",
    category: "trade",
    variant: "info",
    secondaryIdField: "listing_id",
    ownerAddressField: "seller",
  },
  [CC_EVENT_TYPES.POSTURE_CHANGED]: {
    label: "Posture Changed",
    describe: (j) => {
      const modes = ["Commercial", "Defense"];
      const oldName = modes[Number(j.old_mode ?? 0)] ?? "Unknown";
      const newName = modes[Number(j.new_mode ?? 0)] ?? "Unknown";
      return `Network posture: ${oldName} → ${newName}`;
    },
    category: "governance",
    variant: "neutral",
    relatedIdField: "gate_id",
  },
  [CC_EVENT_TYPES.BOUNCER_TARGETING]: {
    label: "Bouncer Targeting",
    describe: (j) =>
      `${j.engaged_count ?? 0} aggressors of ${j.candidate_count ?? 0} candidates engaged`,
    category: "status",
    variant: "info",
    relatedIdField: "turret_id",
  },
  [CC_EVENT_TYPES.DEFENSE_TARGETING]: {
    label: "Hostile Engaged",
    describe: (j) =>
      `${j.hostile_count ?? 0} of ${j.candidate_count ?? 0} targets flagged hostile`,
    category: "status",
    variant: "blocked",
    relatedIdField: "turret_id",
  },
  [CC_EVENT_TYPES.TURRET_RESPONSE]: {
    label: "Turret Response",
    describe: (j) => {
      const doctrine = Number(j.doctrine ?? 0) === 0 ? "Commercial" : "Defense";
      const engaged = Number(j.engaged_count ?? 0);
      const aggr = Number(j.aggressor_count ?? 0);
      const topId = j.top_target_id && String(j.top_target_id) !== "0" ? ` — target ${j.top_target_id}` : "";
      return `${doctrine} — ${engaged} engaged${aggr > 0 ? `, ${aggr} aggressors` : ""}${topId}`;
    },
    category: "status",
    variant: "blocked",
    relatedIdField: "turret_id",
  },
  [CC_EVENT_TYPES.TURRET_TARGETING]: {
    label: "Turret Targeting",
    describe: (j) => {
      const doctrine = Number(j.doctrine ?? 0) === 0 ? "Commercial" : "Defense";
      const engaged = Number(j.engaged_count ?? 0);
      return `${doctrine} — ${engaged} of ${j.candidate_count ?? 0} engaged`;
    },
    category: "status",
    variant: "info",
    relatedIdField: "turret_id",
  },
  [CC_EVENT_TYPES.TURRET_EXT_AUTHORIZED]: {
    label: "Turret Doctrine Set",
    describe: (j) => {
      const rawExt = j.extension_type;
      const extType = typeof rawExt === "object" && rawExt !== null && "name" in rawExt
        ? String((rawExt as Record<string, unknown>).name)
        : String(rawExt ?? "");
      const shortName = extType.includes("CommercialAuth")
        ? "Commercial"
        : extType.includes("BouncerAuth")
          ? "Bouncer"
          : extType.includes("DefenseAuth")
            ? "Defense"
            : extType.split("::").pop() ?? "Unknown";
      return `Turret extension set to ${shortName}`;
    },
    category: "governance",
    variant: "neutral",
    relatedIdField: "assembly_id",
  },
  [CC_EVENT_TYPES.TURRET_EXT_REVOKED]: {
    label: "Turret Doctrine Revoked",
    describe: () => "Turret extension authorization revoked",
    category: "governance",
    variant: "info",
    relatedIdField: "assembly_id",
  },
  [CC_EVENT_TYPES.STATUS_CHANGED]: {
    label: "Power Changed",
    dynamicLabel: (j) => {
      const action = (j.action as { variant?: string })?.variant ?? "";
      const assemblyName = resolveAssemblyName(j);
      if (action === "ONLINE") return `${assemblyName} Brought Online`;
      if (action === "OFFLINE") return `${assemblyName} Taken Offline`;
      return null; // skip ANCHORED/UNANCHORED
    },
    describe: (j) => {
      const action = (j.action as { variant?: string })?.variant ?? "";
      const assemblyName = resolveAssemblyName(j).toLowerCase();
      if (action === "ONLINE") return `${assemblyName} brought online`;
      if (action === "OFFLINE") return `${assemblyName} taken offline`;
      return `${assemblyName} status: ${action.toLowerCase()}`;
    },
    category: "status",
    variant: "neutral",
    relatedIdField: "assembly_id",
  },
};

/** Parse a single raw Sui event into a SignalEvent. Returns null if unrecognized. */
export function parseChainEvent(raw: RawSuiEvent): SignalEvent | null {
  const descriptor = EVENT_MAP[raw.type];
  if (!descriptor) return null;

  const json = (raw.parsedJson ?? {}) as Record<string, unknown>;

  // Dynamic label override — null return means skip this event
  const label = descriptor.dynamicLabel
    ? descriptor.dynamicLabel(json)
    : descriptor.label;
  if (label === null) return null;

  const timestamp = raw.timestampMs
    ? new Date(Number(raw.timestampMs)).toISOString()
    : new Date().toISOString();

  return {
    id: `${raw.id.txDigest}:${raw.id.eventSeq}`,
    txDigest: raw.id.txDigest,
    eventSeq: raw.id.eventSeq,
    timestamp,
    label,
    description: descriptor.describe(json),
    category: descriptor.category,
    variant: descriptor.variant,
    relatedObjectId: descriptor.relatedIdField
      ? String(json[descriptor.relatedIdField] ?? "")
      : undefined,
    secondaryObjectId: descriptor.secondaryIdField
      ? String(json[descriptor.secondaryIdField] ?? "")
      : undefined,
    sender: raw.sender,
    ownerAddress: descriptor.ownerAddressField
      ? String(json[descriptor.ownerAddressField] ?? "")
      : undefined,
    amount: descriptor.amountField
      ? Number(json[descriptor.amountField] ?? 0)
      : undefined,
  };
}

/** Parse and sort an array of raw Sui events by timestamp (newest first). */
export function parseChainEvents(rawEvents: RawSuiEvent[]): SignalEvent[] {
  const signals: SignalEvent[] = [];
  for (const raw of rawEvents) {
    const signal = parseChainEvent(raw);
    if (signal) signals.push(signal);
  }
  return signals.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// ─── Helpers ─────────────────────────────────────────────

/** Resolve operator-facing assembly name from StatusChangedEvent _assemblyType tag. */
function resolveAssemblyName(json: Record<string, unknown>): string {
  const t = String(json._assemblyType ?? "gate");
  if (t === "turret") return "Turret";
  if (t === "storage_unit") return "Trade Post";
  return "Gate";
}

/** Category metadata for filter UI. */
export const SIGNAL_CATEGORIES: { value: SignalCategory | "all"; label: string }[] = [
  { value: "all", label: "All Signals" },
  { value: "governance", label: "Governance" },
  { value: "trade", label: "Trade" },
  { value: "transit", label: "Transit" },
  { value: "status", label: "Status" },
];
