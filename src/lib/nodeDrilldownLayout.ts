import { sortNodeLocalStructures } from "@/lib/nodeDrilldownModel";

import type { NodeLocalFamily, NodeLocalSizeVariant, NodeLocalStructure, NodeLocalViewModel } from "./nodeDrilldownTypes";

export interface NodeLocalLayoutItem {
  id: string;
  xPercent: number;
  yPercent: number;
  iconSize: number;
}

export interface NodeLocalLayoutResult {
  anchor: { xPercent: number; yPercent: number };
  structures: NodeLocalLayoutItem[];
}

const ANCHOR = { xPercent: 38, yPercent: 52 };
const CORRIDOR_START_X = 14;
const LEFT_FRAME_START_X = 55.5;
const DEFENSE_START_X = 77.5;
const INDUSTRY_START_Y = 21;
const LOGISTICS_MIN_Y = 53;
const SUPPORT_MIN_Y = 77;

function iconSizeForItem(item: NodeLocalStructure, baseIconSize: number): number {
  if (item.family === "turret") return baseIconSize;
  if (item.sizeVariant === "heavy") return baseIconSize + 2;
  if (item.sizeVariant === "mini") return baseIconSize - 2;
  return baseIconSize;
}

function gridPositions(
  items: NodeLocalStructure[],
  config: { startX: number; startY: number; columns: number; stepX: number; stepY: number; iconSize: number },
): NodeLocalLayoutItem[] {
  return items.map((item, index) => ({
    id: item.id,
    xPercent: config.startX + (index % config.columns) * config.stepX,
    yPercent: config.startY + Math.floor(index / config.columns) * config.stepY,
    iconSize: iconSizeForItem(item, config.iconSize),
  }));
}

function getDefenseConfig(count: number) {
  if (count >= 42) {
    return { columns: 6, stepX: 3.9, stepY: 6.5, iconSize: 18, startY: 20, bucketGap: 2.4 };
  }
  if (count >= 24) {
    return { columns: 5, stepX: 4.4, stepY: 7.1, iconSize: 20, startY: 20, bucketGap: 2.6 };
  }
  if (count >= 12) {
    return { columns: 4, stepX: 4.8, stepY: 8, iconSize: 21, startY: 21, bucketGap: 2.8 };
  }
  return { columns: 3, stepX: 5.2, stepY: 8.6, iconSize: 22, startY: 22, bucketGap: 3 };
}

function createFamilyRows(
  items: NodeLocalStructure[],
  families: NodeLocalFamily[],
  config: {
    startX: number;
    startY: number;
    columns: number;
    stepX: number;
    stepY: number;
    iconSize: number;
    familyGap: number;
  },
): { items: NodeLocalLayoutItem[]; bottomY: number } {
  const positioned: NodeLocalLayoutItem[] = [];
  let cursorY = config.startY;

  for (const family of families) {
    const familyItems = items.filter((item) => item.family === family);
    if (familyItems.length === 0) continue;

    positioned.push(
      ...gridPositions(familyItems, {
        startX: config.startX,
        startY: cursorY,
        columns: config.columns,
        stepX: config.stepX,
        stepY: config.stepY,
        iconSize: config.iconSize,
      }),
    );

    cursorY += Math.ceil(familyItems.length / config.columns) * config.stepY + config.familyGap;
  }

  return { items: positioned, bottomY: cursorY };
}

function bucketBySize(items: NodeLocalStructure[]) {
  const matches = (sizeVariant: NodeLocalSizeVariant) =>
    items.filter((item) => {
      if (sizeVariant === "standard") {
        return item.sizeVariant == null || item.sizeVariant === "standard";
      }
      return item.sizeVariant === sizeVariant;
    });

  return [matches("mini"), matches("standard"), matches("heavy")].filter((bucket) => bucket.length > 0);
}

function layoutDefenseBand(items: NodeLocalStructure[]): NodeLocalLayoutItem[] {
  const config = getDefenseConfig(items.length);
  const positioned: NodeLocalLayoutItem[] = [];
  let cursorY = config.startY;

  for (const bucket of bucketBySize(items)) {
    positioned.push(
      ...gridPositions(bucket, {
        startX: DEFENSE_START_X,
        startY: cursorY,
        columns: config.columns,
        stepX: config.stepX,
        stepY: config.stepY,
        iconSize: config.iconSize,
      }),
    );

    cursorY += Math.ceil(bucket.length / config.columns) * config.stepY + config.bucketGap;
  }

  return positioned;
}

export function layoutNodeDrilldown(viewModel: NodeLocalViewModel): NodeLocalLayoutResult {
  const sorted = sortNodeLocalStructures(viewModel.structures);
  const corridor = sorted.filter((structure) => structure.band === "corridor");
  const industry = sorted.filter((structure) => structure.band === "industry");
  const logistics = sorted.filter((structure) => structure.band === "logistics");
  const support = sorted.filter((structure) => structure.band === "support");
  const defense = sorted.filter((structure) => structure.band === "defense");

  const industryRows = createFamilyRows(industry, ["printer", "refinery", "assembler"], {
    startX: LEFT_FRAME_START_X,
    startY: INDUSTRY_START_Y,
    columns: 4,
    stepX: 6.2,
    stepY: 10.8,
    iconSize: 22,
    familyGap: 4.8,
  });

  const logisticsStartY = Math.max(LOGISTICS_MIN_Y, industryRows.bottomY);
  const logisticsRows = createFamilyRows(logistics, ["tradePost", "berth"], {
    startX: LEFT_FRAME_START_X,
    startY: logisticsStartY,
    columns: 4,
    stepX: 6.2,
    stepY: 10.4,
    iconSize: 22,
    familyGap: 4.6,
  });

  const supportStartY = Math.max(SUPPORT_MIN_Y, logisticsRows.bottomY);
  const supportRows = createFamilyRows(support, ["relay", "nursery", "nest", "shelter"], {
    startX: LEFT_FRAME_START_X,
    startY: supportStartY,
    columns: 4,
    stepX: 5.8,
    stepY: 9.2,
    iconSize: 20,
    familyGap: 3.8,
  });

  return {
    anchor: ANCHOR,
    structures: [
      ...gridPositions(corridor, { startX: CORRIDOR_START_X, startY: 28, columns: 2, stepX: 8.6, stepY: 12.2, iconSize: 22 }),
      ...industryRows.items,
      ...logisticsRows.items,
      ...supportRows.items,
      ...layoutDefenseBand(defense),
    ],
  };
}