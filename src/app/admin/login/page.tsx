"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { setError(loginError.message); setLoading(false); return; }
    router.replace("/admin");
  }
  return <main className="login-page">
    <section className="login-context" aria-label="Portfolio administration"><Link href="/" className="brand-mark"><span className="brand-symbol">C</span><span>Clyde / admin</span></Link><blockquote>Keep the portfolio accurate, current, and ready to share.</blockquote><p>SECURE CONTENT WORKSPACE / SUPABASE AUTH</p></section>
    <section className="login-panel"><div className="login-card"><p className="eyebrow">Portfolio administration</p><h1>Welcome back.</h1><p>Sign in to manage projects, skills, and messages.</p><form onSubmit={handleLogin} className="login-form"><div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" /></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div>{error && <div className="admin-notice notice-error" role="alert">{error}</div>}<button type="submit" disabled={loading} className="button">{loading ? "Signing in…" : "Sign in"}</button></form><Link className="login-back" href="/">Back to portfolio</Link></div></section>
  </main>;
}
