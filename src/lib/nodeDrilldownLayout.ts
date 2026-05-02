import { sortNodeLocalStructures } from "@/lib/nodeDrilldownModel";

import type { NodeLocalBand, NodeLocalStructure, NodeLocalViewModel } from "./nodeDrilldownTypes";

export interface NodeLocalLayoutItem {
  id: string;
  xPercent: number;
  yPercent: number;
  iconSize: number;
}

export interface NodeLocalBandLabel {
  id: NodeLocalBand;
  label: string;
  xPercent: number;
  yPercent: number;
}

export interface NodeLocalLayoutResult {
  anchor: { xPercent: number; yPercent: number };
  structures: NodeLocalLayoutItem[];
  labels: NodeLocalBandLabel[];
}

const ANCHOR = { xPercent: 38, yPercent: 52 };

const BAND_LABELS: NodeLocalBandLabel[] = [
  { id: "corridor", label: "Corridor", xPercent: 14, yPercent: 14 },
  { id: "industry", label: "Industry", xPercent: 60, yPercent: 12 },
  { id: "logistics", label: "Logistics", xPercent: 56, yPercent: 52 },
  { id: "support", label: "Support", xPercent: 52, yPercent: 74 },
  { id: "defense", label: "Defense", xPercent: 82, yPercent: 12 },
];

function gridPositions(
  items: NodeLocalStructure[],
  config: { startX: number; startY: number; columns: number; stepX: number; stepY: number; iconSize: number },
): NodeLocalLayoutItem[] {
  return items.map((item, index) => ({
    id: item.id,
    xPercent: config.startX + (index % config.columns) * config.stepX,
    yPercent: config.startY + Math.floor(index / config.columns) * config.stepY,
    iconSize: item.family === "turret" ? config.iconSize : item.sizeVariant === "heavy" ? config.iconSize + 2 : item.sizeVariant === "mini" ? config.iconSize - 2 : config.iconSize,
  }));
}

function layoutDefenseBand(items: NodeLocalStructure[]): NodeLocalLayoutItem[] {
  const columns = Math.min(7, Math.max(3, Math.ceil(items.length / 8)));
  const iconSize = items.length >= 40 ? 18 : items.length >= 24 ? 20 : 22;
  const stepX = items.length >= 40 ? 4 : 4.8;
  const stepY = items.length >= 40 ? 7.2 : 8.4;
  const width = (columns - 1) * stepX;

  return gridPositions(items, {
    startX: 82 - width / 2,
    startY: 22,
    columns,
    stepX,
    stepY,
    iconSize,
  });
}

export function layoutNodeDrilldown(viewModel: NodeLocalViewModel): NodeLocalLayoutResult {
  const sorted = sortNodeLocalStructures(viewModel.structures);
  const corridor = sorted.filter((structure) => structure.band === "corridor");
  const industry = sorted.filter((structure) => structure.band === "industry");
  const logistics = sorted.filter((structure) => structure.band === "logistics");
  const support = sorted.filter((structure) => structure.band === "support");
  const defense = sorted.filter((structure) => structure.band === "defense");

  return {
    anchor: ANCHOR,
    labels: BAND_LABELS,
    structures: [
      ...gridPositions(corridor, { startX: 14, startY: 26, columns: 2, stepX: 8, stepY: 13, iconSize: 22 }),
      ...gridPositions(industry, { startX: 56, startY: 22, columns: 4, stepX: 6.4, stepY: 13, iconSize: 22 }),
      ...gridPositions(logistics, { startX: 54, startY: 58, columns: 4, stepX: 6.4, stepY: 12, iconSize: 22 }),
      ...gridPositions(support, { startX: 50, startY: 80, columns: 5, stepX: 5.4, stepY: 11, iconSize: 20 }),
      ...layoutDefenseBand(defense),
    ],
  };
}