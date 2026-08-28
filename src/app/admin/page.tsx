"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AdminShell, { StatusBadge } from "@/components/AdminShell";
import { ArrowUpRightIcon, FolderIcon, MailIcon, ToolIcon } from "@/components/Icons";

type Project = { id: string; title: string; status: string; created_at: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [skillCount, setSkillCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.replace("/admin/login"); return; }
      const [projectsResult, skillsResult, messagesResult, unreadResult, recentProjectsResult] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("skills").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("projects").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setProjectCount(projectsResult.count || 0); setSkillCount(skillsResult.count || 0); setMessageCount(messagesResult.count || 0); setUnreadCount(unreadResult.count || 0); setProjects(recentProjectsResult.data || []); setLoading(false);
    }
    loadDashboard();
  }, [router]);

  if (loading) return <main className="loading-screen">Loading workspace…</main>;

  return (
    <AdminShell title="Dashboard" description="A clear view of your portfolio content and recent activity.">
      <section className="admin-section" aria-label="Portfolio statistics">
        <div className="admin-stats">
          <StatCard label="Projects" value={projectCount} note="Total entries" icon={<FolderIcon className="icon-sm" />} />
          <StatCard label="Skills" value={skillCount} note="Across all categories" icon={<ToolIcon className="icon-sm" />} />
          <StatCard label="Messages" value={messageCount} note="Total received" icon={<MailIcon className="icon-sm" />} />
          <StatCard label="Unread" value={unreadCount} note="Needs review" icon={<span className="status-badge status-unread"><span /></span>} />
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head"><h2>Quick access</h2><span>Content management</span></div>
        <div className="management-grid">
          <ManagementLink href="/admin/profile" title="Manage profile" description="Update the hero copy, metadata, and professional portrait." />
          <ManagementLink href="/admin/projects" title="Manage projects" description="Create, edit, publish, and order project work." />
          <ManagementLink href="/admin/skills" title="Manage skills" description="Organize the capabilities shown on the portfolio." />
          <ManagementLink href="/admin/messages" title="Review messages" description="Read and respond to portfolio enquiries." />
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head"><h2>Recent projects</h2><Link href="/admin/projects" className="muted">View all</Link></div>
        <div className="data-list">
          {projects.length ? projects.map((project) => (
            <div className="data-row" key={project.id}><div className="data-row-main"><div className="data-row-title"><h3>{project.title}</h3><StatusBadge status={project.status} /></div><p>Created {new Date(project.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</p></div><Link className="button button-ghost button-small" href="/admin/projects">Manage</Link></div>
          )) : <div className="empty-state">No projects found.</div>}
        </div>
      </section>
    </AdminShell>
  );
}

function StatCard({ label, value, note, icon }: { label: string; value: number; note: string; icon: React.ReactNode }) {
  return <div className="stat-card"><div className="stat-card-label"><span>{label}</span>{icon}</div><p className="stat-card-value">{String(value).padStart(2, "0")}</p><p className="stat-card-note">{note}</p></div>;
}

function ManagementLink({ href, title, description }: { href: string; title: string; description: string }) {
  return <Link className="management-link" href={href}><h3>{title}<ArrowUpRightIcon className="icon-sm" /></h3><p>{description}</p></Link>;
}
