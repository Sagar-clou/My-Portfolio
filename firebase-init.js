import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, isConfigured } from "./firebase-config.js";

export { isConfigured };
export const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
