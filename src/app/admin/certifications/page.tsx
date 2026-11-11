"use client";

/* eslint-disable @next/next/no-img-element -- Badge URLs are stored in Supabase and may be remote. */
/* eslint-disable react-hooks/set-state-in-effect */

import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell, { AdminNotice, StatusBadge } from "@/components/AdminShell";
import { BadgeIcon, CheckIcon, EditIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/Icons";
import { supabase } from "@/lib/supabase";

type CertificationStatus = "active" | "expired" | "pending";

type Certification = {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiration_date: string | null;
  credential_id: string | null;
  verification_url: string | null;
  badge_url: string | null;
  status: CertificationStatus;
  sort_order: number;
};

type FormState = Omit<Certification, "id" | "badge_url">;

const MAX_BADGE_SIZE = 5 * 1024 * 1024;
const BADGE_BUCKET = "certification-badges";
const ALLOWED_BADGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const ALLOWED_BADGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];
const BADGE_CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

function createEmptyForm(sortOrder: number): FormState {
  return {
    name: "",
    issuer: "",
    issue_date: "",
    expiration_date: "",
    credential_id: "",
    verification_url: "",
    status: "active",
    sort_order: Math.max(1, sortOrder),
  };
}

function getNextSortOrder(items: Certification[]) {
  return Math.max(0, ...items.map((item) => item.sort_order || 0)) + 1;
}

function validateBadgeFile(file: File) {
  if (file.size > MAX_BADGE_SIZE) return "Badge images must be 5 MB or smaller.";

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const typeIsAllowed = ALLOWED_BADGE_TYPES.includes(file.type);
  const typeIsMissingButExtensionIsAllowed = !file.type && ALLOWED_BADGE_EXTENSIONS.includes(extension);
  if (!typeIsAllowed && !typeIsMissingButExtensionIsAllowed) {
    return "Badge images must be PNG, JPG, WebP, or SVG files.";
  }

  return "";
}

function getBadgeContentType(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return file.type || BADGE_CONTENT_TYPES[extension] || "application/octet-stream";
}

function getBadgeStoragePath(badgeUrl: string | null | undefined) {
  if (!badgeUrl) return null;

  try {
    const url = new URL(badgeUrl);
    const prefix = `/storage/v1/object/public/${BADGE_BUCKET}/`;
    if (!url.pathname.startsWith(prefix)) return null;
    return decodeURIComponent(url.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

async function removeBadgeFile(badgeUrl: string | null | undefined) {
  const path = getBadgeStoragePath(badgeUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(BADGE_BUCKET).remove([path]);
  if (error) throw error;
}

function formatCertificationDate(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export default function ManageCertifications() {
  const router = useRouter();
  const badgeInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Certification[]>([]);
  const [form, setForm] = useState<FormState>(() => createEmptyForm(1));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<File | null>(null);
  const [selectedBadgePreviewUrl, setSelectedBadgePreviewUrl] = useState("");
  const [badgeRemoved, setBadgeRemoved] = useState(false);
  const [isBadgeDragging, setIsBadgeDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentBadgeUrl = editingId ? items.find((item) => item.id === editingId)?.badge_url || "" : "";
  const visibleBadgePreview = selectedBadgePreviewUrl || (badgeRemoved ? "" : currentBadgeUrl);

  const loadCertifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/admin/login");
      return [] as Certification[];
    }

    const { data, error: loadError } = await supabase.from("certifications").select("*").order("sort_order", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return [] as Certification[];
    }

    const nextItems = (data || []) as Certification[];
    setItems(nextItems);
    setLoading(false);
    return nextItems;
  }, [router]);

  useEffect(() => {
    void loadCertifications();
  }, [loadCertifications]);

  useEffect(() => {
    return () => {
      if (selectedBadgePreviewUrl) URL.revokeObjectURL(selectedBadgePreviewUrl);
    };
  }, [selectedBadgePreviewUrl]);

  function clearSelectedBadge() {
    setSelectedBadge(null);
    setSelectedBadgePreviewUrl("");
    if (badgeInputRef.current) badgeInputRef.current.value = "";
  }

  function resetForm(nextItems = items) {
    setEditingId(null);
    setForm(createEmptyForm(getNextSortOrder(nextItems)));
    clearSelectedBadge();
    setBadgeRemoved(false);
    setIsBadgeDragging(false);
    setError("");
  }

  function startNewCertification() {
    resetForm();
    setSuccess("");
  }

  function editCertification(item: Certification) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      issuer: item.issuer,
      issue_date: item.issue_date,
      expiration_date: item.expiration_date || "",
      credential_id: item.credential_id || "",
      verification_url: item.verification_url || "",
      status: item.status,
      sort_order: item.sort_order,
    });
    clearSelectedBadge();
    setBadgeRemoved(false);
    setIsBadgeDragging(false);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectBadgeFile(file: File | null) {
    if (!file) return;

    const validationError = validateBadgeFile(file);
    if (validationError) {
      if (badgeInputRef.current) badgeInputRef.current.value = "";
      clearSelectedBadge();
      setError(validationError);
      return;
    }

    setSelectedBadge(file);
    setSelectedBadgePreviewUrl(URL.createObjectURL(file));
    setBadgeRemoved(false);
    setError("");
  }

  function handleBadgeChange(event: ChangeEvent<HTMLInputElement>) {
    selectBadgeFile(event.target.files?.[0] || null);
  }

  function handleBadgeDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsBadgeDragging(true);
  }

  function handleBadgeDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setIsBadgeDragging(true);
  }

  function handleBadgeDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsBadgeDragging(false);
  }

  function handleBadgeDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsBadgeDragging(false);
    selectBadgeFile(event.dataTransfer.files?.[0] || null);
  }

  function openBadgePicker() {
    badgeInputRef.current?.click();
  }

  function removeBadge() {
    if (selectedBadge) {
      clearSelectedBadge();
      setError("");
      return;
    }

    if (currentBadgeUrl) {
      setBadgeRemoved(true);
      setError("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const currentEditingId = editingId;

    try {
      if (!form.name.trim() || !form.issuer.trim() || !form.issue_date) {
        throw new Error("Name, issuer, and issue date are required.");
      }

      const previousBadgeUrl = currentEditingId ? items.find((item) => item.id === currentEditingId)?.badge_url || null : null;
      let badgeUrl = currentEditingId && !badgeRemoved ? previousBadgeUrl : null;
      let uploadedBadgePath = "";

      if (selectedBadge) {
        const validationError = validateBadgeFile(selectedBadge);
        if (validationError) throw new Error(validationError);

        const extension = selectedBadge.name.split(".").pop()?.toLowerCase() || "bin";
        const filePath = `certifications/${crypto.randomUUID()}.${extension}`;
        const upload = await supabase.storage.from(BADGE_BUCKET).upload(filePath, selectedBadge, {
          cacheControl: "3600",
          upsert: false,
          contentType: getBadgeContentType(selectedBadge),
        });

        if (upload.error) throw upload.error;
        uploadedBadgePath = filePath;
        badgeUrl = supabase.storage.from(BADGE_BUCKET).getPublicUrl(filePath).data.publicUrl;
      }

      const payload = {
        name: form.name.trim(),
        issuer: form.issuer.trim(),
        issue_date: form.issue_date,
        expiration_date: form.expiration_date || null,
        credential_id: form.credential_id?.trim() || null,
        verification_url: form.verification_url?.trim() || null,
        badge_url: badgeUrl,
        status: form.status,
        sort_order: Number(form.sort_order) || 1,
      };

      const result = currentEditingId
        ? await supabase.from("certifications").update(payload).eq("id", currentEditingId)
        : await supabase.from("certifications").insert(payload);

      if (result.error) {
        if (uploadedBadgePath) {
          await supabase.storage.from(BADGE_BUCKET).remove([uploadedBadgePath]);
        }
        throw result.error;
      }

      let cleanupWarning = "";
      if (previousBadgeUrl && (selectedBadge || badgeRemoved)) {
        try {
          await removeBadgeFile(previousBadgeUrl);
        } catch {
          cleanupWarning = "Certification saved, but the previous badge file could not be removed.";
        }
      }

      const nextItems = await loadCertifications();
      resetForm(nextItems);
      setSuccess(cleanupWarning || (currentEditingId ? "Certification updated." : "Certification added."));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save certification.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCertification(item: Certification) {
    if (!window.confirm(`Delete “${item.name}”?`)) return;

    const { error: deleteError } = await supabase.from("certifications").delete().eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    let cleanupWarning = "";
    try {
      await removeBadgeFile(item.badge_url);
    } catch {
      cleanupWarning = "Certification deleted, but its badge file could not be removed.";
    }

    await loadCertifications();
    setSuccess(cleanupWarning || "Certification deleted.");
  }

  if (loading) return <main className="loading-screen">Loading certifications…</main>;

  return (
    <AdminShell
      title="Certifications"
      description="Add verified credentials and upload public badge images."
      actions={<button className="button button-secondary button-small" type="button" onClick={startNewCertification}><PlusIcon className="icon-sm" />New certification</button>}
    >
      {error && <AdminNotice type="error">{error}</AdminNotice>}
      {success && <AdminNotice type="success">{success}</AdminNotice>}

      <section className="admin-section admin-panel">
        <div className="admin-panel-head">
          <h2>{editingId ? "Edit certification" : "Add certification"}</h2>
        </div>
        <div className="admin-panel-body">
          <form onSubmit={submit} className="form-grid two-col">
            <div className="field">
              <label htmlFor="cert-name">Name</label>
              <input id="cert-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="cert-issuer">Issuer</label>
              <input id="cert-issuer" required value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="cert-issued">Issue date</label>
              <input id="cert-issued" required type="date" value={form.issue_date} onChange={(event) => setForm({ ...form, issue_date: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="cert-expires">Expiration date</label>
              <input id="cert-expires" type="date" value={form.expiration_date || ""} onChange={(event) => setForm({ ...form, expiration_date: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="cert-id">Credential ID</label>
              <input id="cert-id" value={form.credential_id || ""} onChange={(event) => setForm({ ...form, credential_id: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="cert-url">Verification URL</label>
              <input id="cert-url" type="url" value={form.verification_url || ""} onChange={(event) => setForm({ ...form, verification_url: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="cert-status">Status</label>
              <select id="cert-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CertificationStatus })}>
                <option value="active">Active</option>
                <option value="pending">Pending verification</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="cert-order">Sort order</label>
              <input id="cert-order" type="number" min="1" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} />
            </div>

            <div className="field-full">
              <div
                className={`badge-upload-zone${isBadgeDragging ? " is-dragging" : ""}${visibleBadgePreview ? " has-preview" : ""}`}
                onDragEnter={handleBadgeDragEnter}
                onDragOver={handleBadgeDragOver}
                onDragLeave={handleBadgeDragLeave}
                onDrop={handleBadgeDrop}
              >
                <label className="badge-upload-label" htmlFor="cert-badge">
                  <span className="badge-upload-heading"><span className="badge-upload-icon"><UploadIcon className="icon-md" /></span>Certification badge</span>
                  <span className="badge-upload-action">Upload badge image</span>
                  <span className="badge-upload-prompt">Drag and drop an image here, or browse files</span>
                  <span id="cert-badge-help" className="badge-upload-help">PNG, JPG, WebP, or SVG · up to 5 MB</span>
                  {badgeRemoved ? <span className="badge-upload-removed">Current badge will be removed when you save. Choose another image to keep a badge.</span> : null}
                  {visibleBadgePreview ? (
                    <span className="badge-upload-preview">
                      <img src={visibleBadgePreview} alt="Certification badge thumbnail preview" width={112} height={112} />
                    </span>
                  ) : null}
                </label>
                <input
                  ref={badgeInputRef}
                  className="badge-file-input"
                  id="cert-badge"
                  type="file"
                  aria-describedby="cert-badge-help"
                  accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleBadgeChange}
                />

                {visibleBadgePreview || selectedBadge ? (
                  <div className="badge-upload-footer">
                    <div className="badge-file-summary">
                      <span className="badge-file-name">{selectedBadge ? selectedBadge.name : "Current badge image"}</span>
                      <span className="badge-file-state">{selectedBadge ? "Ready to upload when you save" : "Saved badge"}</span>
                    </div>
                    <div className="badge-upload-actions">
                      <button className="button button-secondary button-small" type="button" onClick={openBadgePicker}>Replace image</button>
                      <button className="button button-ghost button-small" type="button" onClick={removeBadge}>Remove image</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="field-full">
              <button className="button" type="submit" disabled={saving}>
                <CheckIcon className="icon-sm" />
                {saving ? "Saving certification…" : editingId ? "Save certification changes" : "Save certification"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>All certifications</h2>
          <span>{items.length} {items.length === 1 ? "entry" : "entries"}</span>
        </div>
        <div className="data-list certification-admin-list">
          {items.length ? items.map((item) => (
            <div className="data-row certification-admin-card" key={item.id}>
              <div className="certification-admin-badge">
                {item.badge_url ? (
                  <img src={item.badge_url} alt={`${item.name} badge`} width={96} height={96} />
                ) : (
                  <span className="certification-admin-badge-empty"><BadgeIcon className="icon-md" />No badge</span>
                )}
              </div>
              <div className="data-row-main certification-admin-main">
                <div className="data-row-title">
                  <h3>{item.name}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="certification-admin-issuer">{item.issuer}</p>
                <dl className="certification-admin-meta">
                  <div><dt>Issued</dt><dd>{formatCertificationDate(item.issue_date)}</dd></div>
                  <div><dt>Expires</dt><dd>{formatCertificationDate(item.expiration_date)}</dd></div>
                  {item.credential_id ? <div><dt>Credential ID</dt><dd>{item.credential_id}</dd></div> : null}
                </dl>
              </div>
              <div className="row-actions certification-admin-actions">
                <button className="button button-secondary button-small" type="button" onClick={() => editCertification(item)}><EditIcon className="icon-sm" />Edit</button>
                <button className="button button-danger button-small" type="button" onClick={() => removeCertification(item)}><TrashIcon className="icon-sm" />Delete</button>
              </div>
            </div>
          )) : <div className="empty-state">No certifications added yet.</div>}
        </div>
      </section>
    </AdminShell>
  );
}
