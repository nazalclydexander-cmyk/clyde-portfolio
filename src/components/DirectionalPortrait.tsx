"use client";

/* eslint-disable @next/next/no-img-element -- Portrait URLs are stored in Supabase and may be remote. */

import { useEffect, useMemo, useState, type PointerEvent } from "react";
import {
  directionalPortraitSources,
  PORTRAIT_DIRECTIONS,
  type DirectionalPortraitSources,
  type PortraitDirection,
} from "@/lib/portraitAssets";

type DirectionalPortraitProps = {
  neutralSrc: string;
  alt: string;
  caption: string;
  sources?: DirectionalPortraitSources;
  enabled?: boolean;
};

const NON_NEUTRAL_DIRECTIONS = PORTRAIT_DIRECTIONS.filter(
  (direction): direction is Exclude<PortraitDirection, "neutral"> => direction !== "neutral",
);

const POINTER_DIRECTIONS: Record<number, Exclude<PortraitDirection, "neutral">> = {
  0: "right",
  45: "down-right",
  90: "down",
  135: "down-left",
  180: "left",
  225: "up-left",
  270: "up",
  315: "up-right",
};

export default function DirectionalPortrait({ neutralSrc, alt, caption, sources = directionalPortraitSources, enabled = true }: DirectionalPortraitProps) {
  const [direction, setDirection] = useState<PortraitDirection>("neutral");
  const [failedDirections, setFailedDirections] = useState<Set<PortraitDirection>>(new Set());
  const [isPointerCapable, setIsPointerCapable] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const directionalImages = useMemo(
    () => NON_NEUTRAL_DIRECTIONS
      .map((state) => ({ state, src: sources[state] }))
      .filter((entry): entry is { state: Exclude<PortraitDirection, "neutral">; src: string } => Boolean(entry.src && entry.src !== neutralSrc && !failedDirections.has(entry.state))),
    [failedDirections, neutralSrc, sources],
  );

  const visibleDirection = isPointerCapable && !prefersReducedMotion && direction !== "neutral" && sources[direction] && sources[direction] !== neutralSrc && !failedDirections.has(direction) ? direction : "neutral";
  const isInteractive = enabled && isPointerCapable && !prefersReducedMotion;

  useEffect(() => {
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMediaPreferences = () => {
      setIsPointerCapable(pointerQuery.matches);
      setPrefersReducedMotion(reducedMotionQuery.matches);
    };

    updateMediaPreferences();
    pointerQuery.addEventListener("change", updateMediaPreferences);
    reducedMotionQuery.addEventListener("change", updateMediaPreferences);

    return () => {
      pointerQuery.removeEventListener("change", updateMediaPreferences);
      reducedMotionQuery.removeEventListener("change", updateMediaPreferences);
    };
  }, []);

  useEffect(() => {
    if (!isInteractive) {
      return;
    }

    directionalImages.forEach(({ src }) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = src;
    });
  }, [directionalImages, isInteractive]);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!isInteractive || event.pointerType === "touch") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const distance = Math.hypot(x, y);

    if (distance < Math.min(bounds.width, bounds.height) * 0.12) {
      setDirection("neutral");
      return;
    }

    const angle = Math.round((Math.atan2(y, x) * 180) / Math.PI / 45) * 45;
    const normalizedAngle = (angle + 360) % 360;
    setDirection(POINTER_DIRECTIONS[normalizedAngle] || "neutral");
  }

  function handleDirectionalImageError(state: Exclude<PortraitDirection, "neutral">) {
    setFailedDirections((current) => new Set(current).add(state));
    setDirection("neutral");
  }

  return (
    <figure
      className="hero-portrait"
      data-portrait-direction={visibleDirection}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setDirection("neutral")}
    >
      <div className="portrait-stage">
        <img
          src={neutralSrc}
          alt={visibleDirection === "neutral" ? alt : ""}
          aria-hidden={visibleDirection !== "neutral"}
          width={640}
          height={800}
          fetchPriority="high"
        />
        {isInteractive ? directionalImages.map(({ state, src }) => (
          <img
            key={state}
            className="portrait-directional-image"
            src={src}
            alt={visibleDirection === state ? alt : ""}
            aria-hidden={visibleDirection !== state}
            width={640}
            height={800}
            loading="eager"
            data-portrait-state={state}
            onError={() => handleDirectionalImageError(state)}
            style={{ opacity: visibleDirection === state ? 1 : 0 }}
          />
        )) : null}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
