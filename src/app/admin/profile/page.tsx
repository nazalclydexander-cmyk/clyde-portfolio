"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfileTableErrorMessage, PORTFOLIO_PROFILE_ADMIN_SELECT, PORTFOLIO_PROFILE_TABLE, type PortfolioProfileAdmin } from "@/lib/portfolioProfile";
import { supabase } from "@/lib/supabase";
import AdminShell, { AdminNotice } from "@/components/AdminShell";
import { ProfileIcon, TrashIcon, UploadIcon } from "@/components/Icons";

type ProfileForm = {
  display_name: string;
  headline: string;
  short_bio: string;
  availability_text: string;
  github_url: string;
  location: string;
  focus: string;
  environment: string;
  builds: string;
  approach: string;
  profile_image_url: string;
  profile_image_path: string;
};

const emptyForm: ProfileForm = {
  display_name: "",
  headline: "",
  short_bio: "",
  availability_text: "",
  github_url: "",
  location: "",
  focus: "",
  environment: "",
  builds: "",
  approach: "",
  profile_image_url: "",
  profile_image_path: "",
};

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function AdminProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const applyProfile = useCallback((profile: PortfolioProfileAdmin | null) => {
    setProfileId(profile?.id || null);
    setForm({
      display_name: profile?.display_name || "",
      headline: profile?.headline || "",
      short_bio: profile?.short_bio || "",
      availability_text: profile?.availability_text || "",
      github_url: profile?.github_url || "",
      location: profile?.location || "",
      focus: profile?.focus || "",
      environment: profile?.environment || "",
      builds: profile?.builds || "",
      approach: profile?.approach || "",
      profile_image_url: profile?.profile_image_url || "",
      profile_image_path: profile?.profile_image_path || "",
    });
  }, []);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/admin/login");
      return;
    }

    const { data, error: loadError } = await supabase.from(PORTFOLIO_PROFILE_TABLE).select(PORTFOLIO_PROFILE_ADMIN_SELECT).eq("singleton", true).maybeSingle();
    if (loadError) {
      setError(getProfileTableErrorMessage(loadError));
      setLoading(false);
      return;
    }

    applyProfile((data as PortfolioProfileAdmin | null) || null);
    setLoading(false);
  }, [applyProfile, router]);

  useEffect(() => {
    let active = true;

    async function initializeProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error: loadError } = await supabase.from(PORTFOLIO_PROFILE_TABLE).select(PORTFOLIO_PROFILE_ADMIN_SELECT).eq("singleton", true).maybeSingle();
      if (!active) return;

      if (loadError) {
        setError(getProfileTableErrorMessage(loadError));
        setLoading(false);
        return;
      }

      applyProfile((data as PortfolioProfileAdmin | null) || null);
      setLoading(false);
    }

    void initializeProfile();
    return () => {
      active = false;
    };
  }, [applyProfile, router]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateImage(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Use a PNG, JPG, or WebP image.");
    if (file.size > MAX_FILE_SIZE) throw new Error("Profile images must be 4MB or smaller.");
  }

  function selectImage(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (!file) {
      selectImage(null);
      return;
    }

    try {
      validateImage(file);
      setError("");
      setSuccess("");
      selectImage(file);
    } catch (validationError) {
      selectImage(null);
      event.target.value = "";
      setError(validationError instanceof Error ? validationError.message : "Unable to use that image.");
    }
  }

  async function uploadProfileImage(file: File) {
    validateImage(file);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `profile/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("profile-images").upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) throw uploadError;
    const publicUrl = supabase.storage.from("profile-images").getPublicUrl(filePath).data.publicUrl;
    return { filePath, publicUrl };
  }

  async function removeStoredImage(path: string) {
    const { error: deleteError } = await supabase.storage.from("profile-images").remove([path]);
    if (deleteError) throw deleteError;
  }

  async function saveProfileRecord(payload: {
    display_name?: string | null;
    headline?: string | null;
    short_bio?: string | null;
    availability_text?: string | null;
    github_url?: string | null;
    location?: string | null;
    focus?: string | null;
    environment?: string | null;
    builds?: string | null;
    approach?: string | null;
    profile_image_url?: string | null;
    profile_image_path?: string | null;
    updated_at?: string;
  }) {
    if (profileId) {
      const { data, error } = await supabase
        .from(PORTFOLIO_PROFILE_TABLE)
        .update(payload)
        .eq("id", profileId)
        .select(PORTFOLIO_PROFILE_ADMIN_SELECT)
        .single();
      if (error) throw error;
      return data as PortfolioProfileAdmin;
    }

    const { data, error } = await supabase
      .from(PORTFOLIO_PROFILE_TABLE)
      .insert({
        singleton: true,
        ...payload,
      })
      .select(PORTFOLIO_PROFILE_ADMIN_SELECT)
      .single();
    if (error) throw error;
    return data as PortfolioProfileAdmin;
  }

  async function saveProfileImage() {
    if (!selectedImage) {
      setError("Choose an image first.");
      return;
    }

    setUploadingImage(true);
    setError("");
    setSuccess("");

    try {
      const previousPath = form.profile_image_path;
      const { filePath, publicUrl } = await uploadProfileImage(selectedImage);
      await saveProfileRecord({
        profile_image_url: publicUrl,
        profile_image_path: filePath,
        updated_at: new Date().toISOString(),
      });

      if (previousPath) {
        try {
          await removeStoredImage(previousPath);
        } catch (deleteError) {
          console.error("Unable to remove previous profile image:", deleteError);
        }
      }

      setForm((current) => ({ ...current, profile_image_url: publicUrl, profile_image_path: filePath }));
      selectImage(null);
      setSuccess("Profile image updated.");
      await loadProfile();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : getProfileTableErrorMessage(uploadError as { message?: string | null; code?: string | null; details?: string | null; hint?: string | null; }));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    if (!form.profile_image_path) {
      update("profile_image_url", "");
      update("profile_image_path", "");
      setSuccess("Profile image cleared from the form. Save to keep this change.");
      return;
    }

    setRemovingImage(true);
    setError("");
    setSuccess("");

    try {
      await removeStoredImage(form.profile_image_path);
      await saveProfileRecord({
        profile_image_url: null,
        profile_image_path: null,
        updated_at: new Date().toISOString(),
      });

      selectImage(null);
      setForm((current) => ({ ...current, profile_image_url: "", profile_image_path: "" }));
      setSuccess("Profile image removed.");
      await loadProfile();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : getProfileTableErrorMessage(removeError as { message?: string | null; code?: string | null; details?: string | null; hint?: string | null; }));
    } finally {
      setRemovingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let profileImageUrl = form.profile_image_url.trim() || null;
      let profileImagePath = form.profile_image_path.trim() || null;

      if (selectedImage) {
        const previousPath = profileImagePath;
        const upload = await uploadProfileImage(selectedImage);
        profileImageUrl = upload.publicUrl;
        profileImagePath = upload.filePath;

        if (previousPath) {
          try {
            await removeStoredImage(previousPath);
          } catch (deleteError) {
            console.error("Unable to remove previous profile image:", deleteError);
          }
        }
      }

      const payload = {
        display_name: form.display_name.trim() || null,
        headline: form.headline.trim() || null,
        short_bio: form.short_bio.trim() || null,
        availability_text: form.availability_text.trim() || null,
        github_url: form.github_url.trim() || null,
        location: form.location.trim() || null,
        focus: form.focus.trim() || null,
        environment: form.environment.trim() || null,
        builds: form.builds.trim() || null,
        approach: form.approach.trim() || null,
        profile_image_url: profileImageUrl,
        profile_image_path: profileImagePath,
        updated_at: new Date().toISOString(),
      };

      await saveProfileRecord(payload);

      setSelectedImage(null);
      setPreviewUrl("");
      setSuccess("Profile updated successfully.");
      await loadProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : getProfileTableErrorMessage(saveError as { message?: string | null; code?: string | null; details?: string | null; hint?: string | null; }));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="loading-screen">Loading profile...</main>;

  return (
    <AdminShell
      title="Profile"
      description="Manage the hero copy, technical metadata, and portrait shown on the public portfolio."
      actions={<span className="status-badge status-featured"><span /><ProfileIcon className="icon-sm" />Public hero</span>}
    >
      {error && <AdminNotice type="error">{error}</AdminNotice>}
      {success && <AdminNotice type="success">{success}</AdminNotice>}

      <section className="admin-section admin-panel">
        <div className="admin-panel-head">
          <h2>Profile image</h2>
        </div>
        <div className="admin-panel-body">
          <div className="profile-admin-grid">
            <div className="upload-zone">
              <input className="upload-input" id="profile-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
              <p className="upload-meta">{selectedImage ? `Selected: ${selectedImage.name}` : "PNG, JPG, or WebP up to 4MB. A portrait crop works best."}</p>
              <div className="profile-upload-actions">
                <button type="button" disabled={!selectedImage || uploadingImage} onClick={saveProfileImage} className="button button-secondary button-small"><UploadIcon className="icon-sm" />{uploadingImage ? "Uploading..." : "Upload now"}</button>
                <button type="button" disabled={(!form.profile_image_url && !selectedImage) || removingImage} onClick={handleRemoveImage} className="button button-ghost button-small"><TrashIcon className="icon-sm" />{removingImage ? "Removing..." : "Remove image"}</button>
              </div>
            </div>

            <div className="profile-image-preview-card">
              {(previewUrl || form.profile_image_url) ? (
                <div className="profile-image-preview">
                  <span>{previewUrl ? "Selected image preview" : "Current public image"}</span>
                  <img src={previewUrl || form.profile_image_url} alt="Profile preview" />
                </div>
              ) : (
                <div className="profile-image-empty">No profile image uploaded yet.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-section admin-panel">
        <div className="admin-panel-head">
          <h2>Hero content</h2>
        </div>
        <form onSubmit={handleSubmit} className="admin-form">
          <section className="form-section">
            <h3 className="form-section-title">Core profile</h3>
            <div className="form-grid two-col">
              <Field label="Display name" id="display-name"><input id="display-name" value={form.display_name} onChange={(event) => update("display_name", event.target.value)} placeholder="Clyde" /></Field>
              <Field label="Availability" id="availability"><input id="availability" value={form.availability_text} onChange={(event) => update("availability_text", event.target.value)} placeholder="Open to opportunities" /></Field>
              <Field label="Headline" id="headline" className="field-full"><textarea id="headline" value={form.headline} onChange={(event) => update("headline", event.target.value)} placeholder="Building practical systems across cloud, infrastructure, and the web." /></Field>
              <Field label="Short bio" id="short-bio" className="field-full"><textarea id="short-bio" value={form.short_bio} onChange={(event) => update("short_bio", event.target.value)} placeholder="A concise introduction for the portfolio hero." /></Field>
            </div>
          </section>

          <section className="form-section">
            <h3 className="form-section-title">Links and metadata</h3>
            <div className="form-grid two-col">
              <Field label="GitHub URL" id="profile-github"><input id="profile-github" type="url" value={form.github_url} onChange={(event) => update("github_url", event.target.value)} placeholder="https://github.com/..." /></Field>
              <Field label="Location" id="profile-location"><input id="profile-location" value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Optional" /></Field>
              <Field label="Focus" id="profile-focus"><input id="profile-focus" value={form.focus} onChange={(event) => update("focus", event.target.value)} placeholder="Technical support" /></Field>
              <Field label="Environment" id="profile-environment"><input id="profile-environment" value={form.environment} onChange={(event) => update("environment", event.target.value)} placeholder="Cloud and infrastructure" /></Field>
              <Field label="Builds" id="profile-builds"><input id="profile-builds" value={form.builds} onChange={(event) => update("builds", event.target.value)} placeholder="Modern web systems" /></Field>
              <Field label="Approach" id="profile-approach"><input id="profile-approach" value={form.approach} onChange={(event) => update("approach", event.target.value)} placeholder="Practical and reliable" /></Field>
              <div className="field-full">
                <button type="submit" disabled={saving} className="button">{saving ? "Saving..." : "Save profile"}</button>
              </div>
            </div>
          </section>
        </form>
      </section>
    </AdminShell>
  );
}

function Field({ label, id, className = "", children }: { label: string; id: string; className?: string; children: React.ReactNode }) {
  return <div className={`field ${className}`}><label htmlFor={id}>{label}</label>{children}</div>;
}
