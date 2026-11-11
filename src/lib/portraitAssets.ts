export const PORTRAIT_DIRECTIONS = [
  "neutral",
  "left",
  "right",
  "up",
  "down",
  "up-left",
  "up-right",
  "down-left",
  "down-right",
] as const;

export type PortraitDirection = (typeof PORTRAIT_DIRECTIONS)[number];
export type DirectionalPortraitSources = Partial<Record<PortraitDirection, string>>;

/**
 * Add same-aspect, optimized portrait files here when they become available.
 * Missing directions intentionally fall back to the existing neutral portrait.
 */
export const directionalPortraitSources: DirectionalPortraitSources = {};
