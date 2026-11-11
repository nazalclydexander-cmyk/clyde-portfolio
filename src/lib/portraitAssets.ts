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
  "angle-22",
  "angle-68",
  "angle-112",
  "angle-158",
  "angle-202",
  "angle-248",
  "angle-292",
  "angle-338",
] as const;

export type PortraitDirection = (typeof PORTRAIT_DIRECTIONS)[number];
export type DirectionalPortraitSources = Partial<Record<PortraitDirection, string>>;

/**
 * Missing diagonal directions intentionally fall back to the nearest available portrait.
 */
export const directionalPortraitSources: DirectionalPortraitSources = {
  neutral: "/images/portrait-directional/portrait-neutral.png",
  // Dedicated screen-left gaze asset; kept separate from the original generated set.
  left: "/images/portrait-directional/portrait-left-screen.png",
  right: "/images/portrait-directional/portrait-right.png",
  up: "/images/portrait-directional/portrait-up.png",
  down: "/images/portrait-directional/portrait-down.png",
  "up-left": "/images/portrait-directional/portrait-up-left.png",
  "up-right": "/images/portrait-directional/portrait-up-right.png",
  "down-left": "/images/portrait-directional/portrait-down-left.png",
  "down-right": "/images/portrait-directional/portrait-down-right.png",
  "angle-22": "/images/portrait-directional/portrait-angle-22.png",
  "angle-68": "/images/portrait-directional/portrait-angle-68.png",
  "angle-112": "/images/portrait-directional/portrait-angle-112.png",
  "angle-158": "/images/portrait-directional/portrait-angle-158.png",
  "angle-202": "/images/portrait-directional/portrait-angle-202.png",
  "angle-248": "/images/portrait-directional/portrait-angle-248.png",
  "angle-292": "/images/portrait-directional/portrait-angle-292.png",
  "angle-338": "/images/portrait-directional/portrait-angle-338.png",
};
