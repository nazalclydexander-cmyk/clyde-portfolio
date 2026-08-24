"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminShell, { AdminNotice } from "@/components/AdminShell";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/Icons";

type Skill = { id: string; name: string; category: string | null; proficiency: number | null; sort_order: number };
const emptyForm = { name: "", category: "", proficiency: "", sort_order: 0 };

export default function ManageSkills() {
  const router = useRouter(); const [skills, setSkills] = useState<Skill[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [editingId, setEditingId] = useState<string | null>(null); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [form, setForm] = useState(emptyForm);
  const loadSkills = useCallback(async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) { router.replace("/admin/login"); return; } const { data, error: loadError } = await supabase.from("skills").select("*").order("sort_order", { ascending: true }); if (loadError) { setError(loadError.message); setLoading(false); return; } setSkills(data || []); setLoading(false); }, [router]);
  useEffect(() => {
    let active = true;
    async function initializeSkills() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/admin/login"); return; }
      const { data, error: loadError } = await supabase.from("skills").select("*").order("sort_order", { ascending: true });
      if (!active) return;
      if (loadError) { setError(loadError.message); setLoading(false); return; }
      setSkills(data || []); setLoading(false);
    }
    void initializeSkills();
    return () => { active = false; };
  }, [router]);
  function resetForm() { setEditingId(null); setForm(emptyForm); setError(""); }
  function editSkill(skill: Skill) { setEditingId(skill.id); setForm({ name: skill.name, category: skill.category || "", proficiency: skill.proficiency !== null ? String(skill.proficiency) : "", sort_order: skill.sort_order }); setError(""); setSuccess(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(""); setSuccess(""); if (!form.name.trim()) { setError("Skill name is required."); setSaving(false); return; } const skillData = { name: form.name.trim(), category: form.category.trim() || null, proficiency: form.proficiency === "" ? null : Number(form.proficiency), sort_order: Number(form.sort_order) }; if (skillData.proficiency !== null && (skillData.proficiency < 1 || skillData.proficiency > 100)) { setError("Proficiency must be between 1 and 100."); setSaving(false); return; } const result = editingId ? await supabase.from("skills").update(skillData).eq("id", editingId) : await supabase.from("skills").insert(skillData); if (result.error) { setError(result.error.message); setSaving(false); return; } setSuccess(editingId ? "Skill updated successfully." : "Skill added successfully."); setEditingId(null); setForm(emptyForm); setSaving(false); await loadSkills(); }
  async function deleteSkill(id: string, name: string) { if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return; setError(""); setSuccess(""); const { error: deleteError } = await supabase.from("skills").delete().eq("id", id); if (deleteError) { setError(deleteError.message); return; } setSuccess("Skill deleted successfully."); if (editingId === id) resetForm(); await loadSkills(); }
  if (loading) return <main className="loading-screen">Loading skills…</main>;

  return <AdminShell title="Skills" description="Maintain the capability groups displayed on your public portfolio." actions={<button type="button" onClick={resetForm} className="button button-secondary button-small"><PlusIcon className="icon-sm" />New skill</button>}>
    {error && <AdminNotice type="error">{error}</AdminNotice>}{success && <AdminNotice type="success">{success}</AdminNotice>}
    <section className="admin-section admin-panel"><div className="admin-panel-head"><h2>{editingId ? "Edit skill" : "Add skill"}</h2>{editingId && <button type="button" onClick={resetForm} className="button button-ghost button-small">Cancel editing</button>}</div><div className="admin-panel-body"><form onSubmit={handleSubmit} className="form-grid two-col"><div className="field"><label htmlFor="skill-name">Name</label><input id="skill-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="AWS" /></div><div className="field"><label htmlFor="skill-category">Category</label><input id="skill-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Cloud" /><p className="field-hint">Skills are grouped by this value on the portfolio.</p></div><div className="field"><label htmlFor="skill-proficiency">Proficiency <span className="muted">(optional)</span></label><input id="skill-proficiency" type="number" min="1" max="100" value={form.proficiency} onChange={(event) => setForm({ ...form, proficiency: event.target.value })} placeholder="80" /><p className="field-hint">Stored for administration; no invented progress bars are shown.</p></div><div className="field"><label htmlFor="skill-order">Sort order</label><input id="skill-order" type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} /></div><div className="field-full"><button type="submit" disabled={saving} className="button">{saving ? "Saving…" : editingId ? "Update skill" : "Add skill"}</button></div></form></div></section>
    <section className="admin-section"><div className="admin-section-head"><h2>All skills</h2><span>{skills.length} {skills.length === 1 ? "skill" : "skills"}</span></div><div className="data-list">{skills.length ? skills.map((skill) => <div className="data-row" key={skill.id}><div className="data-row-main"><div className="data-row-title"><h3>{skill.name}</h3><span className="status-badge">{skill.category || "Uncategorized"}</span></div><p>Sort order: {skill.sort_order}{skill.proficiency !== null ? ` · Proficiency: ${skill.proficiency}%` : ""}</p></div><div className="row-actions"><button type="button" onClick={() => editSkill(skill)} className="button button-secondary button-small"><EditIcon className="icon-sm" />Edit</button><button type="button" onClick={() => deleteSkill(skill.id, skill.name)} className="button button-danger button-small"><TrashIcon className="icon-sm" />Delete</button></div></div>) : <div className="empty-state">No skills found.</div>}</div></section>
  </AdminShell>;
}
