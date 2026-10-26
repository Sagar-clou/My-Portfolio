import { app, db, isConfigured } from "./firebase-init.js";
import { ADMIN_EMAILS } from "./firebase-config.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  sendEmailVerification, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection, doc, getDoc, setDoc, deleteDoc, onSnapshot, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { escapeHtml, renderMarkdown } from "./markdown.js";
import { projectCardHTML, safeUrl } from "./project-card.js";
import { seedProjects } from "./seed-projects.js";

const $ = s => document.querySelector(s);
const icons = () => window.lucide && window.lucide.createIcons();
const show = (el, on) => { el.hidden = !on; };

const screens = { config: $("#screen-config"), login: $("#screen-login"), app: $("#screen-app") };
const showScreen = name => Object.entries(screens).forEach(([k, el]) => show(el, k === name));

function toast(message, kind = "") {
  const t = document.createElement("div");
  t.className = `toast ${kind}`;
  t.textContent = message;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), kind === "error" ? 6500 : 3200);
}

const friendlyError = err => {
  if (err?.code === "permission-denied") {
    return "Firestore refused this. Publish firestore.rules and make sure your Gmail is listed in them.";
  }
  return err?.message || "Something went wrong.";
};

/* ───────────── Auth ───────────── */
if (!isConfigured) {
  showScreen("config");
} else {
  const auth = getAuth(app);
  const allowed = ADMIN_EMAILS.map(e => e.toLowerCase());
  const isAllowed = u => !!u && u.emailVerified && allowed.includes((u.email || "").toLowerCase());
  const isAllowedEmail = email => allowed.includes(email.trim().toLowerCase());
  let unsubscribe = null;

  const loginError = msg => { const e = $("#login-error"); e.textContent = msg; show(e, true); };
  const clearLoginError = () => show($("#login-error"), false);
  const authError = err => ({
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/email-already-in-use": "An account already exists for this email. Try signing in instead.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again."
  }[err?.code] || friendlyError(err));

  const setAuthTab = tab => {
    const signup = tab === "signup";
    $("#login-form").hidden = signup;
    $("#signup-form").hidden = !signup;
    $("#tab-login").classList.toggle("is-active", !signup);
    $("#tab-signup").classList.toggle("is-active", signup);
    $("#tab-login").setAttribute("aria-selected", String(!signup));
    $("#tab-signup").setAttribute("aria-selected", String(signup));
    clearLoginError();
  };

  $("#tab-login").addEventListener("click", () => setAuthTab("login"));
  $("#tab-signup").addEventListener("click", () => setAuthTab("signup"));

  $("#login-form").addEventListener("submit", async event => {
    event.preventDefault();
    clearLoginError();
    const email = $("#login-email").value.trim();
    const password = $("#login-password").value;
    if (!email || !password) return loginError("Enter your email address and password.");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      loginError(authError(err));
    }
  });

  $("#signup-form").addEventListener("submit", async event => {
    event.preventDefault();
    clearLoginError();
    const email = $("#signup-email").value.trim();
    const password = $("#signup-password").value;
    const confirmation = $("#signup-password-confirm").value;
    if (!isAllowedEmail(email)) return loginError("This email is not authorised to create an admin account.");
    if (password.length < 6) return loginError("Choose a password with at least 6 characters.");
    if (password !== confirmation) return loginError("The passwords do not match.");
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      await signOut(auth);
      setAuthTab("login");
      $("#login-email").value = email;
      loginError("Account created. Check your email to verify the account, then sign in.");
    } catch (err) {
      loginError(authError(err));
    }
  });

  $("#btn-forgot").addEventListener("click", async () => {
    clearLoginError();
    const email = $("#login-email").value.trim();
    if (!email) return loginError("Enter your email address first, then choose Forgot password.");
    if (!isAllowedEmail(email)) return loginError("This email is not authorised to reset an admin password.");
    try {
      await sendPasswordResetEmail(auth, email);
      loginError("Password reset email sent. Check your inbox and follow the link.");
    } catch (err) {
      loginError(authError(err));
    }
  });

  $("#btn-google").addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    show($("#login-error"), false);
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === "auth/popup-blocked") return signInWithRedirect(auth, provider);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") return;
      loginError(err.code === "auth/unauthorized-domain"
        ? "This domain isn't authorised in Firebase. Add it under Authentication → Settings → Authorized domains."
        : friendlyError(err));
    }
  });

  onAuthStateChanged(auth, async user => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (!user) return showScreen("login");
    if (!isAllowed(user)) {
      const email = user.email;
      await signOut(auth);
      showScreen("login");
      return loginError(`${email} isn't authorised to use this admin panel.`);
    }
    $("#user-email").textContent = user.email;
    const avatar = $("#user-avatar");
    if (user.photoURL) { avatar.src = user.photoURL; avatar.hidden = false; } else { avatar.hidden = true; }
    showScreen("app");
    openList();
    unsubscribe = onSnapshot(collection(db, "projects"),
      snap => {
        projects = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        renderList();
      },
      err => { $("#list-summary").textContent = "Couldn't load projects."; toast(friendlyError(err), "error"); });
    icons();
  });

  $("#btn-signout").addEventListener("click", () => signOut(auth));
}

/* ───────────── List view ───────────── */
let projects = [];
const listEl = $("#project-list");

function openList() { show($("#view-editor"), false); show($("#view-list"), true); window.scrollTo(0, 0); }

function renderList() {
  const n = projects.length;
  const live = projects.filter(p => p.published).length;
  $("#list-summary").textContent = n ? `${n} project${n === 1 ? "" : "s"} · ${live} published` : "Nothing here yet.";

  if (!n) {
    listEl.innerHTML = `
      <div class="empty">
        <h2>No projects yet</h2>
        <p>Import the four projects already on your site to start managing them here, or create a new one.</p>
        <button class="btn btn-primary" data-action="seed" type="button"><i data-lucide="download" class="icon" aria-hidden="true"></i> Import existing projects</button>
      </div>`;
    return icons();
  }

  listEl.innerHTML = projects.map((p, i) => {
    const img = safeUrl(p.image, { allowData: true });
    return `
    <article class="p-row${p.published ? " is-published" : ""}" data-id="${escapeHtml(p.id)}"${p.published ? ` tabindex="0" role="link" aria-label="Open ${escapeHtml(p.title)}"` : ""}>
      <div class="p-thumb">${img ? `<img src="${escapeHtml(img)}" alt="">` : ""}</div>
      <div class="p-main">
        <h2 class="p-title">${escapeHtml(p.title)}</h2>
        <div class="p-sub">
          <span class="pill ${p.published ? "" : "draft"}">${p.published ? "Published" : "Draft"}</span>
          ${p.type ? `<span>${escapeHtml(p.type)}</span>` : ""}
          <span>${escapeHtml(p.meta || "")}</span>
        </div>
      </div>
      <div class="p-actions">
        <button class="icon-btn" data-action="up" aria-label="Move ${escapeHtml(p.title)} up" ${i === 0 ? "disabled" : ""}><i data-lucide="arrow-up" class="icon" aria-hidden="true"></i></button>
        <button class="icon-btn" data-action="down" aria-label="Move ${escapeHtml(p.title)} down" ${i === n - 1 ? "disabled" : ""}><i data-lucide="arrow-down" class="icon" aria-hidden="true"></i></button>
        ${p.published ? `<a class="icon-btn" href="project.html?project=${encodeURIComponent(p.id)}" target="_blank" rel="noopener" aria-label="View ${escapeHtml(p.title)} on the site"><i data-lucide="external-link" class="icon" aria-hidden="true"></i></a>` : ""}
        <button class="icon-btn" data-action="edit" aria-label="Edit ${escapeHtml(p.title)}"><i data-lucide="pencil" class="icon" aria-hidden="true"></i></button>
        <button class="icon-btn danger" data-action="delete" aria-label="Delete ${escapeHtml(p.title)}"><i data-lucide="trash-2" class="icon" aria-hidden="true"></i></button>
      </div>
    </article>`;
  }).join("");
  icons();
}

listEl.addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  const row = e.target.closest("[data-id]");
  if (!btn) {
    const project = projects.find(p => p.id === row?.dataset.id);
    if (project?.published) window.location.href = `project.html?project=${encodeURIComponent(project.id)}`;
    return;
  }
  const id = btn.closest("[data-id]")?.dataset.id;
  const action = btn.dataset.action;
  if (action === "seed") return seed(btn);
  if (action === "edit") return openEditor(projects.find(p => p.id === id));
  if (action === "delete") return removeProject(projects.find(p => p.id === id));
  if (action === "up" || action === "down") return move(id, action === "up" ? -1 : 1);
});

listEl.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const row = e.target.closest("[data-id]");
  const project = projects.find(p => p.id === row?.dataset.id);
  if (!project?.published || e.target.closest("[data-action]")) return;
  e.preventDefault();
  window.location.href = `project.html?project=${encodeURIComponent(project.id)}`;
});

async function markManaged() { await setDoc(doc(db, "settings", "site"), { managed: true }, { merge: true }); }

async function seed(btn) {
  btn.disabled = true;
  try {
    const batch = writeBatch(db);
    seedProjects.forEach(({ id, ...data }) =>
      batch.set(doc(db, "projects", id), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
    batch.set(doc(db, "settings", "site"), { managed: true }, { merge: true });
    await batch.commit();
    toast("Imported your existing projects.");
  } catch (err) { toast(friendlyError(err), "error"); btn.disabled = false; }
}

async function move(id, dir) {
  const list = [...projects];
  const i = list.findIndex(p => p.id === id), j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  try {
    const batch = writeBatch(db);
    list.forEach((p, idx) => { const order = (idx + 1) * 10; if (p.order !== order) batch.update(doc(db, "projects", p.id), { order, updatedAt: serverTimestamp() }); });
    await batch.commit();
  } catch (err) { toast(friendlyError(err), "error"); }
}

function confirmDialog(title, text) {
  const dlg = $("#confirm");
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  return new Promise(resolve => {
    dlg.addEventListener("close", () => resolve(dlg.returnValue === "ok"), { once: true });
    dlg.returnValue = "cancel";
    dlg.showModal();
  });
}

async function removeProject(p) {
  if (!p) return false;
  const ok = await confirmDialog(`Delete “${p.title}”?`, "It will disappear from your website right away. This can't be undone.");
  if (!ok) return false;
  try {
    await deleteDoc(doc(db, "projects", p.id));
    await markManaged();
    toast("Project deleted.");
    return true;
  } catch (err) { toast(friendlyError(err), "error"); return false; }
}

/* ───────────── Editor ───────────── */
const f = {
  title: $("#f-title"), id: $("#f-id"), summary: $("#f-summary"), meta: $("#f-meta"), type: $("#f-type"),
  tagsInput: $("#f-tags-input"), imageUrl: $("#f-image-url"), alt: $("#f-alt"), repo: $("#f-repo"),
  source: $("#f-source"), readme: $("#f-readme"), order: $("#f-order"), published: $("#f-published"), file: $("#f-file")
};
let editing = null;       // existing project or null when creating
let tags = [];
let image = "";           // data URL, absolute URL or site path
let slugTouched = false;

const slugify = s => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

function openEditor(project) {
  editing = project || null;
  $("#editor-title").textContent = project ? `Edit “${project.title}”` : "New project";
  f.title.value = project?.title || "";
  f.id.value = project?.id || "";
  f.id.readOnly = !!project;
  $("#f-id-help").hidden = !!project;
  slugTouched = !!project;
  f.summary.value = project?.summary || "";
  f.meta.value = project?.meta || "";
  f.type.value = project?.type || "";
  f.alt.value = project?.imageAlt || "";
  f.repo.value = project?.repository || "";
  f.source.value = project?.source || "";
  f.readme.value = project?.readme || "";
  f.order.value = project?.order ?? ((projects.at(-1)?.order ?? 0) + 10);
  f.published.checked = project ? !!project.published : true;
  tags = [...(project?.tags || [])];
  setImage(project?.image || "");
  setReadmeTab("write");
  show($("#form-error"), false);
  show($("#btn-delete"), !!project);
  $("#btn-save").textContent = project ? "Save changes" : "Create project";
  show($("#view-list"), false);
  show($("#view-editor"), true);
  renderChips(); refreshPreview(); updateCounts();
  window.scrollTo(0, 0);
  f.title.focus();
  icons();
}

$("#btn-new").addEventListener("click", () => openEditor(null));
$("#btn-back").addEventListener("click", openList);
$("#btn-cancel").addEventListener("click", openList);

/* tags */
function renderChips() {
  $("#chips").querySelectorAll(".chip").forEach(c => c.remove());
  tags.forEach((t, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.append(t);
    const rm = document.createElement("button");
    rm.type = "button"; rm.textContent = "×"; rm.setAttribute("aria-label", `Remove tag ${t}`);
    rm.addEventListener("click", () => { tags.splice(i, 1); renderChips(); refreshPreview(); });
    chip.append(rm);
    f.tagsInput.before(chip);
  });
}
function commitTag() {
  const v = f.tagsInput.value.replace(/,/g, "").trim();
  if (v && !tags.includes(v) && tags.length < 10) { tags.push(v); renderChips(); refreshPreview(); }
  f.tagsInput.value = "";
}
f.tagsInput.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commitTag(); }
  else if (e.key === "Backspace" && !f.tagsInput.value && tags.length) { tags.pop(); renderChips(); refreshPreview(); }
});
f.tagsInput.addEventListener("blur", commitTag);

/* image */
const setImage = value => {
  image = value;
  const isData = value.startsWith("data:");
  f.imageUrl.value = isData ? "" : value;
  f.imageUrl.placeholder = isData ? "Using the uploaded image" : "…or paste an image URL / file path";
  const thumb = $("#image-thumb");
  const src = safeUrl(value, { allowData: true });
  thumb.innerHTML = src ? `<img alt="" src="${escapeHtml(src)}">` : "<span>No image</span>";
  show($("#btn-image-clear"), !!value);
  $("#image-info").textContent = isData
    ? `Uploaded image · ${Math.round(value.length * 0.75 / 1024)} KB, stored in your database.`
    : "Uploads are resized and stored for free inside your database, so no paid storage is needed.";
};

f.imageUrl.addEventListener("input", () => { image = f.imageUrl.value.trim(); setImage(image); f.imageUrl.focus(); refreshPreview(); });
$("#btn-image-clear").addEventListener("click", () => { setImage(""); refreshPreview(); });
$("#btn-upload").addEventListener("click", () => f.file.click());
f.file.addEventListener("change", async () => {
  const file = f.file.files[0];
  f.file.value = "";
  if (!file) return;
  try { setImage(await fileToDataUrl(file)); refreshPreview(); }
  catch (err) { toast(err.message || "Couldn't read that image.", "error"); }
});

const MAX_CHARS = 380_000; // keeps the whole document safely under Firestore's 1 MiB limit

async function fileToDataUrl(file) {
  if (file.type === "image/svg+xml") {
    const text = await file.text();
    const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(text)));
    if (url.length > MAX_CHARS) throw new Error("That SVG is too large (max ≈ 280 KB).");
    return url;
  }
  const bmp = await createImageBitmap(file);
  let width = Math.min(1200, bmp.width);
  for (let attempt = 0; attempt < 6; attempt++) {
    const height = Math.round(bmp.height * (width / bmp.width));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    canvas.getContext("2d").drawImage(bmp, 0, 0, width, height);
    for (const q of [0.85, 0.72, 0.6, 0.48]) {
      let url = canvas.toDataURL("image/webp", q);
      if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/jpeg", q); // older Safari
      if (url.length <= MAX_CHARS) return url;
    }
    width = Math.round(width * 0.8);
  }
  throw new Error("Couldn't shrink that image enough. Try a smaller one.");
}

/* title → slug, counters, preview */
f.title.addEventListener("input", () => { if (!slugTouched) f.id.value = slugify(f.title.value); });
f.id.addEventListener("input", () => { slugTouched = true; f.id.value = slugify(f.id.value); });
const updateCounts = () => { $("#summary-count").textContent = `${f.summary.value.length}/400`; };
f.published.addEventListener("change", () => { $("#published-label").textContent = f.published.checked ? "Published" : "Draft"; });

const collect = () => ({
  id: f.id.value.trim(),
  title: f.title.value.trim(),
  summary: f.summary.value.trim(),
  meta: f.meta.value.trim(),
  type: f.type.value.trim(),
  tags,
  image,
  imageAlt: f.alt.value.trim(),
  repository: f.repo.value.trim(),
  source: f.source.value.trim(),
  readme: f.readme.value,
  order: Number(f.order.value) || 0,
  published: f.published.checked
});

let previewTimer;
function refreshPreview() {
  const p = collect();
  $("#card-preview").innerHTML = `<div class="project-grid" style="grid-template-columns:1fr">${projectCardHTML({ ...p, title: p.title || "Untitled project" }, { link: false })}</div>`;
  icons();
}
$("#project-form").addEventListener("input", () => { updateCounts(); clearTimeout(previewTimer); previewTimer = setTimeout(refreshPreview, 120); });

/* README tabs */
function setReadmeTab(tab) {
  const write = tab === "write";
  $("#tab-write").setAttribute("aria-selected", String(write));
  $("#tab-preview").setAttribute("aria-selected", String(!write));
  show(f.readme, write);
  show($("#readme-preview"), !write);
  if (!write) $("#readme-preview").innerHTML = renderMarkdown(f.readme.value) || "<p>Nothing to preview yet.</p>";
}
$("#tab-write").addEventListener("click", () => setReadmeTab("write"));
$("#tab-preview").addEventListener("click", () => setReadmeTab("preview"));

/* save / delete */
const formError = msg => { const e = $("#form-error"); e.textContent = msg; show(e, true); e.scrollIntoView({ block: "nearest" }); };

$("#project-form").addEventListener("submit", async e => {
  e.preventDefault();
  commitTag();
  show($("#form-error"), false);
  const p = collect();

  if (!p.title) return formError("Please add a title."), f.title.focus();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) return formError("The page address needs lowercase letters, numbers and dashes only."), f.id.focus();
  for (const [key, label] of [["repository", "GitHub repository"], ["source", "View-code"]]) {
    if (p[key] && !/^https?:\/\//i.test(p[key])) return formError(`${label} URL must start with https://`);
  }
  if (p.image && !safeUrl(p.image, { allowData: true })) return formError("That image URL or path isn't valid.");
  const { id, ...data } = p;
  if (JSON.stringify(data).length > 900_000) return formError("This project is too large to save (limit ≈ 1 MB). Use a smaller image or a shorter README.");

  const btn = $("#btn-save");
  btn.disabled = true;
  try {
    const ref = doc(db, "projects", id);
    if (!editing) {
      if ((await getDoc(ref)).exists()) { btn.disabled = false; return formError(`A project with the address “${id}” already exists.`); }
      await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    } else {
      await setDoc(ref, { ...data, createdAt: editing.createdAt || serverTimestamp(), updatedAt: serverTimestamp() });
    }
    await markManaged();
    toast(editing ? "Changes saved." : "Project created.");
    openList();
  } catch (err) { formError(friendlyError(err)); }
  btn.disabled = false;
});

$("#btn-delete").addEventListener("click", async () => { if (editing && await removeProject(editing)) openList(); });

// Warn before closing the tab in the middle of editing
window.addEventListener("beforeunload", e => { if (!$("#view-editor").hidden) { e.preventDefault(); e.returnValue = ""; } });
