export const PUBLIC_PATHS = [
  "/",
  "/login",
  "/services",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/refund-policy",
  "/cancellation-policy",
];

export function isPublicPath(pathname) {
  return PUBLIC_PATHS.includes(pathname);
}
