"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ExternalLinkIcon, FolderIcon, GridIcon, LogOutIcon, MailIcon, ProfileIcon, ToolIcon } from "@/components/Icons";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: GridIcon },
  { href: "/admin/profile", label: "Profile", icon: ProfileIcon },
  { href: "/admin/projects", label: "Projects", icon: FolderIcon },
  { href: "/admin/skills", label: "Skills", icon: ToolIcon },
  { href: "/admin/messages", label: "Messages", icon: MailIcon },
];

export default function AdminShell({ children, title, description, eyebrow, actions }: { children: ReactNode; title: string; description: string; eyebrow?: string; actions?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="admin-root">
      <a className="skip-link" href="#admin-content">Skip to admin content</a>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <Link href="/admin" className="brand-mark">
            <span className="brand-symbol">C</span>
            <span>Clyde</span><span className="admin-wordmark">/ admin</span>
          </Link>
          <nav className="admin-nav" aria-label="Admin navigation">
            {navigation.map(({ href, label, icon: NavIcon }) => {
              const active = pathname === href;
              return <Link key={href} href={href} className={active ? "active" : ""}><NavIcon className="icon-sm" />{label}</Link>;
            })}
          </nav>
        </div>
        <div className="admin-sidebar-bottom">
          <Link href="/" target="_blank"><ExternalLinkIcon className="icon-sm" />View portfolio</Link>
          <button type="button" onClick={handleLogout}><LogOutIcon className="icon-sm" />Log out</button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-mobile-nav">
          <Link href="/admin" className="brand-mark"><span className="brand-symbol">C</span><span>Admin</span></Link>
          <nav aria-label="Admin mobile navigation">
            {navigation.map(({ href, label, icon: NavIcon }) => <Link key={href} href={href} aria-label={label} className={pathname === href ? "active" : ""}><NavIcon className="icon-md" /></Link>)}
          </nav>
        </div>
        <header className="admin-page-header">
          <div>
            <p className="eyebrow">{eyebrow || "Portfolio administration"}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {actions && <div className="admin-header-actions">{actions}</div>}
        </header>
        <div id="admin-content" className="admin-content">{children}</div>
      </div>
    </main>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><span />{status}</span>;
}

export function AdminNotice({ type, children }: { type: "error" | "success"; children: ReactNode }) {
  return <div className={`admin-notice notice-${type}`} role={type === "error" ? "alert" : "status"}>{children}</div>;
}
