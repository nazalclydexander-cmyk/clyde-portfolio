"use client";

/* eslint-disable @next/next/no-img-element -- Portrait URLs are stored in Supabase and may be remote. */

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  0: "right", 22.5: "angle-22", 45: "down-right", 67.5: "angle-68",
  90: "down", 112.5: "angle-112", 135: "down-left", 157.5: "angle-158",
  180: "left", 202.5: "angle-202", 225: "up-left", 247.5: "angle-248",
  270: "up", 292.5: "angle-292", 315: "up-right", 337.5: "angle-338",
};

const INTERACTION_PADDING = 112;

export default function DirectionalPortrait({ neutralSrc, alt, caption, sources = directionalPortraitSources, enabled = true }: DirectionalPortraitProps) {
  const [direction, setDirection] = useState<PortraitDirection>("neutral");
  const [failedDirections, setFailedDirections] = useState<Set<PortraitDirection>>(new Set());
  const [isPointerCapable, setIsPointerCapable] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const interactionRef = useRef<HTMLDivElement>(null);
  const portraitStageRef = useRef<HTMLDivElement>(null);

  const directionalImages = useMemo(
    () => NON_NEUTRAL_DIRECTIONS
      .map((state) => ({ state, src: sources[state] }))
      .filter((entry): entry is { state: Exclude<PortraitDirection, "neutral">; src: string } => Boolean(entry.src && entry.src !== neutralSrc && !failedDirections.has(entry.state))),
    [failedDirections, neutralSrc, sources],
  );

  const isInteractive = enabled && isPointerCapable && !prefersReducedMotion;
  const visibleDirection = isInteractive && direction !== "neutral" && sources[direction] && sources[direction] !== neutralSrc && !failedDirections.has(direction) ? direction : "neutral";

  const updateDirectionFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!isInteractive) return;

    const interactionBounds = interactionRef.current?.getBoundingClientRect();
    const portraitBounds = portraitStageRef.current?.getBoundingClientRect();
    if (!interactionBounds || !portraitBounds) return;

    const isWithinInteractionZone = clientX >= interactionBounds.left - INTERACTION_PADDING &&
      clientX <= interactionBounds.right + INTERACTION_PADDING &&
      clientY >= interactionBounds.top - INTERACTION_PADDING &&
      clientY <= interactionBounds.bottom + INTERACTION_PADDING;

    if (!isWithinInteractionZone) {
      setDirection("neutral");
      return;
    }

    const x = clientX - (portraitBounds.left + portraitBounds.width / 2);
    const y = clientY - (portraitBounds.top + portraitBounds.height / 2);
    const distance = Math.hypot(x, y);

    if (distance < Math.min(portraitBounds.width, portraitBounds.height) * 0.12) {
      setDirection("neutral");
      return;
    }

    const angle = Math.round((Math.atan2(y, x) * 180) / Math.PI / 22.5) * 22.5;
    const normalizedAngle = (angle + 360) % 360;
    setDirection(POINTER_DIRECTIONS[normalizedAngle] || "neutral");
  }, [isInteractive]);

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

  useEffect(() => {
    if (!isInteractive) return;

    const handleWindowPointerMove = (event: globalThis.PointerEvent) => {
      if (event.pointerType === "touch") return;
      updateDirectionFromPointer(event.clientX, event.clientY);
    };
    const resetDirection = () => setDirection("neutral");
    const handleWindowPointerOut = (event: globalThis.PointerEvent) => {
      if (!event.relatedTarget) resetDirection();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerout", handleWindowPointerOut);
    window.addEventListener("blur", resetDirection);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerout", handleWindowPointerOut);
      window.removeEventListener("blur", resetDirection);
    };
  }, [isInteractive, updateDirectionFromPointer]);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isInteractive || event.pointerType === "touch") return;
    updateDirectionFromPointer(event.clientX, event.clientY);
  }

  function handleDirectionalImageError(state: Exclude<PortraitDirection, "neutral">) {
    setFailedDirections((current) => new Set(current).add(state));
    setDirection("neutral");
  }

  return (
    <div
      ref={interactionRef}
      className="hero-portrait-interaction"
      onPointerMove={handlePointerMove}
      onPointerLeave={(event) => updateDirectionFromPointer(event.clientX, event.clientY)}
    >
      <figure className="hero-portrait" data-portrait-direction={visibleDirection}>
        <div ref={portraitStageRef} className="portrait-stage">
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
    </div>
  );
}
