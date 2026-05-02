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
const MAP_BODY_HEIGHT_PX = 440;
const OPERATIONAL_ICON_SIZE = 24;
const CORRIDOR_START_X = 14;
const LEFT_FRAME_START_X = 55.5;
const DEFENSE_START_X = 77.5;
const INDUSTRY_START_Y = 21;
const VISIBLE_BLOCK_CENTER_Y = 50;
const VISIBLE_TOP_MARGIN = 10;
const VISIBLE_BOTTOM_MARGIN = 90;

function iconHalfPercent(iconSize: number): number {
  return (iconSize / MAP_BODY_HEIGHT_PX) * 50;
}

function gridPositions(
  items: NodeLocalStructure[],
  config: { startX: number; startY: number; columns: number; stepX: number; stepY: number; iconSize: number },
): NodeLocalLayoutItem[] {
  return items.map((item, index) => ({
    id: item.id,
    xPercent: config.startX + (index % config.columns) * config.stepX,
    yPercent: config.startY + Math.floor(index / config.columns) * config.stepY,
    iconSize: config.iconSize,
  }));
}

function getDefenseConfig(count: number) {
  if (count >= 42) {
    return { columns: 6, stepX: 3.9, stepY: 6.5, iconSize: OPERATIONAL_ICON_SIZE, startY: 20, bucketGap: 2.4 };
  }
  if (count >= 24) {
    return { columns: 5, stepX: 4.4, stepY: 7.1, iconSize: OPERATIONAL_ICON_SIZE, startY: 20, bucketGap: 2.6 };
  }
  if (count >= 12) {
    return { columns: 4, stepX: 4.8, stepY: 8, iconSize: OPERATIONAL_ICON_SIZE, startY: 21, bucketGap: 2.8 };
  }
  return { columns: 3, stepX: 5.2, stepY: 8.6, iconSize: OPERATIONAL_ICON_SIZE, startY: 22, bucketGap: 3 };
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

function nextBandStart(startY: number, itemCount: number, columns: number, stepY: number, gap: number): number {
  if (itemCount === 0) return startY;
  return startY + Math.ceil(itemCount / columns) * stepY + gap;
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

function measureVisibleBounds(items: NodeLocalLayoutItem[]) {
  if (items.length === 0) {
    return {
      top: VISIBLE_BLOCK_CENTER_Y,
      bottom: VISIBLE_BLOCK_CENTER_Y,
      center: VISIBLE_BLOCK_CENTER_Y,
      height: 0,
    };
  }

  let top = Infinity;
  let bottom = -Infinity;

  for (const item of items) {
    const halfIconPercent = iconHalfPercent(item.iconSize);
    top = Math.min(top, item.yPercent - halfIconPercent);
    bottom = Math.max(bottom, item.yPercent + halfIconPercent);
  }

  return {
    top,
    bottom,
    center: (top + bottom) / 2,
    height: bottom - top,
  };
}

function translateItemsY(items: NodeLocalLayoutItem[], deltaY: number): NodeLocalLayoutItem[] {
  if (Math.abs(deltaY) < 0.01) return items;

  return items.map((item) => ({
    ...item,
    yPercent: item.yPercent + deltaY,
  }));
}

function centerVisibleBlock(items: NodeLocalLayoutItem[]): NodeLocalLayoutItem[] {
  const bounds = measureVisibleBounds(items);
  if (items.length === 0 || bounds.height >= VISIBLE_BOTTOM_MARGIN - VISIBLE_TOP_MARGIN) {
    return items;
  }

  const desiredDelta = VISIBLE_BLOCK_CENTER_Y - bounds.center;
  const minDelta = VISIBLE_TOP_MARGIN - bounds.top;
  const maxDelta = VISIBLE_BOTTOM_MARGIN - bounds.bottom;
  const deltaY = Math.min(maxDelta, Math.max(minDelta, desiredDelta));

  return translateItemsY(items, deltaY);
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
    stepY: 9.4,
    iconSize: OPERATIONAL_ICON_SIZE,
    familyGap: 3.4,
  });

  const logisticsStartY = industryRows.items.length > 0 ? industryRows.bottomY : INDUSTRY_START_Y;
  const logisticsItems = gridPositions(logistics, {
    startX: LEFT_FRAME_START_X,
    startY: logisticsStartY,
    columns: 4,
    stepX: 6.2,
    stepY: 9.4,
    iconSize: OPERATIONAL_ICON_SIZE,
  });

  const supportStartY = logisticsItems.length > 0
    ? nextBandStart(logisticsStartY, logistics.length, 4, 9.4, 4.2)
    : industryRows.items.length > 0
      ? industryRows.bottomY
      : INDUSTRY_START_Y;
  const supportItems = gridPositions(support, {
    startX: LEFT_FRAME_START_X,
    startY: supportStartY,
    columns: 4,
    stepX: 5.8,
    stepY: 8.8,
    iconSize: OPERATIONAL_ICON_SIZE,
  });

  const structures = centerVisibleBlock([
    ...gridPositions(corridor, {
      startX: CORRIDOR_START_X,
      startY: 28,
      columns: 2,
      stepX: 8.6,
      stepY: 12.2,
      iconSize: OPERATIONAL_ICON_SIZE,
    }),
    ...industryRows.items,
    ...logisticsItems,
    ...supportItems,
    ...layoutDefenseBand(defense),
  ]);

  return {
    anchor: ANCHOR,
    structures,
  };
}