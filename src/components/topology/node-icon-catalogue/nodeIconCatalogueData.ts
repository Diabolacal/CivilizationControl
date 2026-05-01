export type NodeIconFamily =
  | "networkNode"
  | "gate"
  | "tradePost"
  | "turret"
  | "printer"
  | "refinery"
  | "assembler"
  | "berth"
  | "relay"
  | "nursery"
  | "hangar"
  | "nest";

export type NodeIconTone = "neutral" | "online" | "offline" | "warning";
export type NodeIconBadge = "M" | "H" | null;

export interface NodeIconPreviewEntry {
  id: string;
  label: string;
  family: NodeIconFamily;
  badge?: NodeIconBadge;
  tone?: NodeIconTone;
  selected?: boolean;
  warningPip?: boolean;
  note?: string;
}

export interface NodeIconColorReference {
  id: string;
  label: string;
  token: string;
  value: string;
  swatch: string;
}

export const FIRST_WAVE_NODE_ICONS: NodeIconPreviewEntry[] = [
  { id: "network-node", label: "Network Node", family: "networkNode" },
  { id: "mini-gate", label: "Mini Gate", family: "gate", badge: "M" },
  { id: "heavy-gate", label: "Heavy Gate", family: "gate", badge: "H" },
  { id: "mini-storage", label: "Mini Storage", family: "tradePost", badge: "M" },
  { id: "storage", label: "Storage", family: "tradePost" },
  { id: "heavy-storage", label: "Heavy Storage", family: "tradePost", badge: "H" },
  { id: "mini-turret", label: "Mini Turret", family: "turret", badge: "M" },
  { id: "turret", label: "Turret", family: "turret" },
  { id: "heavy-turret", label: "Heavy Turret", family: "turret", badge: "H" },
];

export const PROVISIONAL_NODE_ICONS: NodeIconPreviewEntry[] = [
  { id: "mini-printer", label: "Mini Printer", family: "printer", badge: "M" },
  { id: "printer", label: "Printer", family: "printer" },
  { id: "heavy-printer", label: "Heavy Printer", family: "printer", badge: "H" },
  { id: "refinery", label: "Refinery", family: "refinery" },
  { id: "heavy-refinery", label: "Heavy Refinery", family: "refinery", badge: "H" },
  { id: "assembler", label: "Assembler", family: "assembler" },
  { id: "mini-berth", label: "Mini Berth", family: "berth", badge: "M" },
  { id: "berth", label: "Berth", family: "berth" },
  { id: "heavy-berth", label: "Heavy Berth", family: "berth", badge: "H" },
  { id: "relay", label: "Relay", family: "relay" },
  { id: "nursery", label: "Nursery", family: "nursery" },
  { id: "shelter", label: "Shelter", family: "hangar" },
  { id: "heavy-shelter", label: "Heavy Shelter", family: "hangar", badge: "H" },
  { id: "nest", label: "Nest", family: "nest", note: "Provisional" },
];

export const STATE_EXAMPLE_ICONS: NodeIconPreviewEntry[] = [
  { id: "state-neutral", label: "Neutral", family: "tradePost" },
  { id: "state-online", label: "Online", family: "gate", tone: "online" },
  { id: "state-offline", label: "Offline", family: "turret", tone: "offline" },
  { id: "state-selected", label: "Selected", family: "networkNode", selected: true },
  {
    id: "state-warning",
    label: "Warning",
    family: "tradePost",
    badge: "H",
    tone: "warning",
    warningPip: true,
  },
];

export const DEFERRED_NODE_ICON_NOTES = [
  "Field Printer",
  "Field Refinery",
  "Field Storage",
];

export const NODE_ICON_COLOR_REFERENCE: NodeIconColorReference[] = [
  {
    id: "neutral",
    label: "Neutral",
    token: "--topo-glyph-neutral",
    value: "hsl(210, 8%, 55%)",
    swatch: "var(--topo-glyph-neutral)",
  },
  {
    id: "online",
    label: "Online",
    token: "--topo-state-online",
    value: "hsl(175, 45%, 50%)",
    swatch: "var(--topo-state-online)",
  },
  {
    id: "offline",
    label: "Offline",
    token: "--topo-state-offline",
    value: "#ef4444",
    swatch: "var(--topo-state-offline)",
  },
  {
    id: "selected",
    label: "Selected",
    token: "--topo-selected",
    value: "#ea580c",
    swatch: "var(--topo-selected)",
  },
  {
    id: "warning",
    label: "Warning",
    token: "--topo-state-warning",
    value: "#f59e0b",
    swatch: "var(--topo-state-warning)",
  },
];