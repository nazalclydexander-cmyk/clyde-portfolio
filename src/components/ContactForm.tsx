"use client";

import Script from "next/script";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRightIcon } from "@/components/Icons";

export default function ContactForm() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!turnstileReady || !turnstileSiteKey || !widgetContainerRef.current || widgetIdRef.current || !window.turnstile) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token: string) => {
        setTurnstileToken(token);
        setError("");
      },
      "error-callback": () => {
        setTurnstileToken("");
        setError("Unable to verify your submission right now. Please try again.");
      },
      "expired-callback": () => {
        setTurnstileToken("");
      },
    });
  }, [turnstileReady, turnstileSiteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!turnstileSiteKey) {
      setError("This contact form is not available right now. Please try again later.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the verification before sending your message.");
      return;
    }

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          website,
          turnstileToken,
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(result?.error || "Unable to send your message. Please try again.");

        if (response.status === 403 && widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
          setTurnstileToken("");
        }

        return;
      }

      setSuccess("Thanks. Your message has been sent successfully.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setWebsite("");
      setTurnstileToken("");

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } catch {
      setError("Unable to send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setTurnstileReady(true)}
      />
      <div className="form-row">
        <div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" type="text" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Clyde Nazal…" maxLength={100} /></div>
        <div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" type="email" required autoComplete="email" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Example: clyde@example.com…" maxLength={254} /></div>
      </div>
      <div className="field"><label htmlFor="contact-subject">Subject <span className="muted">(optional)</span></label><input id="contact-subject" name="subject" type="text" autoComplete="off" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Example: Cloud support role…" maxLength={150} /></div>
      <div className="field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" required autoComplete="off" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Example: I need help stabilizing a support workflow…" minLength={10} maxLength={5000} /></div>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>
      <div className="field">
        <div ref={widgetContainerRef} className="turnstile-widget" />
        {!turnstileSiteKey && <p className="field-hint">Turnstile is not configured for this environment.</p>}
      </div>
      {error && <div className="form-message form-error" role="alert" aria-live="assertive">{error}</div>}
      {success && <div className="form-message form-success" role="status" aria-live="polite">{success}</div>}
      <div><button type="submit" disabled={loading || !turnstileSiteKey} className="button">{loading ? "Sending…" : "Send inquiry"}{!loading && <ArrowUpRightIcon className="icon-sm" />}</button></div>
    </form>
  );
}
