"use client";

/* eslint-disable @next/next/no-img-element -- Badge URLs are stored in Supabase and may be remote. */

import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/Icons";

export default function CertificationBadgeLightbox({ src, alt, name }: { src: string; alt: string; name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function closePreview() {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <>
      <button
        ref={triggerRef}
        className="certification-badge-trigger"
        type="button"
        aria-label={`Open larger preview of ${alt}`}
        onClick={() => setIsOpen(true)}
      >
        <span className="certification-badge-frame">
          <img className="certification-badge" src={src} alt={alt} width={148} height={148} />
        </span>
      </button>

      {isOpen ? (
        <div className="badge-lightbox">
          <button className="badge-lightbox-backdrop" type="button" aria-label="Close badge preview" onClick={closePreview} />
          <div className="badge-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="badge-lightbox-title">
            <button ref={closeButtonRef} className="badge-lightbox-close" type="button" aria-label="Close badge preview" onClick={closePreview}>
              <CloseIcon className="icon-md" />
            </button>
            <div className="badge-lightbox-image-frame">
              <img src={src} alt={alt} width={640} height={640} />
            </div>
            <p id="badge-lightbox-title">{name}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
