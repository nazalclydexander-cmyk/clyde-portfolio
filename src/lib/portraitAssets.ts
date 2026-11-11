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
 * Missing diagonal directions intentionally fall back to the nearest available portrait.
 */
export const directionalPortraitSources: DirectionalPortraitSources = {
  neutral: "/images/portrait-directional/portrait-neutral.png",
  left: "/images/portrait-directional/portrait-left.png",
  right: "/images/portrait-directional/portrait-right.png",
  up: "/images/portrait-directional/portrait-up.png",
  down: "/images/portrait-directional/portrait-down.png",
  "up-left": "/images/portrait-directional/portrait-up-left.png",
  "up-right": "/images/portrait-directional/portrait-up-right.png",
  "down-left": "/images/portrait-directional/portrait-down-left.png",
  "down-right": "/images/portrait-directional/portrait-down-right.png",
};
