import { supabase } from "@/lib/supabase";
import { formatSupabaseError, PORTFOLIO_PROFILE_PUBLIC_SELECT, PORTFOLIO_PROFILE_TABLE, type PortfolioProfilePublic } from "@/lib/portfolioProfile";
import { connection } from "next/server";
import ContactForm from "@/components/ContactForm";
import PublicNavbar from "@/components/PublicNavbar";
import { ArrowUpRightIcon, GithubIcon } from "@/components/Icons";

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
  const featured = portfolioProjects.filter((project) => project.featured);
  const featuredProjects = featured.length ? featured : portfolioProjects.slice(0, 2);
  const featuredIds = new Set(featuredProjects.map((project) => project.id));
  const additionalProjects = portfolioProjects.filter((project) => !featuredIds.has(project.id));
  const githubUrl = portfolioProfile?.github_url || portfolioProjects.find((project) => project.github_url)?.github_url || undefined;
  const heroName = portfolioProfile?.display_name?.trim() || "Clyde";
  const heroAvailability = portfolioProfile?.availability_text?.trim() || "Open to opportunities";
  const heroHeadline = portfolioProfile?.headline?.trim() || "Building practical systems across cloud, infrastructure, and the web.";
  const heroBio = portfolioProfile?.short_bio?.trim() || "I'm Clyde - a technical support, cloud, and development professional focused on reliable solutions that solve real operational problems.";
  const hasPortrait = Boolean(portfolioProfile?.profile_image_url);
  const heroMeta = [
    { label: "Focus", value: portfolioProfile?.focus?.trim() || "Technical support" },
    { label: "Environment", value: portfolioProfile?.environment?.trim() || "Cloud & infrastructure" },
    { label: "Builds", value: portfolioProfile?.builds?.trim() || "Modern web systems" },
    { label: "Approach", value: portfolioProfile?.approach?.trim() || "Practical & reliable" },
    { label: "Location", value: portfolioProfile?.location?.trim() || "" },
  ].filter((item) => item.value);

  const groupedSkills = portfolioSkills.reduce<Record<string, Skill[]>>((groups, skill) => {
    const category = skill.category?.trim() || "Other";
    (groups[category] ||= []).push(skill);
    return groups;
  }, {});

  return (
    <main id="top">
      <PublicNavbar githubUrl={githubUrl} />

      <section className="hero" aria-labelledby="hero-title">
        <div className={`site-container hero-inner ${hasPortrait ? "hero-has-portrait" : "hero-no-portrait"}`}>
          <div className="hero-copy-column">
            <div className="availability"><span />{heroAvailability}</div>
            <h1 id="hero-title">{splitHeadline(heroHeadline)}</h1>
            <p className="hero-copy">{heroBio}</p>
            <div className="hero-actions">
              <a className="button" href="#projects">View projects <ArrowUpRightIcon className="icon-sm" /></a>
              <a className="button button-secondary" href="#contact">Contact me</a>
              {githubUrl && <a className="button button-ghost" href={githubUrl} target="_blank" rel="noreferrer"><GithubIcon className="icon-sm" />GitHub</a>}
            </div>
          </div>

          {(hasPortrait || heroMeta.length) ? (
            <div className="hero-side-column">
              {hasPortrait ? (
                <figure className="hero-portrait">
                  <img src={portfolioProfile?.profile_image_url || ""} alt={`${heroName} profile portrait`} />
                </figure>
              ) : null}

              {heroMeta.length ? (
                <dl className="hero-meta" aria-label="Professional focus">
                  <div className="hero-meta-heading"><dt>Name</dt><dd>{heroName}</dd></div>
                  {heroMeta.map((item) => <div className="hero-meta-row" key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
                </dl>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section id="about" className="section">
        <div className="site-container section-grid">
          <div className="section-heading"><p className="eyebrow">01 / About</p><h2>Technical breadth, practical focus.</h2></div>
          <div className="about-copy">
            <p>I am interested in cloud technologies, technical support, system administration, and web development. I enjoy building useful systems and continuously improving my technical skills.</p>
            <dl className="about-details">
              <div className="about-detail"><dt>Primary focus</dt><dd>Cloud & technical support</dd></div>
              <div className="about-detail"><dt>Development</dt><dd>Modern web applications</dd></div>
              <div className="about-detail"><dt>Interests</dt><dd>Systems & infrastructure</dd></div>
              <div className="about-detail"><dt>Working style</dt><dd>Useful, clear, dependable</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section id="skills" className="section">
        <div className="site-container section-grid">
          <div className="section-heading"><p className="eyebrow">02 / Capabilities</p><h2>Tools and technologies.</h2><p>A working toolkit spanning support, cloud systems, infrastructure, and application development.</p></div>
          <div className="skills-list">
            {Object.keys(groupedSkills).length ? Object.entries(groupedSkills).map(([category, items]) => (
              <div className="skill-group" key={category}><h3>{category}</h3><div className="skill-items">{items.map((skill) => <span className="skill-item" key={skill.id}>{skill.name}</span>)}</div></div>
            )) : <p className="muted">No skills added yet.</p>}
          </div>
        </div>
      </section>

      <section id="projects" className="section">
        <div className="site-container">
          <div className="section-heading"><p className="eyebrow">03 / Selected work</p><h2>Projects built to be useful.</h2><p>A selection of systems and applications, from the underlying technical decisions to the finished interface.</p></div>
          {featuredProjects.length ? (
            <div className="projects-stack">
              {featuredProjects.map((project, index) => <FeaturedProject key={project.id} project={project} index={index} />)}
            </div>
          ) : <div className="empty-state">No projects available yet.</div>}
          {additionalProjects.length > 0 && <div className="additional-projects">{additionalProjects.map((project, index) => <ProjectCard key={project.id} project={project} index={index + featuredProjects.length} />)}</div>}
        </div>
      </section>

      <section id="contact" className="section">
        <div className="site-container contact-grid">
          <div className="contact-aside">
            <div className="section-heading"><p className="eyebrow">04 / Contact</p><h2>Let&apos;s talk about the work.</h2><p>Have a role, project, or technical problem in mind? Send the details and I&apos;ll get back to you.</p></div>
            <p className="contact-note">Messages are sent securely through this portfolio and reviewed directly.</p>
          </div>
          <ContactForm />
        </div>
      </section>

      <footer className="footer"><div className="site-container footer-inner"><div><div className="footer-title">{heroName}</div><p className="footer-subtitle">{buildFooterSubtitle(portfolioProfile)}</p></div><div className="footer-links"><a href="#projects">Projects</a><a href="#contact">Contact</a>{githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>}<span>Next.js · Supabase · Vercel</span></div></div></footer>
    </main>
  );
}

function splitHeadline(headline: string) {
  const sentence = headline.trim();
  const pivot = sentence.indexOf(" across ");
  if (pivot === -1) return sentence;
  return <>{sentence.slice(0, pivot)} <span>{sentence.slice(pivot + 1)}</span></>;
}

function buildFooterSubtitle(profile: PortfolioProfilePublic | null) {
  const parts = [profile?.focus?.trim(), profile?.environment?.trim(), profile?.builds?.trim()].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Technical Support · Cloud · Developer";
}

function ProjectMedia({ project }: { project: Project }) {
  return <div className="project-visual">{project.image_url ? <img src={project.image_url} alt={`${project.title} project screenshot`} /> : <div className="project-placeholder">Project preview</div>}</div>;
}

function ProjectLinks({ project }: { project: Project }) {
  if (!project.demo_url && !project.github_url) return null;
  return <div className="project-links">{project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer">Live demo <ArrowUpRightIcon className="icon-sm" /></a>}{project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer"><GithubIcon className="icon-sm" />GitHub</a>}</div>;
}

function TechList({ technologies }: { technologies: string[] | null }) {
  if (!technologies?.length) return null;
  return <div className="tech-list">{technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>;
}

function FeaturedProject({ project, index }: { project: Project; index: number }) {
  return <article className="featured-project"><ProjectMedia project={project} /><div className="project-content"><span className="project-index">PROJECT / {String(index + 1).padStart(2, "0")}</span><h3>{project.title}</h3><p>{project.long_description || project.description || "Project details coming soon."}</p><TechList technologies={project.technologies} /><ProjectLinks project={project} /></div></article>;
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return <article className="project-card"><span className="project-index">PROJECT / {String(index + 1).padStart(2, "0")}</span><h3>{project.title}</h3><p>{project.description || "Project details coming soon."}</p><TechList technologies={project.technologies} /><ProjectLinks project={project} /></article>;
}
