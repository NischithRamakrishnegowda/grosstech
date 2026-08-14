/**
 * Brand configuration — update this file when rebranding.
 * Every component that shows the app name or brand copy imports from here.
 */

export const BRAND = {
  name: "GrossTech",
  nameFirst: "Gross",          // part before the accent color
  nameLast: "Tech",            // part in primary color
  tagline: "India's Wholesale Marketplace for Daily Essentials",
  shortTagline: "Wholesale Marketplace",
  description:
    "Buy and sell daily essential goods — rice, sugar, oil and more. Connecting buyers and verified sellers across India.",

  // Contact — override via env vars at runtime
  email: process.env.ADMIN_EMAIL || "support@grosstech.in",
  phone: process.env.ADMIN_PHONE || "",
  location: "Bangalore, Karnataka, India",

  // Social / legal
  founded: 2024,
  country: "India",
} as const;

/** Page title suffix used in metadata */
export const SITE_TITLE = `${BRAND.nameFirst}${BRAND.nameLast} — ${BRAND.shortTagline}`;
