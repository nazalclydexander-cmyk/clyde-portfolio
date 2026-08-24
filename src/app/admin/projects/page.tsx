"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminShell, { AdminNotice, StatusBadge } from "@/components/AdminShell";
import { EditIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/Icons";

type ProjectStatus = "draft" | "published" | "archived";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  image_url: string | null;
  github_url: string | null;
  demo_url: string | null;
  technologies: string[];
  status: ProjectStatus;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

type ProjectForm = {
  title: string;
  slug: string;
  description: string;
  long_description: string;
  image_url: string;
  github_url: string;
  demo_url: string;
  technologies: string;
  status: ProjectStatus;
  featured: boolean;
  sort_order: number;
};

function getNextSortOrder(projects: Project[]) {
  return Math.max(0, ...projects.map((project) => project.sort_order || 0)) + 1;
}

function createEmptyForm(sortOrder: number): ProjectForm {
  return {
    title: "",
    slug: "",
    description: "",
    long_description: "",
    image_url: "",
    github_url: "",
    demo_url: "",
    technologies: "",
    status: "published",
    featured: false,
    sort_order: Math.max(1, sortOrder),
  };
}

export default function ManageProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<ProjectForm>(() => createEmptyForm(1));
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadProjects = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/admin/login");
      return [] as Project[];
    }

    const { data, error: loadError } = await supabase.from("projects").select("*").order("sort_order", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return [] as Project[];
    }

    const nextProjects = (data || []) as Project[];
    setProjects(nextProjects);
    if (!editingId) setForm(createEmptyForm(getNextSortOrder(nextProjects)));
    setLoading(false);
    return nextProjects;
  }, [editingId, router]);

  useEffect(() => {
    let active = true;

    async function initializeProjects() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error: loadError } = await supabase.from("projects").select("*").order("sort_order", { ascending: true });

      if (!active) return;

      if (loadError) {
        setError(loadError.message);
        setLoading(false);
        return;
      }

      const nextProjects = (data || []) as Project[];
      setProjects(nextProjects);
      if (!editingId) setForm(createEmptyForm(getNextSortOrder(nextProjects)));
      setLoading(false);
    }

    void initializeProjects();

    return () => {
      active = false;
    };
  }, [editingId, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function update<K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectImage(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  function generateSlug(title: string) {
    return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function handleTitleChange(title: string) {
    setForm((current) => ({
      ...current,
      title,
      slug: editingId ? current.slug : generateSlug(title),
    }));
  }

  function resetForm(nextProjects = projects) {
    setEditingId(null);
    setForm(createEmptyForm(getNextSortOrder(nextProjects)));
    selectImage(null);
    setError("");
    setSuccess("");
  }

  function editProject(project: Project) {
    setEditingId(project.id);
    selectImage(null);
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description || "",
      long_description: project.long_description || "",
      image_url: project.image_url || "",
      github_url: project.github_url || "",
      demo_url: project.demo_url || "",
      technologies: (project.technologies || []).join(", "),
      status: project.status,
      featured: project.featured,
      sort_order: Math.max(1, project.sort_order),
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `projects/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("project-images").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    return supabase.storage.from("project-images").getPublicUrl(filePath).data.publicUrl;
  }

  async function uploadProjectImage() {
    if (!selectedImage) {
      setError("Please choose an image first.");
      return;
    }

    setUploadingImage(true);
    setError("");
    setSuccess("");

    try {
      const publicUrl = await uploadImage(selectedImage);
      update("image_url", publicUrl);
      selectImage(null);
      setSuccess("Image uploaded. Save the project to keep this change.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    let imageUrl = form.image_url.trim();

    try {
      if (selectedImage) {
        setUploadingImage(true);
        imageUrl = await uploadImage(selectedImage);
      }

      const title = form.title.trim();
      const slug = form.slug.trim();
      const sortOrder = Number(form.sort_order);

      if (!title || !slug) throw new Error("Title and slug are required.");
      if (!Number.isInteger(sortOrder) || sortOrder < 1) throw new Error("Sort order must be 1 or greater.");

      const { error: saveError } = await supabase.rpc("save_portfolio_project", {
        p_project_id: editingId,
        p_title: title,
        p_slug: slug,
        p_description: form.description.trim() || null,
        p_long_description: form.long_description.trim() || null,
        p_image_url: imageUrl || null,
        p_github_url: form.github_url.trim() || null,
        p_demo_url: form.demo_url.trim() || null,
        p_technologies: form.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        p_status: form.status,
        p_featured: form.featured,
        p_target_position: sortOrder,
      });

      if (saveError) throw saveError;

      const nextProjects = await loadProjects();
      resetForm(nextProjects);
      setSuccess(editingId ? "Project updated successfully." : "Project added successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the project.");
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  }

  async function deleteProject(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase.rpc("delete_portfolio_project", {
      p_project_id: id,
    });

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const nextProjects = await loadProjects();
    if (editingId === id) resetForm(nextProjects);
    setSuccess("Project deleted successfully.");
  }

  if (loading) return <main className="loading-screen">Loading projects...</main>;

  return (
    <AdminShell
      title="Projects"
      description="Create, present, and publish the work shown on your portfolio."
      actions={
        <button className="button button-secondary button-small" type="button" onClick={() => resetForm()}>
          <PlusIcon className="icon-sm" />
          New project
        </button>
      }
    >
      {error && <AdminNotice type="error">{error}</AdminNotice>}
      {success && <AdminNotice type="success">{success}</AdminNotice>}

      <section className="admin-section admin-panel">
        <div className="admin-panel-head">
          <h2>{editingId ? "Edit project" : "Add project"}</h2>
          {editingId && (
            <button type="button" className="button button-ghost button-small" onClick={() => resetForm()}>
              Cancel editing
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <FormSection title="Basic information">
            <div className="form-grid two-col">
              <Field label="Project title" id="project-title">
                <input id="project-title" required value={form.title} onChange={(event) => handleTitleChange(event.target.value)} placeholder="LinkGuard" />
              </Field>
              <Field label="Slug" id="project-slug">
                <input id="project-slug" required value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="linkguard" />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Project content">
            <div className="form-grid">
              <Field label="Short description" id="project-description">
                <textarea id="project-description" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="A concise summary for project listings" />
              </Field>
              <Field label="Long description" id="project-long-description">
                <textarea id="project-long-description" value={form.long_description} onChange={(event) => update("long_description", event.target.value)} placeholder="The problem, approach, and outcome" />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Links & technology">
            <div className="form-grid two-col">
              <Field label="GitHub URL" id="github-url">
                <input id="github-url" type="url" value={form.github_url} onChange={(event) => update("github_url", event.target.value)} placeholder="https://github.com/..." />
              </Field>
              <Field label="Live demo URL" id="demo-url">
                <input id="demo-url" type="url" value={form.demo_url} onChange={(event) => update("demo_url", event.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Technologies" id="technologies" className="field-full">
                <input id="technologies" value={form.technologies} onChange={(event) => update("technologies", event.target.value)} placeholder="Next.js, Supabase, Vercel" />
                <p className="field-hint">Separate technologies with commas.</p>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Project image">
            <div className="upload-zone">
              <input className="upload-input" id="project-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectImage(event.target.files?.[0] || null)} />
              <p className="upload-meta">{selectedImage ? `Selected: ${selectedImage.name}` : "PNG, JPG, or WebP. A 16:10 landscape image works best."}</p>
              <button type="button" disabled={!selectedImage || uploadingImage} onClick={uploadProjectImage} className="button button-secondary button-small" style={{ marginTop: ".8rem" }}>
                <UploadIcon className="icon-sm" />
                {uploadingImage ? "Uploading..." : "Upload now"}
              </button>
              {(previewUrl || form.image_url) && (
                <div className="image-preview">
                  <span>{previewUrl ? "Selected image preview" : "Current image"}</span>
                  <img src={previewUrl || form.image_url} alt="Project image preview" />
                </div>
              )}
            </div>
          </FormSection>

          <FormSection title="Publishing">
            <div className="form-grid two-col">
              <Field label="Status" id="project-status">
                <select id="project-status" value={form.status} onChange={(event) => update("status", event.target.value as ProjectStatus)}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <Field label="Sort order" id="project-sort">
                <input id="project-sort" type="number" min="1" step="1" value={form.sort_order} onChange={(event) => update("sort_order", Math.max(1, Number(event.target.value) || 1))} />
                <p className="field-hint">Moving a project to an occupied position automatically reorders the other projects.</p>
              </Field>
              <label className="checkbox-field field-full">
                <input type="checkbox" checked={form.featured} onChange={(event) => update("featured", event.target.checked)} />
                <span>
                  <strong>Featured project</strong>
                  <br />
                  <span className="muted">Only one project can be featured. Selecting this will replace the current featured project.</span>
                </span>
              </label>
              <div className="field-full">
                <button type="submit" disabled={saving} className="button">
                  {saving ? "Saving..." : editingId ? "Update project" : "Add project"}
                </button>
              </div>
            </div>
          </FormSection>
        </form>
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2>All projects</h2>
          <span>{projects.length} {projects.length === 1 ? "project" : "projects"}</span>
        </div>

        <div className="data-list">
          {projects.length ? (
            projects.map((project) => (
              <div className="data-row" key={project.id}>
                <div className="data-row-main">
                  <div className="data-row-title">
                    <h3>{project.title}</h3>
                    <StatusBadge status={project.status} />
                    {project.featured && <StatusBadge status="featured" />}
                  </div>
                  <p>Sort order: {project.sort_order}</p>
                  <p>{project.description || "No description provided."}</p>
                  {project.technologies?.length > 0 && <p>{project.technologies.join(" · ")}</p>}
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => editProject(project)} className="button button-secondary button-small">
                    <EditIcon className="icon-sm" />
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteProject(project.id, project.title)} className="button button-danger button-small">
                    <TrashIcon className="icon-sm" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No projects found.</div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="form-section">
      <h3 className="form-section-title">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, id, className = "", children }: { label: string; id: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
