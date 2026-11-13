export const PORTFOLIO_PROFILE_TABLE = "portfolio_profile";

const PORTFOLIO_PROFILE_PUBLIC_SELECT_BASE = `
  id,
  singleton,
  display_name,
  headline,
  short_bio,
  profile_image_url,
  availability_text,
  github_url,
  linkedin_url,
  location,
  focus,
  environment,
  builds,
  approach
`;

export const PORTFOLIO_PROFILE_PUBLIC_SELECT = `${PORTFOLIO_PROFILE_PUBLIC_SELECT_BASE}, portrait_interaction_enabled`;
export const PORTFOLIO_PROFILE_PUBLIC_SELECT_NO_PORTRAIT = PORTFOLIO_PROFILE_PUBLIC_SELECT_BASE;
export const PORTFOLIO_PROFILE_PUBLIC_SELECT_FALLBACK = `
  id,
  singleton,
  display_name,
  headline,
  short_bio,
  profile_image_url,
  availability_text,
  github_url,
  location,
  focus,
  environment,
  builds,
  approach
`;

const PORTFOLIO_PROFILE_ADMIN_SELECT_BASE = `
  id,
  singleton,
  display_name,
  headline,
  short_bio,
  profile_image_url,
  profile_image_path,
  availability_text,
  github_url,
  linkedin_url,
  location,
  focus,
  environment,
  builds,
  approach,
  updated_at
`;

export const PORTFOLIO_PROFILE_ADMIN_SELECT = `${PORTFOLIO_PROFILE_ADMIN_SELECT_BASE}, portrait_interaction_enabled`;
export const PORTFOLIO_PROFILE_ADMIN_SELECT_NO_PORTRAIT = PORTFOLIO_PROFILE_ADMIN_SELECT_BASE;
export const PORTFOLIO_PROFILE_ADMIN_SELECT_FALLBACK = `
  id,
  singleton,
  display_name,
  headline,
  short_bio,
  profile_image_url,
  profile_image_path,
  availability_text,
  github_url,
  location,
  focus,
  environment,
  builds,
  approach,
  updated_at
`;

export type PortfolioProfilePublic = {
  id: string;
  singleton: boolean;
  display_name: string | null;
  headline: string | null;
  short_bio: string | null;
  profile_image_url: string | null;
  availability_text: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  location: string | null;
  focus: string | null;
  environment: string | null;
  builds: string | null;
  approach: string | null;
  portrait_interaction_enabled?: boolean | null;
};

export type PortfolioProfileAdmin = PortfolioProfilePublic & {
  profile_image_path: string | null;
  updated_at?: string | null;
};

type SupabaseLikeError = {
  message?: string | null;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

export function formatSupabaseError(error: SupabaseLikeError | null | undefined) {
  if (!error) return null;

  return {
    message: error.message || "Unknown Supabase error",
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
  };
}

export function isMissingPortfolioProfileOptionalColumnError(error: SupabaseLikeError | null | undefined) {
  const details = formatSupabaseError(error);
  if (!details) return false;

  const message = `${details.message} ${details.details || ""}`.toLowerCase();
  const optionalColumn = message.includes("portrait_interaction_enabled") || message.includes("linkedin_url");
  return optionalColumn && (
    details.code === "42703" ||
    details.code === "PGRST204" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

export function isMissingPortraitInteractionColumnError(error: SupabaseLikeError | null | undefined) {
  return isMissingPortfolioProfileOptionalColumnError(error);
}

export function getProfileTableErrorMessage(error: SupabaseLikeError | null | undefined) {
  const details = formatSupabaseError(error);
  if (!details) return "Unknown profile loading error.";

  const relationMissing =
    details.code === "42P01" ||
    details.code === "PGRST205" ||
    details.message.toLowerCase().includes(`relation "${PORTFOLIO_PROFILE_TABLE}" does not exist`) ||
    details.message.toLowerCase().includes(`could not find the table 'public.${PORTFOLIO_PROFILE_TABLE}'`);
  if (relationMissing) {
    return `Profile table "${PORTFOLIO_PROFILE_TABLE}" is missing. Run the SQL in supabase/portfolio_profile_setup.sql in the Supabase SQL Editor.`;
  }

  return details.message;
}
