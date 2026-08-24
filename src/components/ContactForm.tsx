"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowUpRightIcon } from "@/components/Icons";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setSuccess(""); setError("");
    const { error: submissionError } = await supabase.from("messages").insert({ name: name.trim(), email: email.trim(), subject: subject.trim() || null, message: message.trim() });
    if (submissionError) { setError("Unable to send your message. Please try again."); console.error(submissionError); setLoading(false); return; }
    setSuccess("Thanks — your message has been sent successfully.");
    setName(""); setEmail(""); setSubject(""); setMessage(""); setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="form-row">
        <div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" type="text" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></div>
        <div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
      </div>
      <div className="field"><label htmlFor="contact-subject">Subject <span className="muted">(optional)</span></label><input id="contact-subject" type="text" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What would you like to discuss?" /></div>
      <div className="field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share a few details about the role, project, or problem..." /></div>
      {error && <div className="form-message form-error" role="alert">{error}</div>}
      {success && <div className="form-message form-success" role="status">{success}</div>}
      <div><button type="submit" disabled={loading} className="button">{loading ? "Sending…" : "Send message"}{!loading && <ArrowUpRightIcon className="icon-sm" />}</button></div>
    </form>
  );
}
