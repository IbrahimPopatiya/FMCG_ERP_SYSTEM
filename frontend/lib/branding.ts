// Per-deployment branding. Same codebase runs for multiple clients (separate
// Render service + Supabase DB each) — these env vars let each deployment
// show its own name/logo without a code change. Defaults match the original
// Zaid Traders branding so an unset env var changes nothing.
export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Zaid Traders",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "ZT",
  logoPath: process.env.NEXT_PUBLIC_LOGO_PATH || "/logo-mark.png",
  logoWidth: Number(process.env.NEXT_PUBLIC_LOGO_WIDTH) || 579,
  logoHeight: Number(process.env.NEXT_PUBLIC_LOGO_HEIGHT) || 355,
  // Some clients' logo files are icon-only marks (name rendered separately
  // next to them); others are a full wordmark that already reads the brand
  // name. Set true when the logo file itself contains the name, so screens
  // don't render it twice.
  logoIncludesName: process.env.NEXT_PUBLIC_LOGO_INCLUDES_NAME === "true",
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR || "#192bc2",
  backgroundColor: process.env.NEXT_PUBLIC_THEME_BACKGROUND || "#f5f7fa",
};
