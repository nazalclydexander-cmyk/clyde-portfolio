export const PORTFOLIO_PROFILE_TABLE = "portfolio_profile";

export const PORTFOLIO_PROFILE_PUBLIC_SELECT = `
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

export const PORTFOLIO_PROFILE_ADMIN_SELECT = `
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
  location: string | null;
  focus: string | null;
  environment: string | null;
  builds: string | null;
  approach: string | null;
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
