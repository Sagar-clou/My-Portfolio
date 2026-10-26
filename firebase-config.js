// ─────────────────────────────────────────────────────────────
//  1. Paste your Firebase web-app config below
//     (Firebase console → Project settings → Your apps → Web app → "Config").
//     These values are NOT secrets — security comes from firestore.rules.
//  2. Put the Gmail address(es) allowed into the admin panel in ADMIN_EMAILS.
//     Use the same address(es) in firestore.rules.
// ─────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: "AIzaSyCcT9rpqmCTZruiQM6YSu1deQ5Z7p0M5i4",
  authDomain: "my-portfolio-a46ef.firebaseapp.com",
  projectId: "my-portfolio-a46ef",
  storageBucket: "my-portfolio-a46ef.firebasestorage.app",
  messagingSenderId: "973813516514",
  appId: "1:973813516514:web:db0a3776ab7637a8fcb6bb"
};

export const ADMIN_EMAILS = ["guptasagar2201@gmail.com"];

export const isConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith("PASTE_"));
