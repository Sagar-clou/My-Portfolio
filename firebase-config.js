// ─────────────────────────────────────────────────────────────
//  1. Paste your Firebase web-app config below
//     (Firebase console → Project settings → Your apps → Web app → "Config").
//     These values are NOT secrets — security comes from firestore.rules.
//  2. Put the Gmail address(es) allowed into the admin panel in ADMIN_EMAILS.
//     Use the same address(es) in firestore.rules.
// ─────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  projectId: "PASTE_PROJECT_ID",
  appId: "PASTE_APP_ID"
};

export const ADMIN_EMAILS = ["guptasagar2201@gmail.com"];

export const isConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith("PASTE_"));
