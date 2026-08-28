/* eslint-disable @next/next/no-img-element -- Dynamic Supabase image URLs are rendered without Next image loader assumptions. */
import ContactForm from "@/components/ContactForm";
import { ArrowUpRightIcon, GithubIcon } from "@/components/Icons";
import PublicNavbar from "@/components/PublicNavbar";
import { formatSupabaseError, PORTFOLIO_PROFILE_PUBLIC_SELECT, PORTFOLIO_PROFILE_TABLE, type PortfolioProfilePublic } from "@/lib/portfolioProfile";
import { supabase } from "@/lib/supabase";
import { connection } from "next/server";

type Project = {
  id: string;
  title: string;
  description: string | null;
  long_description: string | null;
  image_url: string | null;
  technologies: string[] | null;
  github_url: string | null;
  demo_url: string | null;
  featured: boolean;
};

type Skill = { id: string; name: string; category: string | null };

export default async function Home() {
  await connection();

  const [{ data: projects, error: projectsError }, { data: skills, error: skillsError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("projects").select("*").eq("status", "published").order("sort_order", { ascending: true }),
    supabase.from("skills").select("*").order("sort_order", { ascending: true }),
    supabase.from(PORTFOLIO_PROFILE_TABLE).select(PORTFOLIO_PROFILE_PUBLIC_SELECT).eq("singleton", true).maybeSingle(),
  ]);

  if (projectsError) console.error("Projects error:", projectsError);
  if (skillsError) console.error("Skills error:", skillsError);
  if (profileError) {
    const formattedProfileError = formatSupabaseError(profileError);
    console.error("PROFILE SUPABASE ERROR");
    console.error("table:", PORTFOLIO_PROFILE_TABLE);
    console.error("message:", formattedProfileError?.message ?? null);
    console.error("code:", formattedProfileError?.code ?? null);
    console.error("details:", formattedProfileError?.details ?? null);
    console.error("hint:", formattedProfileError?.hint ?? null);
    console.error("name:", profileError.name ?? null);
  }

  const portfolioProjects = (projects || []) as Project[];
  const portfolioSkills = (skills || []) as Skill[];
  const portfolioProfile = (profile || null) as PortfolioProfilePublic | null;
  const featuredProject = portfolioProjects.find((project) => project.featured) || portfolioProjects[0] || null;
  const additionalProjects = featuredProject ? portfolioProjects.filter((project) => project.id !== featuredProject.id) : [];
  const githubUrl = portfolioProfile?.github_url || portfolioProjects.find((project) => project.github_url)?.github_url || undefined;
  const heroName = portfolioProfile?.display_name?.trim() || "Clyde";
  const heroAvailability = portfolioProfile?.availability_text?.trim() || "Open to select opportunities";
  const heroHeadline = portfolioProfile?.headline?.trim() || "Practical cloud, infrastructure, and web systems built for real operations.";
  const heroBio = portfolioProfile?.short_bio?.trim() || "I help teams solve operational problems with reliable systems, practical support, and web tools that are clear enough to maintain.";
  const heroLocation = portfolioProfile?.location?.trim() || "";
  const hasPortrait = Boolean(portfolioProfile?.profile_image_url);
  const groupedSkills = portfolioSkills.reduce<Record<string, Skill[]>>((groups, skill) => {
    const category = skill.category?.trim() || "Other";
    (groups[category] ||= []).push(skill);
    return groups;
  }, {});

  return (
    <main id="top" className="portfolio-shell">
      <a className="skip-link" href="#hero-title">Skip to main content</a>
      <PublicNavbar displayName={heroName} githubUrl={githubUrl} />

      <section className="hero" aria-labelledby="hero-title">
        <div className="site-container hero-inner">
          <div className="hero-copy-column">
            <p className="availability">{heroAvailability}{heroLocation ? ` / ${heroLocation}` : ""}</p>
            <h1 id="hero-title">{heroHeadline}</h1>
            <p className="hero-copy">{heroBio}</p>
            <div className="hero-actions">
              <a className="button" href="#contact">Contact</a>
              <a className="button button-secondary" href="#projects">View projects</a>
              {githubUrl ? <a className="button button-secondary" href={githubUrl} target="_blank" rel="noopener noreferrer"><GithubIcon className="icon-sm" />GitHub</a> : null}
            </div>
          </div>

          <div className="hero-side-column">
            {hasPortrait ? (
              <figure className="hero-portrait">
                <img src={portfolioProfile?.profile_image_url || ""} alt={`${heroName} profile portrait`} width={640} height={800} fetchPriority="high" />
                <figcaption>{heroName}</figcaption>
              </figure>
            ) : (
              <div className="hero-monogram" aria-label={heroName}>
                <strong>{heroName}</strong>
                <p>Cloud, infrastructure, and web systems</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="site-container intro-grid">
          <div className="section-heading">
            <h2>Technical breadth that stays grounded in business reality.</h2>
          </div>
          <div className="intro-copy">
            <p>
              My work covers technical support, cloud infrastructure, operations, and web delivery. I focus on systems that are easier to run, easier to support, and useful to the people depending on them.
            </p>
            <p>
              Whether the need is a stronger internal workflow, a cleaner web presence, or a more dependable setup behind the scenes, I aim to make the work feel stable, intentional, and worth trusting.
            </p>
          </div>
        </div>
      </section>

      <section id="skills" className="section">
        <div className="site-container section-grid">
          <div className="section-heading">
            <h2>A working toolkit across support, systems, cloud, and delivery.</h2>
            <p>This reflects the range I use to diagnose issues, build solutions, and keep systems workable over time.</p>
          </div>

          <div className="skills-board">
            {Object.keys(groupedSkills).length ? Object.entries(groupedSkills).map(([category, items]) => (
              <section className="skill-group" key={category}>
                <div className="skill-group-heading">
                  <h3>{category}</h3>
                </div>
                <div className="skill-items">
                  {items.map((skill) => <span className="skill-item" key={skill.id}>{skill.name}</span>)}
                </div>
              </section>
            )) : <p className="muted">No skills added yet.</p>}
          </div>
        </div>
      </section>

      <section id="projects" className="section section-muted">
        <div className="site-container">
          <div className="section-heading">
            <h2>Projects I&apos;ve recently worked on.</h2>
          </div>

          {featuredProject ? (
            <div className="case-studies">
              <FeaturedProject project={featuredProject} />
              {additionalProjects.length > 0 ? (
                <div className="case-study-list">
                  {additionalProjects.map((project) => <ProjectCaseStudy key={project.id} project={project} />)}
                </div>
              ) : null}
            </div>
          ) : <div className="empty-state">No projects available yet.</div>}
        </div>
      </section>

      <section id="contact" className="section">
        <div className="site-container contact-grid">
          <div className="contact-aside">
            <div className="section-heading">
              <h2>Let&apos;s talk about the role, system, or business problem you need solved.</h2>
              <p>I am open to full-time opportunities, contract work, and practical projects where reliability matters.</p>
            </div>

            <p className="contact-note">Share the context, what needs improving, and any constraints you are working with. I&apos;ll read it directly and respond with care.</p>
          </div>

          <div className="contact-panel">
            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="site-container footer-inner">
          <div>
            <div className="footer-title">Practical cloud, support, and web systems for real operations.</div>
            <p className="footer-subtitle">{buildFooterSubtitle(portfolioProfile)}</p>
          </div>
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#skills">Capabilities</a>
            <a href="#projects">Work</a>
            <a href="#contact">Contact</a>
            {githubUrl ? (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <GithubIcon className="icon-sm" />
                GitHub
              </a>
            ) : null}
          </div>
        </div>
      </footer>
    </main>
  );
}

function buildFooterSubtitle(profile: PortfolioProfilePublic | null) {
  const role = profile?.focus?.trim() || "Cloud Engineer";
  const location = profile?.location?.trim();
  return location ? `${role} · ${location}` : role;
}

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || "";
}

function excerptText(value: string, maxLength = 260) {
  if (value.length <= maxLength) return value;
  const sentenceBreak = value.slice(0, maxLength).lastIndexOf(".");
  const wordBreak = value.slice(0, maxLength).lastIndexOf(" ");
  const cutPoint = sentenceBreak > 120 ? sentenceBreak + 1 : Math.max(wordBreak, 120);
  return `${value.slice(0, cutPoint).trim()}…`;
}

function getProjectPreview(project: Project) {
  const summary = normalizeText(project.description) || "Project details coming soon.";
  const details = normalizeText(project.long_description);
  const repeatedDetails = details.toLowerCase() === summary.toLowerCase() || details.toLowerCase().startsWith(summary.toLowerCase());

  return {
    summary,
    details: details && !repeatedDetails ? excerptText(details) : "",
  };
}

function ProjectMedia({ project, featured = false }: { project: Project; featured?: boolean }) {
  return (
    <div className={`project-visual${featured ? " project-visual-featured" : ""}`}>
      {project.image_url ? (
        <img src={project.image_url} alt={`${project.title} project screenshot`} width={1200} height={750} loading={featured ? "eager" : "lazy"} fetchPriority={featured ? "high" : undefined} />
      ) : (
        <div className="project-placeholder">Project preview</div>
      )}
    </div>
  );
}

function ProjectLinks({ project }: { project: Project }) {
  if (!project.demo_url && !project.github_url) return null;

  return (
    <div className="project-links">
      {project.demo_url ? (
        <a className="button button-secondary" href={project.demo_url} target="_blank" rel="noopener noreferrer">
          Live preview
          <ArrowUpRightIcon className="icon-sm" />
        </a>
      ) : null}
      {project.github_url ? (
        <a className="button button-secondary" href={project.github_url} target="_blank" rel="noopener noreferrer">
          <GithubIcon className="icon-sm" />
          GitHub
        </a>
      ) : null}
    </div>
  );
}

function TechList({ technologies }: { technologies: string[] | null }) {
  if (!technologies?.length) return null;
  return <div className="tech-list">{technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>;
}

function FeaturedProject({ project }: { project: Project }) {
  const preview = getProjectPreview(project);

  return (
    <article className="featured-case-study">
      <div className="featured-case-copy">
        <h3>{project.title}</h3>
        <p className="featured-case-summary">{preview.summary}</p>

        {preview.details ? (
          <p className="project-preview-note">{preview.details}</p>
        ) : null}

        <TechList technologies={project.technologies} />
        <ProjectLinks project={project} />
      </div>

      <ProjectMedia project={project} featured />
    </article>
  );
}

function ProjectCaseStudy({ project }: { project: Project }) {
  const preview = getProjectPreview(project);

  return (
    <article className="case-study-card">
      <ProjectMedia project={project} />
      <div className="case-study-details">
        <div className="case-study-header">
          <div>
            <h3>{project.title}</h3>
          </div>
        </div>
        <p className="case-study-point">{preview.details || preview.summary}</p>
        <ProjectLinks project={project} />
        <TechList technologies={project.technologies} />
      </div>
    </article>
  );
}
