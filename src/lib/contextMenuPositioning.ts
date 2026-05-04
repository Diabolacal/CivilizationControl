const CONTEXT_MENU_MARGIN_PX = 12;
const CONTEXT_MENU_ITEM_HEIGHT_PX = 36;
const CONTEXT_MENU_CHROME_HEIGHT_PX = 12;
const CONTEXT_MENU_MIN_WIDTH_PX = 112;
const CONTEXT_MENU_MAX_WIDTH_PX = 240;
const CONTEXT_MENU_HORIZONTAL_PADDING_PX = 28;
const CONTEXT_MENU_CHARACTER_WIDTH_PX = 8;

export function getContextMenuMarginPx(): number {
  return CONTEXT_MENU_MARGIN_PX;
}

export function clampContextMenuPosition(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function estimateContextMenuHeightPx(itemCount: number): number {
  return CONTEXT_MENU_CHROME_HEIGHT_PX + itemCount * CONTEXT_MENU_ITEM_HEIGHT_PX;
}

export function estimateContextMenuWidthPx(labels: string[]): number {
  const longestLabelLength = labels.reduce((max, label) => Math.max(max, label.length), 0);
  const estimatedWidth = longestLabelLength * CONTEXT_MENU_CHARACTER_WIDTH_PX + CONTEXT_MENU_HORIZONTAL_PADDING_PX;

  return Math.min(CONTEXT_MENU_MAX_WIDTH_PX, Math.max(CONTEXT_MENU_MIN_WIDTH_PX, estimatedWidth));
}