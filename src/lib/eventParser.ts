/**
 * Event parser — transforms raw Sui chain events into UI-friendly SignalEvents.
 *
 * Supports all 8 CivilizationControl custom events:
 *   GateControl: TribeCheckPassedEvent, TollCollectedEvent, TribeRuleSetEvent,
 *                CoinTollSetEvent, RuleRemovedEvent
 *   TradePost:   ListingCreatedEvent, ListingPurchasedEvent, ListingCancelledEvent
 */

import { CC_PACKAGE_ID, CC_ORIGINAL_PACKAGE_ID } from "@/constants";
import { resolveItemTypeName } from "@/lib/typeCatalog";
import { formatLux } from "@/lib/currency";
import type { SignalEvent, SignalCategory, SignalVariant } from "@/types/domain";

/**
 * Fully-qualified on-chain event type strings.
 * v1 modules (gate_control, trade_post) use CC_ORIGINAL_PACKAGE_ID;
 * v2 modules (posture, turret_bouncer, turret_defense) use CC_PACKAGE_ID.
 */
export const CC_EVENT_TYPES = {
  TRIBE_CHECK_PASSED: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::TribeCheckPassedEvent`,
  TOLL_COLLECTED: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::TollCollectedEvent`,
  TRIBE_RULE_SET: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::TribeRuleSetEvent`,
  COIN_TOLL_SET: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::CoinTollSetEvent`,
  RULE_REMOVED: `${CC_ORIGINAL_PACKAGE_ID}::gate_control::RuleRemovedEvent`,
  LISTING_CREATED: `${CC_ORIGINAL_PACKAGE_ID}::trade_post::ListingCreatedEvent`,
  LISTING_PURCHASED: `${CC_ORIGINAL_PACKAGE_ID}::trade_post::ListingPurchasedEvent`,
  LISTING_CANCELLED: `${CC_ORIGINAL_PACKAGE_ID}::trade_post::ListingCancelledEvent`,
  POSTURE_CHANGED: `${CC_PACKAGE_ID}::posture::PostureChangedEvent`,
  BOUNCER_TARGETING: `${CC_PACKAGE_ID}::turret_bouncer::BouncerTargetingEvent`,
  DEFENSE_TARGETING: `${CC_PACKAGE_ID}::turret_defense::DefenseTargetingEvent`,
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
  describe: (json: Record<string, unknown>) => string;
  category: SignalCategory;
  variant: SignalVariant;
  relatedIdField?: string;
  amountField?: string;
}

const EVENT_MAP: Record<string, EventDescriptor> = {
  [CC_EVENT_TYPES.TRIBE_CHECK_PASSED]: {
    label: "Transit Authorized",
    describe: (j) => `Tribe ${j.tribe_id ?? "?"} cleared gate passage`,
    category: "transit",
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
  [CC_EVENT_TYPES.TRIBE_RULE_SET]: {
    label: "Tribe Rule Set",
    describe: (j) => `Tribe ${j.tribe ?? "?"} filter applied to gate`,
    category: "governance",
    variant: "neutral",
    relatedIdField: "gate_id",
  },
  [CC_EVENT_TYPES.COIN_TOLL_SET]: {
    label: "Coin Toll Set",
    describe: (j) => `Toll set to ${formatLux(Number(j.price ?? 0))} Lux`,
    category: "governance",
    variant: "neutral",
    relatedIdField: "gate_id",
  },
  [CC_EVENT_TYPES.RULE_REMOVED]: {
    label: "Rule Removed",
    describe: (j) => `${j.rule_type ?? "Rule"} removed from gate`,
    category: "governance",
    variant: "info",
    relatedIdField: "gate_id",
  },
  [CC_EVENT_TYPES.LISTING_CREATED]: {
    label: "Listing Created",
    describe: (j) => {
      const name = j.item_type_id ? resolveItemTypeName(Number(j.item_type_id)) : "item";
      return `${j.quantity ?? 0}× ${name} listed at ${formatLux(Number(j.price ?? 0))} Lux`;
    },
    category: "trade",
    variant: "neutral",
    relatedIdField: "listing_id",
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
    relatedIdField: "listing_id",
    amountField: "price",
  },
  [CC_EVENT_TYPES.LISTING_CANCELLED]: {
    label: "Listing Cancelled",
    describe: () => "Listing withdrawn by seller",
    category: "trade",
    variant: "info",
    relatedIdField: "listing_id",
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
  },
  [CC_EVENT_TYPES.BOUNCER_TARGETING]: {
    label: "Bouncer Targeting",
    describe: (j) =>
      `${j.engaged_count ?? 0} of ${j.candidate_count ?? 0} targets engaged`,
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
};

/** Parse a single raw Sui event into a SignalEvent. Returns null if unrecognized. */
export function parseChainEvent(raw: RawSuiEvent): SignalEvent | null {
  const descriptor = EVENT_MAP[raw.type];
  if (!descriptor) return null;

  const json = (raw.parsedJson ?? {}) as Record<string, unknown>;
  const timestamp = raw.timestampMs
    ? new Date(Number(raw.timestampMs)).toISOString()
    : new Date().toISOString();

  return {
    id: `${raw.id.txDigest}:${raw.id.eventSeq}`,
    txDigest: raw.id.txDigest,
    eventSeq: raw.id.eventSeq,
    timestamp,
    label: descriptor.label,
    description: descriptor.describe(json),
    category: descriptor.category,
    variant: descriptor.variant,
    relatedObjectId: descriptor.relatedIdField
      ? String(json[descriptor.relatedIdField] ?? "")
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

/** Category metadata for filter UI. */
export const SIGNAL_CATEGORIES: { value: SignalCategory | "all"; label: string }[] = [
  { value: "all", label: "All Signals" },
  { value: "governance", label: "Governance" },
  { value: "trade", label: "Trade" },
  { value: "transit", label: "Transit" },
  { value: "status", label: "Status" },
];
