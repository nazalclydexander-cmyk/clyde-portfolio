export const FOOTER_SETTINGS_TABLE = "footer_settings";

const FOOTER_SETTINGS_SELECT_BASE = `
  id,
  singleton,
  enabled,
  title,
  subtitle,
  show_about_link,
  show_capabilities_link,
  show_work_link,
  show_contact_link,
  show_github_link
`;

export const FOOTER_SETTINGS_PUBLIC_SELECT = FOOTER_SETTINGS_SELECT_BASE;
export const FOOTER_SETTINGS_ADMIN_SELECT = `${FOOTER_SETTINGS_SELECT_BASE}, updated_at`;

export type FooterSettings = {
  id: string;
  singleton: boolean;
  enabled: boolean;
  title: string | null;
  subtitle: string | null;
  show_about_link: boolean;
  show_capabilities_link: boolean;
  show_work_link: boolean;
  show_contact_link: boolean;
  show_github_link: boolean;
  updated_at?: string | null;
};

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  id: "default-footer-settings",
  singleton: true,
  enabled: true,
  title: "Practical cloud, support, and web systems for real operations.",
  subtitle: null,
  show_about_link: true,
  show_capabilities_link: true,
  show_work_link: true,
  show_contact_link: true,
  show_github_link: true,
};
