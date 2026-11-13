"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { AdminNotice } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { DEFAULT_FOOTER_SETTINGS, FOOTER_SETTINGS_ADMIN_SELECT, FOOTER_SETTINGS_TABLE } from "@/lib/footerSettings";

type FooterForm = {
  enabled: boolean;
  title: string;
  subtitle: string;
  show_about_link: boolean;
  show_capabilities_link: boolean;
  show_work_link: boolean;
  show_contact_link: boolean;
  show_certifications_link: boolean;
  show_github_link: boolean;
};

const emptyForm: FooterForm = {
  enabled: DEFAULT_FOOTER_SETTINGS.enabled,
  title: DEFAULT_FOOTER_SETTINGS.title || "",
  subtitle: "",
  show_about_link: DEFAULT_FOOTER_SETTINGS.show_about_link,
  show_capabilities_link: DEFAULT_FOOTER_SETTINGS.show_capabilities_link,
  show_work_link: DEFAULT_FOOTER_SETTINGS.show_work_link,
  show_contact_link: DEFAULT_FOOTER_SETTINGS.show_contact_link,
  show_certifications_link: DEFAULT_FOOTER_SETTINGS.show_certifications_link,
  show_github_link: DEFAULT_FOOTER_SETTINGS.show_github_link,
};

export default function AdminFooter() {
  const router = useRouter();
  const [form, setForm] = useState<FooterForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/admin/login");
      return;
    }

    const { data, error: loadError } = await supabase
      .from(FOOTER_SETTINGS_TABLE)
      .select(FOOTER_SETTINGS_ADMIN_SELECT)
      .eq("singleton", true)
      .maybeSingle();

    if (loadError) {
      setError(`${loadError.message} Run supabase/footer_settings_setup.sql in the Supabase SQL Editor.`);
      setLoading(false);
      return;
    }

    if (data) {
      setForm({
        enabled: data.enabled ?? emptyForm.enabled,
        title: data.title ?? emptyForm.title,
        subtitle: data.subtitle ?? emptyForm.subtitle,
        show_about_link: data.show_about_link ?? emptyForm.show_about_link,
        show_capabilities_link: data.show_capabilities_link ?? emptyForm.show_capabilities_link,
        show_work_link: data.show_work_link ?? emptyForm.show_work_link,
        show_contact_link: data.show_contact_link ?? emptyForm.show_contact_link,
        show_certifications_link: data.show_certifications_link ?? emptyForm.show_certifications_link,
        show_github_link: data.show_github_link ?? emptyForm.show_github_link,
      });
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function update<K extends keyof FooterForm>(key: K, value: FooterForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError("Footer title is required.");
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const { error: saveError } = await supabase
      .from(FOOTER_SETTINGS_TABLE)
      .upsert({
        singleton: true,
        enabled: form.enabled,
        title,
        subtitle: form.subtitle?.trim() || null,
        show_about_link: form.show_about_link,
        show_capabilities_link: form.show_capabilities_link,
        show_work_link: form.show_work_link,
        show_contact_link: form.show_contact_link,
        show_certifications_link: form.show_certifications_link,
        show_github_link: form.show_github_link,
        updated_at: new Date().toISOString(),
      }, { onConflict: "singleton" });

    if (saveError) {
      setError(`${saveError.message} Make sure supabase/footer_settings_setup.sql has been run.`);
      setSaving(false);
      return;
    }

    setSuccess("Footer settings saved successfully.");
    setSaving(false);
    await loadSettings();
  }

  if (loading) return <main className="loading-screen">Loading footer settings…</main>;

  return (
    <AdminShell
      title="Footer"
      description="Edit the public footer content and choose which navigation links are visible."
      actions={<span className={`status-badge ${form.enabled ? "status-active" : "status-archived"}`}><span />{form.enabled ? "Visible publicly" : "Hidden publicly"}</span>}
    >
      {error && <AdminNotice type="error">{error}</AdminNotice>}
      {success && <AdminNotice type="success">{success}</AdminNotice>}

      <section className="admin-section admin-panel">
        <div className="admin-panel-head">
          <h2>Footer content</h2>
        </div>
        <form onSubmit={handleSubmit} className="admin-form">
          <section className="form-section">
            <h3 className="form-section-title">Content</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="footer-title">Footer title</label>
                <textarea id="footer-title" rows={2} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Practical cloud, support, and web systems for real operations." />
              </div>
              <div className="field">
                <label htmlFor="footer-subtitle">Footer subtitle <span className="muted">(optional)</span></label>
                <input id="footer-subtitle" value={form.subtitle || ""} onChange={(event) => update("subtitle", event.target.value)} placeholder="Leave blank to use your profile focus and location." />
                <p className="field-hint">When blank, the public footer uses the profile focus and location automatically.</p>
              </div>
              <label className="checkbox-field">
                <input type="checkbox" checked={form.enabled} onChange={(event) => update("enabled", event.target.checked)} />
                <span><strong>Show footer publicly</strong><small className="field-hint">Turn this off to hide the entire footer from the public portfolio.</small></span>
              </label>
            </div>
          </section>

          <section className="form-section">
            <h3 className="form-section-title">Footer links</h3>
            <div className="form-grid two-col">
              <label className="checkbox-field"><input type="checkbox" checked={form.show_about_link} onChange={(event) => update("show_about_link", event.target.checked)} /><span><strong>About</strong><small className="field-hint">Link to the About section.</small></span></label>
              <label className="checkbox-field"><input type="checkbox" checked={form.show_capabilities_link} onChange={(event) => update("show_capabilities_link", event.target.checked)} /><span><strong>Capabilities</strong><small className="field-hint">Link to the capabilities section.</small></span></label>
              <label className="checkbox-field"><input type="checkbox" checked={form.show_work_link} onChange={(event) => update("show_work_link", event.target.checked)} /><span><strong>Work</strong><small className="field-hint">Link to the projects section.</small></span></label>
              <label className="checkbox-field"><input type="checkbox" checked={form.show_contact_link} onChange={(event) => update("show_contact_link", event.target.checked)} /><span><strong>Contact</strong><small className="field-hint">Link to the contact section.</small></span></label>
              <label className="checkbox-field"><input type="checkbox" checked={form.show_certifications_link} onChange={(event) => update("show_certifications_link", event.target.checked)} /><span><strong>Certifications</strong><small className="field-hint">Shown when at least one certification is available.</small></span></label>
              <label className="checkbox-field"><input type="checkbox" checked={form.show_github_link} onChange={(event) => update("show_github_link", event.target.checked)} /><span><strong>GitHub</strong><small className="field-hint">Shown only when a GitHub URL exists in the profile.</small></span></label>
            </div>
          </section>

          <div className="form-section">
            <button type="submit" disabled={saving} className="button">{saving ? "Saving…" : "Save footer settings"}</button>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
