import { sortNodeLocalStructures } from "@/lib/nodeDrilldownModel";

import type { NodeLocalSizeVariant, NodeLocalStructure, NodeLocalViewModel } from "./nodeDrilldownTypes";
import type { NodeDrilldownLayoutOverrides, NodeDrilldownLayoutPosition } from "./nodeDrilldownLayoutOverrides";

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

export interface NodeDrilldownCanvasClampContext {
  canvasWidth: number;
  canvasHeight: number;
  iconSize: number;
}

const MAP_BODY_HEIGHT_PX = 440;
const OPERATIONAL_ICON_SIZE = 24;
const ANCHOR_ICON_SIZE = 30;
const COMPOSITION_CENTER_X = 50;
const COMPOSITION_CENTER_Y = 50;
const VISIBLE_LEFT_MARGIN = 9;
const VISIBLE_RIGHT_MARGIN = 91;
const VISIBLE_TOP_MARGIN = 10;
const VISIBLE_BOTTOM_MARGIN = 90;
const ANCHOR_TO_MAIN_GAP = 11.5;
const GATE_TO_ANCHOR_GAP = 7.6;
const MAIN_TO_TURRET_GAP = 8.8;
const ANCHOR_TO_TURRET_GAP = 13;

interface LayoutBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface LayoutEntry {
  xPercent: number;
  yPercent: number;
  iconSize: number;
}

interface LayoutGroupConfig {
  items: NodeLocalStructure[];
  columns: number;
  stepX: number;
  stepY: number;
  gapAfter: number;
}

function iconHalfPercent(iconSize: number): number {
  return (iconSize / MAP_BODY_HEIGHT_PX) * 50;
}

function clampPercent(value: number, min: number, max: number): number {
  if (min > max) return Math.min(100, Math.max(0, value));
  return Math.min(max, Math.max(min, value));
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clampNodeDrilldownPosition(
  position: NodeDrilldownLayoutPosition,
  context: Partial<NodeDrilldownCanvasClampContext> = {},
): NodeDrilldownLayoutPosition {
  const halfX = context.canvasWidth && context.canvasWidth > 0
    ? (context.iconSize ?? OPERATIONAL_ICON_SIZE) / context.canvasWidth * 50
    : iconHalfPercent(context.iconSize ?? OPERATIONAL_ICON_SIZE);
  const halfY = context.canvasHeight && context.canvasHeight > 0
    ? (context.iconSize ?? OPERATIONAL_ICON_SIZE) / context.canvasHeight * 50
    : iconHalfPercent(context.iconSize ?? OPERATIONAL_ICON_SIZE);

  return {
    xPercent: roundPercent(clampPercent(position.xPercent, VISIBLE_LEFT_MARGIN + halfX, VISIBLE_RIGHT_MARGIN - halfX)),
    yPercent: roundPercent(clampPercent(position.yPercent, VISIBLE_TOP_MARGIN + halfY, VISIBLE_BOTTOM_MARGIN - halfY)),
  };
}

export function applyNodeDrilldownPositionOverrides(
  layout: NodeLocalLayoutResult,
  structures: readonly NodeLocalStructure[],
  overrides: NodeDrilldownLayoutOverrides,
): NodeLocalLayoutResult {
  if (Object.keys(overrides).length === 0) return layout;

  const canonicalKeyById = new Map(structures.map((structure) => [structure.id, structure.canonicalDomainKey]));
  return {
    ...layout,
    structures: layout.structures.map((item) => {
      const canonicalKey = canonicalKeyById.get(item.id);
      const override = canonicalKey ? overrides[canonicalKey] : null;
      if (!override) return item;

      const clamped = clampNodeDrilldownPosition(override, { iconSize: item.iconSize });
      return { ...item, ...clamped };
    }),
  };
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

function clampDelta(desired: number, min: number, max: number): number {
  if (min > max) return 0;
  return Math.min(max, Math.max(min, desired));
}

function measureBounds(entries: LayoutEntry[]): LayoutBounds | null {
  if (entries.length === 0) return null;

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  for (const entry of entries) {
    const halfIconPercent = iconHalfPercent(entry.iconSize);
    left = Math.min(left, entry.xPercent - halfIconPercent);
    right = Math.max(right, entry.xPercent + halfIconPercent);
    top = Math.min(top, entry.yPercent - halfIconPercent);
    bottom = Math.max(bottom, entry.yPercent + halfIconPercent);
  }

  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}

function mergeBounds(bounds: Array<LayoutBounds | null>): LayoutBounds | null {
  const visibleBounds = bounds.filter((entry): entry is LayoutBounds => entry != null);
  if (visibleBounds.length === 0) return null;

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  for (const entry of visibleBounds) {
    left = Math.min(left, entry.left);
    right = Math.max(right, entry.right);
    top = Math.min(top, entry.top);
    bottom = Math.max(bottom, entry.bottom);
  }

  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}

function translateItems(items: NodeLocalLayoutItem[], deltaX: number, deltaY: number): NodeLocalLayoutItem[] {
  if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) return items;

  return items.map((item) => ({
    ...item,
    xPercent: item.xPercent + deltaX,
    yPercent: item.yPercent + deltaY,
  }));
}

function translateAnchor(
  anchor: NodeLocalLayoutResult["anchor"],
  deltaX: number,
  deltaY: number,
): NodeLocalLayoutResult["anchor"] {
  if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) return anchor;

  return {
    xPercent: anchor.xPercent + deltaX,
    yPercent: anchor.yPercent + deltaY,
  };
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

function layoutStackedGroups(groups: LayoutGroupConfig[]): NodeLocalLayoutItem[] {
  const visibleGroups = groups.filter((group) => group.items.length > 0);
  const positioned: NodeLocalLayoutItem[] = [];
  let cursorY = 0;

  visibleGroups.forEach((group, index) => {
    positioned.push(
      ...gridPositions(group.items, {
        startX: 0,
        startY: cursorY,
        columns: group.columns,
        stepX: group.stepX,
        stepY: group.stepY,
        iconSize: OPERATIONAL_ICON_SIZE,
      }),
    );

    cursorY += Math.ceil(group.items.length / group.columns) * group.stepY;
    if (index < visibleGroups.length - 1) {
      cursorY += group.gapAfter;
    }
  });

  return positioned;
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

function layoutGateRail(items: NodeLocalStructure[]): NodeLocalLayoutItem[] {
  if (items.length === 0) return [];

  return gridPositions(items, {
    startX: 0,
    startY: 0,
    columns: items.length <= 2 ? 1 : 2,
    stepX: 7.8,
    stepY: 10.8,
    iconSize: OPERATIONAL_ICON_SIZE,
  });
}

function layoutDefenseBand(items: NodeLocalStructure[]): NodeLocalLayoutItem[] {
  if (items.length === 0) return [];

  const config = getDefenseConfig(items.length);
  const positioned: NodeLocalLayoutItem[] = [];
  let cursorY = 0;

  for (const bucket of bucketBySize(items)) {
    positioned.push(
      ...gridPositions(bucket, {
        startX: 0,
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

function placeBlock(
  items: NodeLocalLayoutItem[],
  position: { left?: number; right?: number; centerY?: number },
): NodeLocalLayoutItem[] {
  const bounds = measureBounds(items);
  if (!bounds) return items;

  const deltaX = position.left != null
    ? position.left - bounds.left
    : position.right != null
      ? position.right - bounds.right
      : 0;
  const deltaY = position.centerY != null ? position.centerY - bounds.centerY : 0;

  return translateItems(items, deltaX, deltaY);
}

function resolveAnchor(
  mainBounds: LayoutBounds | null,
  gateBounds: LayoutBounds | null,
  defenseBounds: LayoutBounds | null,
): NodeLocalLayoutResult["anchor"] {
  if (mainBounds) {
    return {
      xPercent: mainBounds.left - ANCHOR_TO_MAIN_GAP,
      yPercent: mainBounds.centerY,
    };
  }

  const sideBounds = mergeBounds([gateBounds, defenseBounds]);
  if (gateBounds) {
    return {
      xPercent: gateBounds.right + GATE_TO_ANCHOR_GAP,
      yPercent: sideBounds?.centerY ?? gateBounds.centerY,
    };
  }

  if (defenseBounds) {
    return {
      xPercent: defenseBounds.left - ANCHOR_TO_TURRET_GAP,
      yPercent: defenseBounds.centerY,
    };
  }

  return { xPercent: 0, yPercent: 0 };
}

function centerComposition(
  anchor: NodeLocalLayoutResult["anchor"],
  items: NodeLocalLayoutItem[],
): NodeLocalLayoutResult {
  const bounds = measureBounds([
    { xPercent: anchor.xPercent, yPercent: anchor.yPercent, iconSize: ANCHOR_ICON_SIZE },
    ...items,
  ]);

  if (!bounds) {
    return { anchor, structures: items };
  }

  const desiredDeltaX = COMPOSITION_CENTER_X - bounds.centerX;
  const desiredDeltaY = COMPOSITION_CENTER_Y - bounds.centerY;
  const deltaX = clampDelta(desiredDeltaX, VISIBLE_LEFT_MARGIN - bounds.left, VISIBLE_RIGHT_MARGIN - bounds.right);
  const deltaY = clampDelta(desiredDeltaY, VISIBLE_TOP_MARGIN - bounds.top, VISIBLE_BOTTOM_MARGIN - bounds.bottom);

  return {
    anchor: translateAnchor(anchor, deltaX, deltaY),
    structures: translateItems(items, deltaX, deltaY),
  };
}

export function layoutNodeDrilldown(viewModel: NodeLocalViewModel): NodeLocalLayoutResult {
  const sorted = sortNodeLocalStructures(viewModel.structures);
  const corridor = sorted.filter((structure) => structure.band === "corridor");
  const industry = sorted.filter((structure) => structure.band === "industry");
  const logistics = sorted.filter((structure) => structure.band === "logistics");
  const support = sorted.filter((structure) => structure.band === "support");
  const defense = sorted.filter((structure) => structure.band === "defense");

  const printerItems = industry.filter((structure) => structure.family === "printer");
  const refineryItems = industry.filter((structure) => structure.family === "refinery");
  const assemblerItems = industry.filter((structure) => structure.family === "assembler");

  const mainBlock = layoutStackedGroups([
    { items: printerItems, columns: 4, stepX: 6.2, stepY: 9.4, gapAfter: 3.2 },
    { items: refineryItems, columns: 4, stepX: 6.2, stepY: 9.4, gapAfter: 3.2 },
    { items: assemblerItems, columns: 4, stepX: 6.2, stepY: 9.4, gapAfter: 3.6 },
    { items: logistics, columns: 4, stepX: 6.2, stepY: 9.2, gapAfter: 3.8 },
    { items: support, columns: 4, stepX: 5.8, stepY: 8.8, gapAfter: 0 },
  ]);
  const gateRail = layoutGateRail(corridor);
  const defenseBlock = layoutDefenseBand(defense);

  const anchor = resolveAnchor(measureBounds(mainBlock), measureBounds(gateRail), measureBounds(defenseBlock));

  const translatedMain = mainBlock.length > 0
    ? placeBlock(mainBlock, {
      left: anchor.xPercent + ANCHOR_TO_MAIN_GAP,
      centerY: anchor.yPercent,
    })
    : [];
  const translatedMainBounds = measureBounds(translatedMain);

  const translatedGateRail = gateRail.length > 0
    ? placeBlock(gateRail, {
      right: anchor.xPercent - GATE_TO_ANCHOR_GAP,
      centerY: anchor.yPercent,
    })
    : [];

  const translatedDefense = defenseBlock.length > 0
    ? placeBlock(defenseBlock, {
      left: translatedMainBounds != null ? translatedMainBounds.right + MAIN_TO_TURRET_GAP : anchor.xPercent + ANCHOR_TO_MAIN_GAP,
      centerY: anchor.yPercent,
    })
    : [];

  return centerComposition(anchor, [...translatedGateRail, ...translatedMain, ...translatedDefense]);
}