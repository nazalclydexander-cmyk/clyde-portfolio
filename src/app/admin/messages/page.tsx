"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminShell, { AdminNotice, StatusBadge } from "@/components/AdminShell";
import { MailIcon, TrashIcon } from "@/components/Icons";

type Message = { id: string; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string };

export default function AdminMessages() {
  const router = useRouter(); const [messages, setMessages] = useState<Message[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const loadMessages = useCallback(async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) { router.replace("/admin/login"); return; } const { data, error: loadError } = await supabase.from("messages").select("*").order("created_at", { ascending: false }); if (loadError) { setError(loadError.message); setLoading(false); return; } setMessages(data || []); setLoading(false); }, [router]);
  useEffect(() => {
    let active = true;
    async function initializeMessages() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/admin/login"); return; }
      const { data, error: loadError } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
      if (!active) return;
      if (loadError) { setError(loadError.message); setLoading(false); return; }
      setMessages(data || []); setLoading(false);
    }
    void initializeMessages();
    return () => { active = false; };
  }, [router]);
  async function toggleRead(message: Message) { setError(""); setSuccess(""); const { error: updateError } = await supabase.from("messages").update({ is_read: !message.is_read }).eq("id", message.id); if (updateError) { setError(updateError.message); return; } setSuccess(message.is_read ? "Message marked as unread." : "Message marked as read."); await loadMessages(); }
  async function deleteMessage(message: Message) { if (!window.confirm(`Delete message from ${message.name}?`)) return; setError(""); setSuccess(""); const { error: deleteError } = await supabase.from("messages").delete().eq("id", message.id); if (deleteError) { setError(deleteError.message); return; } setSuccess("Message deleted successfully."); await loadMessages(); }
  if (loading) return <main className="loading-screen">Loading messages…</main>;
  const unreadCount = messages.filter((message) => !message.is_read).length;
  return <AdminShell title="Messages" description="Review and respond to enquiries submitted through your portfolio." actions={<span className="status-badge status-unread"><span />{unreadCount} unread</span>}>
    {error && <AdminNotice type="error">{error}</AdminNotice>}{success && <AdminNotice type="success">{success}</AdminNotice>}
    <section className="admin-section"><div className="admin-section-head"><h2>Inbox</h2><span>{messages.length} total</span></div><div className="data-list">
      {messages.length ? messages.map((item) => <article key={item.id} className={`data-row message-item ${item.is_read ? "" : "unread"}`}><div className="data-row-main"><div className="data-row-title"><h3>{item.subject || "No subject"}</h3>{!item.is_read && <StatusBadge status="unread" />}</div><div className="message-meta"><span>{item.name}</span><a href={`mailto:${item.email}`}>{item.email}</a><time>{new Date(item.created_at).toLocaleString()}</time></div><p className="message-body">{item.message}</p></div><div className="row-actions"><button type="button" onClick={() => toggleRead(item)} className="button button-secondary button-small">{item.is_read ? "Mark unread" : "Mark read"}</button><a href={`mailto:${item.email}`} className="button button-secondary button-small"><MailIcon className="icon-sm" />Reply</a><button type="button" onClick={() => deleteMessage(item)} className="button button-danger button-small" aria-label={`Delete message from ${item.name}`}><TrashIcon className="icon-sm" />Delete</button></div></article>) : <div className="empty-state">No messages yet.</div>}
    </div></section>
  </AdminShell>;
}
