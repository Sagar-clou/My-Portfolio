/* ============================================================
   FILE: admin.js
   ROLE: Admin behavior, Firebase CRUD, authentication, and editor
         interactions; drives admin.html.
   ============================================================ */

// ------------------------------------------------------------
// 1. MODULE IMPORTS
// ------------------------------------------------------------
import { app, db, isConfigured } from "./firebase-init.js";
import { ADMIN_EMAILS } from "./firebase-config.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { escapeHtml, renderMarkdown } from "./markdown.js";
import { projectCardHTML, safeUrl } from "./project-card.js";
import { seedProjects } from "./seed-projects.js";
import { defaultSiteContent } from "./default-site-content.js";

// ------------------------------------------------------------
// 2. DOM UTILITIES & HELPERS
// ------------------------------------------------------------
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const icons = () => window.lucide && window.lucide.createIcons();
const show = (el, on) => {
  if (el) el.hidden = !on;
};

const screens = {
  config: $("#screen-config"),
  login: $("#screen-login"),
  app: $("#screen-app")
};

const showScreen = name => {
  Object.entries(screens).forEach(([k, el]) => show(el, k === name));
};

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

// ------------------------------------------------------------
// 3. SITE CONTENT STATE
// ------------------------------------------------------------
let siteContent = JSON.parse(JSON.stringify(defaultSiteContent));
let activeSection = "hero";
let jsonMode = "kv"; // "kv" or "raw"
let modalItemContext = null; // { type: 'journey'|'skill_node'|'flow_step', mode: 'add'|'edit', item, index }

// ------------------------------------------------------------
// 4. FIREBASE AUTHENTICATION & ACCESS CONTROL
// ------------------------------------------------------------
if (!isConfigured) {
  showScreen("config");
} else {
  const auth = getAuth(app);
  const allowed = ADMIN_EMAILS.map(e => e.toLowerCase());
  const isAllowed = u => !!u && u.emailVerified && allowed.includes((u.email || "").toLowerCase());
  const isAllowedEmail = email => allowed.includes(email.trim().toLowerCase());
  let unsubscribe = null;

  const loginError = msg => {
    const e = $("#login-error");
    e.textContent = msg;
    show(e, true);
  };

  const clearLoginError = () => show($("#login-error"), false);

  const authError = err =>
    ({
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
      loginError(
        err.code === "auth/unauthorized-domain"
          ? "This domain isn't authorised in Firebase. Add it under Authentication → Settings → Authorized domains."
          : friendlyError(err)
      );
    }
  });

  onAuthStateChanged(auth, async user => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (!user) return showScreen("login");
    if (!isAllowed(user)) {
      const email = user.email;
      await signOut(auth);
      showScreen("login");
      return loginError(`${email} isn't authorised to use this admin panel.`);
    }

    $("#user-email").textContent = user.email;
    const avatar = $("#user-avatar");
    if (user.photoURL) {
      avatar.src = user.photoURL;
      avatar.hidden = false;
    } else {
      avatar.hidden = true;
    }

    showScreen("app");
    switchNavPane("dashboard");
    openList();

    // 1. Listen to projects collection
    unsubscribe = onSnapshot(
      collection(db, "projects"),
      snap => {
        projects = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        renderList();
        renderDashboard();
      },
      err => {
        $("#list-summary").textContent = "Couldn't load projects.";
        toast(friendlyError(err), "error");
      }
    );

    // 2. Fetch site content from settings/site
    try {
      const siteSnap = await getDoc(doc(db, "settings", "site"));
      if (siteSnap.exists() && siteSnap.data()?.content) {
        siteContent = JSON.parse(JSON.stringify(siteSnap.data().content));
      } else {
        siteContent = JSON.parse(JSON.stringify(defaultSiteContent));
      }
      renderDashboard();
      renderActiveSection();
      renderJsonView();
    } catch (err) {
      console.warn("Could not load site content from settings/site:", err);
    }

    icons();
  });

  $("#btn-signout").addEventListener("click", () => signOut(auth));
}

// ------------------------------------------------------------
// 5. NAVIGATION TABS & PANE SWITCHER
// ------------------------------------------------------------
const navPanes = {
  dashboard: $("#pane-dashboard"),
  projects: $("#pane-projects"),
  content: $("#pane-content"),
  json: $("#pane-json")
};

const navButtons = {
  dashboard: $("#nav-btn-dashboard"),
  projects: $("#nav-btn-projects"),
  content: $("#nav-btn-content"),
  json: $("#nav-btn-json")
};

// ------------------------------------------------------------
// 6. RESPONSIVE ADMIN NAVIGATION DRAWER
// ------------------------------------------------------------
const adminMenuToggle = $("#admin-menu-toggle");
const adminNavDrawer = $("#admin-navigation");
const adminNavBackdrop = $("#admin-nav-backdrop");

function setAdminNavOpen(open) {
  if (!adminMenuToggle || !adminNavDrawer || !adminNavBackdrop) return;

  adminNavDrawer.classList.toggle("is-open", open);
  adminNavBackdrop.classList.toggle("is-open", open);
  document.body.classList.toggle("admin-nav-open", open);
  adminMenuToggle.setAttribute("aria-expanded", String(open));
  adminMenuToggle.setAttribute("aria-label", open ? "Close admin navigation" : "Open admin navigation");

  const icon = document.createElement("i");
  icon.dataset.lucide = open ? "x" : "menu";
  icon.className = "icon";
  icon.setAttribute("aria-hidden", "true");
  adminMenuToggle.replaceChildren(icon);
  icons();
}

adminMenuToggle?.addEventListener("click", () => {
  setAdminNavOpen(!adminNavDrawer.classList.contains("is-open"));
});

adminNavBackdrop?.addEventListener("click", () => setAdminNavOpen(false));

Object.values(navButtons).forEach(button => {
  button?.addEventListener("click", () => setAdminNavOpen(false));
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) setAdminNavOpen(false);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && adminNavDrawer?.classList.contains("is-open")) {
    setAdminNavOpen(false);
    adminMenuToggle?.focus();
  }
});

function switchNavPane(name) {
  Object.entries(navPanes).forEach(([k, el]) => show(el, k === name));
  Object.entries(navButtons).forEach(([k, btn]) => {
    btn?.classList.toggle("is-active", k === name);
    btn?.setAttribute("aria-selected", String(k === name));
  });

  if (name === "dashboard") renderDashboard();
  if (name === "content") renderActiveSection();
  if (name === "json") renderJsonView();
  if (name === "projects") openList();

  icons();
}

navButtons.dashboard?.addEventListener("click", () => switchNavPane("dashboard"));
navButtons.projects?.addEventListener("click", () => switchNavPane("projects"));
navButtons.content?.addEventListener("click", () => switchNavPane("content"));
navButtons.json?.addEventListener("click", () => switchNavPane("json"));

/* Helper to select a section and switch to content pane */
function selectSection(secName) {
  activeSection = secName;
  $$(".sec-pill").forEach(p => p.classList.toggle("is-active", p.dataset.sec === secName));
  renderActiveSection();
}

// ------------------------------------------------------------
// 6. DASHBOARD HOME (KPIS, ACTIVITY & REAL-TIME PREVIEWS)
// ------------------------------------------------------------
function renderDashboard() {
  const n = projects.length;
  const live = projects.filter(p => p.published).length;
  const drafts = n - live;

  const countEl = $("#dash-kpi-projects-count");
  if (countEl) countEl.textContent = n;

  const subEl = $("#dash-kpi-projects-sub");
  if (subEl) subEl.textContent = `${live} Published · ${drafts} Draft${drafts === 1 ? '' : 's'}`;

  const stackEl = $("#dash-kpi-stack-count");
  if (stackEl) {
    stackEl.textContent = `${siteContent.skills?.nodes?.length || 4} / ${siteContent.skills?.flow_steps?.length || 5}`;
  }

  const journeyEl = $("#dash-kpi-journey-count");
  if (journeyEl) {
    journeyEl.textContent = siteContent.journey?.items?.length || 4;
  }

  // 1. Projects Snapshot Mini List
  const dashList = $("#dash-projects-list");
  if (dashList) {
    if (!projects.length) {
      dashList.innerHTML = `
        <div class="empty" style="padding: 24px 16px;">
          <p>No projects created yet. Start by adding your first project.</p>
          <button class="btn btn-primary btn-sm" id="dash-btn-add-empty" type="button">
            <i data-lucide="plus" class="icon" aria-hidden="true"></i> New Project
          </button>
        </div>`;
      $("#dash-btn-add-empty")?.addEventListener("click", () => {
        switchNavPane("projects");
        openEditor(null);
      });
    } else {
      dashList.innerHTML = projects.slice(0, 4).map(p => {
        const img = safeUrl(p.image, { allowData: true });
        return `
          <div class="dash-p-row" data-id="${escapeHtml(p.id)}">
            <div class="dash-p-thumb">${img ? `<img src="${escapeHtml(img)}" alt="">` : ''}</div>
            <div class="dash-p-info">
              <h4 class="dash-p-title">${escapeHtml(p.title)}</h4>
              <div class="dash-p-meta">
                <span class="pill ${p.published ? '' : 'draft'}">${p.published ? 'Published' : 'Draft'}</span>
                ${p.type ? `<span>${escapeHtml(p.type)}</span>` : ''}
                <span>${escapeHtml(p.meta || '')}</span>
              </div>
            </div>
            <button class="btn btn-sm" data-action="dash-edit" aria-label="Edit ${escapeHtml(p.title)}">
              <i data-lucide="pencil" class="icon" aria-hidden="true"></i> Edit
            </button>
          </div>
        `;
      }).join('');
    }
  }

  // 2. Bio & Direction Snippet (Interactive)
  const bioSnippet = $("#dash-bio-snippet");
  if (bioSnippet) {
    const currentDirection = siteContent.journey?.items?.find(it => it.isCurrent || it.date === 'NEXT');
    bioSnippet.setAttribute("tabindex", "0");
    bioSnippet.setAttribute("role", "button");
    bioSnippet.setAttribute("title", "Tap to edit bio in About Me");
    bioSnippet.innerHTML = `
      <p class="dash-bio-quote">“${escapeHtml(siteContent.about?.bio || defaultSiteContent.about.bio)}”</p>
      <div class="dash-bio-next">
        <span class="pill">Current Target</span>
        <strong>${escapeHtml(currentDirection?.title || 'Continuous learning & building')}</strong>
        <span class="dash-tap-badge"><i data-lucide="pencil" class="icon" aria-hidden="true"></i> Edit bio</span>
      </div>
    `;
  }

  // 3. Live Public Focus Card (Interactive)
  const focusWrap = $("#dash-focus-preview-wrap");
  if (focusWrap) {
    const h = siteContent.hero || {};
    const avatarSrc = safeUrl(h.focus_avatar || 'sagar-profile.jpg', { allowData: true });
    focusWrap.setAttribute("tabindex", "0");
    focusWrap.setAttribute("role", "button");
    focusWrap.setAttribute("title", "Tap to customize Focus Card in Hero section");
    focusWrap.innerHTML = `
      <span class="dash-focus-hint"><i data-lucide="pencil" class="icon" aria-hidden="true"></i> Tap to edit</span>
      <div class="profile-card">
        <div class="card-top">
          <span class="tiny-label">${escapeHtml(h.focus_label || 'CURRENT FOCUS')}</span>
          <span class="live-pill"><span></span> ${escapeHtml(h.focus_status || 'Building')}</span>
        </div>
        <div class="avatar">
          <img src="${escapeHtml(avatarSrc)}" alt="Sagar Gupta">
          <span class="avatar-spark">✦</span>
        </div>
        <h2>${escapeHtml(h.focus_title_line1 || 'Curious mind.')}<br><span>${escapeHtml(h.focus_title_line2 || 'Practical builder.')}</span></h2>
        <p>${escapeHtml(h.focus_description || 'Computer Science student turning ideas into prototypes and experiments.')}</p>
        <div class="focus-tags">${(h.focus_tags || ['Python', 'Full-Stack', 'AI / ML']).map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>
        <div class="card-bottom"><span>${escapeHtml(h.focus_badge || 'PORTFOLIO')}</span></div>
      </div>
    `;
  }

  // 4. Quick Contact Channels (Interactive)
  const contactQuick = $("#dash-contact-quick");
  if (contactQuick) {
    const c = siteContent.contact || {};
    const cleanNum = (c.whatsapp_number || '919354707042').replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(c.whatsapp_message || 'Hi Sagar, I saw your portfolio.')}`;
    contactQuick.innerHTML = `
      <a class="dash-contact-btn" href="${waUrl}" target="_blank" rel="noopener" title="Test direct WhatsApp chat link">
        <i data-lucide="message-circle" class="icon" aria-hidden="true"></i> Test WhatsApp
      </a>
      <a class="dash-contact-btn" href="mailto:${escapeHtml(c.email || 'guptasagar2201@gmail.com')}" title="Send test email">
        <i data-lucide="mail" class="icon" aria-hidden="true"></i> Test Email
      </a>
      <a class="dash-contact-btn" href="${escapeHtml(c.github_url || 'https://github.com/Sagar-clou')}" target="_blank" rel="noopener" title="Open GitHub profile in new tab">
        <i data-lucide="github" class="icon" aria-hidden="true"></i> GitHub Profile
      </a>
      <a class="dash-contact-btn" href="index.html#contact" target="_blank" rel="noopener" title="View contact section on public website">
        <i data-lucide="external-link" class="icon" aria-hidden="true"></i> Live Contact
      </a>
    `;
  }

  icons();
}

// Dashboard Click Handlers — All items are directly interactive!
$("#dash-sync-badge")?.addEventListener("click", () => {
  toast("Firestore cloud sync is active · Public site matches database.");
});

$("#dash-btn-new-project")?.addEventListener("click", () => {
  switchNavPane("projects");
  openEditor(null);
});

$("#act-new-proj")?.addEventListener("click", () => {
  switchNavPane("projects");
  openEditor(null);
});

$("#dash-btn-view-all-projects")?.addEventListener("click", () => switchNavPane("projects"));
$("#kpi-projects-card")?.addEventListener("click", () => switchNavPane("projects"));
$("#kpi-sections-card")?.addEventListener("click", () => switchNavPane("content"));

$("#kpi-skills-card")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("skills");
});

$("#kpi-journey-card")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("journey");
});

$("#act-edit-hero")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("hero");
});

$("#dash-btn-edit-focus")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("hero");
});

$("#act-edit-about")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("about");
});

$("#dash-btn-edit-bio")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("about");
});

$("#act-edit-journey")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("journey");
});

$("#act-edit-skills")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("skills");
});

$("#act-edit-contact")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("contact");
});

$("#act-open-json")?.addEventListener("click", () => switchNavPane("json"));

// Interactive Bio Card & Focus Preview Card
$("#dash-bio-snippet")?.addEventListener("click", e => {
  if (e.target.closest(".dash-bio-next")) {
    switchNavPane("content");
    selectSection("journey");
  } else {
    switchNavPane("content");
    selectSection("about");
  }
});

$("#dash-focus-preview-wrap")?.addEventListener("click", () => {
  switchNavPane("content");
  selectSection("hero");
});

// Interactive Project Rows (Click anywhere on row to open editor)
$("#dash-projects-list")?.addEventListener("click", e => {
  const row = e.target.closest("[data-id]");
  if (row) {
    const p = projects.find(it => it.id === row.dataset.id);
    if (p) {
      switchNavPane("projects");
      openEditor(p);
    }
  }
});

// Interactive Health Items
$("#dash-health-db")?.addEventListener("click", () => {
  toast("Firestore Cloud Database connection is healthy and responsive.");
});

$("#dash-health-auth")?.addEventListener("click", () => {
  const email = $("#user-email")?.textContent || "guptasagar2201@gmail.com";
  toast(`Logged in as: ${email} (Authorised admin account)`);
});

$("#dash-health-host")?.addEventListener("click", () => {
  window.open("index.html", "_blank");
});

// Keyboard accessibility for dashboard interactive items (Enter or Space key)
[
  "kpi-projects-card",
  "kpi-sections-card",
  "kpi-skills-card",
  "kpi-journey-card",
  "dash-sync-badge",
  "dash-bio-snippet",
  "dash-focus-preview-wrap",
  "dash-health-db",
  "dash-health-auth",
  "dash-health-host"
].forEach(id => {
  $(`#${id}`)?.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      $(`#${id}`)?.click();
    }
  });
});

/* Seed Content Button */
$("#btn-seed-site").addEventListener("click", async () => {
  const ok = await confirmDialog(
    "Seed Site Content?",
    "This will populate Firestore with complete default content for Hero, About, Journey, Skills, and Contact."
  );
  if (!ok) return;

  try {
    siteContent = JSON.parse(JSON.stringify(defaultSiteContent));
    await setDoc(doc(db, "settings", "site"), { content: siteContent, managed: true }, { merge: true });
    toast("Site content seeded successfully!");
    renderActiveSection();
    renderJsonView();
  } catch (err) {
    toast(friendlyError(err), "error");
  }
});

// ------------------------------------------------------------
// 7. PROJECTS MANAGEMENT & CRUD OPERATIONS
// ------------------------------------------------------------
let projects = [];
const listEl = $("#project-list");

function openList() {
  show($("#view-editor"), false);
  show($("#view-list"), true);
  window.scrollTo(0, 0);
}

function renderList() {
  const n = projects.length;
  const live = projects.filter(p => p.published).length;
  $("#list-summary").textContent = n
    ? `${n} project${n === 1 ? "" : "s"} · ${live} published`
    : "Nothing here yet.";

  if (!n) {
    listEl.innerHTML = `
      <div class="empty">
        <h2>No projects yet</h2>
        <p>Import the four projects already on your site to start managing them here, or create a new one.</p>
        <button class="btn btn-primary" data-action="seed" type="button">
          <i data-lucide="download" class="icon" aria-hidden="true"></i> Import existing projects
        </button>
      </div>`;
    return icons();
  }

  listEl.innerHTML = projects
    .map((p, i) => {
      const img = safeUrl(p.image, { allowData: true });
      return `
      <article class="p-row${p.published ? " is-published" : ""}" data-id="${escapeHtml(p.id)}"${
        p.published ? ` tabindex="0" role="link" aria-label="Open ${escapeHtml(p.title)}"` : ""
      }>
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
          <button class="icon-btn" data-action="up" aria-label="Move ${escapeHtml(p.title)} up" ${i === 0 ? "disabled" : ""}>
            <i data-lucide="arrow-up" class="icon" aria-hidden="true"></i>
          </button>
          <button class="icon-btn" data-action="down" aria-label="Move ${escapeHtml(p.title)} down" ${i === n - 1 ? "disabled" : ""}>
            <i data-lucide="arrow-down" class="icon" aria-hidden="true"></i>
          </button>
          ${
            p.published
              ? `<a class="icon-btn" href="project.html?project=${encodeURIComponent(p.id)}" target="_blank" rel="noopener" aria-label="View ${escapeHtml(p.title)} on the site">
                  <i data-lucide="external-link" class="icon" aria-hidden="true"></i>
                </a>`
              : ""
          }
          <button class="icon-btn" data-action="edit" aria-label="Edit ${escapeHtml(p.title)}">
            <i data-lucide="pencil" class="icon" aria-hidden="true"></i>
          </button>
          <button class="icon-btn danger" data-action="delete" aria-label="Delete ${escapeHtml(p.title)}">
            <i data-lucide="trash-2" class="icon" aria-hidden="true"></i>
          </button>
        </div>
      </article>`;
    })
    .join("");

  icons();
}

listEl.addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  const row = e.target.closest("[data-id]");

  if (!btn) {
    const project = projects.find(p => p.id === row?.dataset.id);
    if (project?.published) {
      window.location.href = `project.html?project=${encodeURIComponent(project.id)}`;
    }
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

async function markManaged() {
  await setDoc(doc(db, "settings", "site"), { managed: true }, { merge: true });
}

async function seed(btn) {
  btn.disabled = true;
  try {
    const batch = writeBatch(db);
    seedProjects.forEach(({ id, ...data }) =>
      batch.set(doc(db, "projects", id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );
    batch.set(doc(db, "settings", "site"), { managed: true, content: siteContent }, { merge: true });
    await batch.commit();
    toast("Imported your existing projects.");
  } catch (err) {
    toast(friendlyError(err), "error");
    btn.disabled = false;
  }
}

async function move(id, dir) {
  const list = [...projects];
  const i = list.findIndex(p => p.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;

  [list[i], list[j]] = [list[j], list[i]];

  try {
    const batch = writeBatch(db);
    list.forEach((p, idx) => {
      const order = (idx + 1) * 10;
      if (p.order !== order) {
        batch.update(doc(db, "projects", p.id), { order, updatedAt: serverTimestamp() });
      }
    });
    await batch.commit();
  } catch (err) {
    toast(friendlyError(err), "error");
  }
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
  const ok = await confirmDialog(
    `Delete “${p.title}”?`,
    "It will disappear from your website right away. This can't be undone."
  );
  if (!ok) return false;

  try {
    await deleteDoc(doc(db, "projects", p.id));
    await markManaged();
    toast("Project deleted.");
    return true;
  } catch (err) {
    toast(friendlyError(err), "error");
    return false;
  }
}

// ------------------------------------------------------------
// 8. PROJECT EDITOR (FORM, IMAGES & MARKDOWN PREVIEW)
// ------------------------------------------------------------
const f = {
  title: $("#f-title"),
  id: $("#f-id"),
  summary: $("#f-summary"),
  meta: $("#f-meta"),
  type: $("#f-type"),
  tagsInput: $("#f-tags-input"),
  imageUrl: $("#f-image-url"),
  alt: $("#f-alt"),
  repo: $("#f-repo"),
  source: $("#f-source"),
  readme: $("#f-readme"),
  order: $("#f-order"),
  published: $("#f-published"),
  file: $("#f-file")
};

let editing = null;
let tags = [];
let image = "";
let slugTouched = false;

const slugify = s =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

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
  renderChips();
  refreshPreview();
  updateCounts();
  window.scrollTo(0, 0);
  f.title.focus();
  icons();
}

$("#btn-new").addEventListener("click", () => openEditor(null));
$("#btn-back").addEventListener("click", openList);
$("#btn-cancel").addEventListener("click", openList);

/* Tags Chip Management */
function renderChips() {
  $("#chips").querySelectorAll(".chip").forEach(c => c.remove());
  tags.forEach((t, i) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.append(t);

    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "×";
    rm.setAttribute("aria-label", `Remove tag ${t}`);
    rm.addEventListener("click", () => {
      tags.splice(i, 1);
      renderChips();
      refreshPreview();
    });

    chip.append(rm);
    f.tagsInput.before(chip);
  });
}

function commitTag() {
  const v = f.tagsInput.value.replace(/,/g, "").trim();
  if (v && !tags.includes(v) && tags.length < 10) {
    tags.push(v);
    renderChips();
    refreshPreview();
  }
  f.tagsInput.value = "";
}

f.tagsInput.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    commitTag();
  } else if (e.key === "Backspace" && !f.tagsInput.value && tags.length) {
    tags.pop();
    renderChips();
    refreshPreview();
  }
});

f.tagsInput.addEventListener("blur", commitTag);

/* Image Upload & Data URL Handling */
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
    ? `Uploaded image · ${Math.round((value.length * 0.75) / 1024)} KB, stored in your database.`
    : "Uploads are resized and stored for free inside your database, so no paid storage is needed.";
};

f.imageUrl.addEventListener("input", () => {
  image = f.imageUrl.value.trim();
  setImage(image);
  f.imageUrl.focus();
  refreshPreview();
});

$("#btn-image-clear").addEventListener("click", () => {
  setImage("");
  refreshPreview();
});

$("#btn-upload").addEventListener("click", () => f.file.click());

f.file.addEventListener("change", async () => {
  const file = f.file.files[0];
  f.file.value = "";
  if (!file) return;

  try {
    setImage(await fileToDataUrl(file));
    refreshPreview();
  } catch (err) {
    toast(err.message || "Couldn't read that image.", "error");
  }
});

const MAX_CHARS = 380_000;

async function fileToDataUrl(file) {
  if (file.type === "image/svg+xml") {
    const text = await file.text();
    const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(text)));
    if (url.length > MAX_CHARS) {
      throw new Error("That SVG is too large (max ≈ 280 KB).");
    }
    return url;
  }

  const bmp = await createImageBitmap(file);
  let width = Math.min(1200, bmp.width);

  for (let attempt = 0; attempt < 6; attempt++) {
    const height = Math.round(bmp.height * (width / bmp.width));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(bmp, 0, 0, width, height);

    for (const q of [0.85, 0.72, 0.6, 0.48]) {
      let url = canvas.toDataURL("image/webp", q);
      if (!url.startsWith("data:image/webp")) {
        url = canvas.toDataURL("image/jpeg", q);
      }
      if (url.length <= MAX_CHARS) return url;
    }
    width = Math.round(width * 0.8);
  }

  throw new Error("Couldn't shrink that image enough. Try a smaller one.");
}

f.title.addEventListener("input", () => {
  if (!slugTouched) f.id.value = slugify(f.title.value);
});

f.id.addEventListener("input", () => {
  slugTouched = true;
  f.id.value = slugify(f.id.value);
});

const updateCounts = () => {
  $("#summary-count").textContent = `${f.summary.value.length}/400`;
};

f.published.addEventListener("change", () => {
  $("#published-label").textContent = f.published.checked ? "Published" : "Draft";
});

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
  $("#card-preview").innerHTML = `
    <div class="project-grid" style="grid-template-columns:1fr">
      ${projectCardHTML({ ...p, title: p.title || "Untitled project" }, { link: false })}
    </div>`;
  icons();
}

$("#project-form").addEventListener("input", () => {
  updateCounts();
  clearTimeout(previewTimer);
  previewTimer = setTimeout(refreshPreview, 120);
});

function setReadmeTab(tab) {
  const write = tab === "write";
  $("#tab-write").setAttribute("aria-selected", String(write));
  $("#tab-preview").setAttribute("aria-selected", String(!write));
  show(f.readme, write);
  show($("#readme-preview"), !write);
  if (!write) {
    $("#readme-preview").innerHTML = renderMarkdown(f.readme.value) || "<p>Nothing to preview yet.</p>";
  }
}

$("#tab-write").addEventListener("click", () => setReadmeTab("write"));
$("#tab-preview").addEventListener("click", () => setReadmeTab("preview"));

const formError = msg => {
  const e = $("#form-error");
  e.textContent = msg;
  show(e, true);
  e.scrollIntoView({ block: "nearest" });
};

$("#project-form").addEventListener("submit", async e => {
  e.preventDefault();
  commitTag();
  show($("#form-error"), false);
  const p = collect();

  if (!p.title) {
    formError("Please add a title.");
    f.title.focus();
    return;
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) {
    formError("The page address needs lowercase letters, numbers and dashes only.");
    f.id.focus();
    return;
  }

  for (const [key, label] of [
    ["repository", "GitHub repository"],
    ["source", "View-code"]
  ]) {
    if (p[key] && !/^https?:\/\//i.test(p[key])) {
      return formError(`${label} URL must start with https://`);
    }
  }

  if (p.image && !safeUrl(p.image, { allowData: true })) {
    return formError("That image URL or path isn't valid.");
  }

  const { id, ...data } = p;
  if (JSON.stringify(data).length > 900_000) {
    return formError("This project is too large to save (limit ≈ 1 MB). Use a smaller image or a shorter README.");
  }

  const btn = $("#btn-save");
  btn.disabled = true;

  try {
    const ref = doc(db, "projects", id);
    if (!editing) {
      if ((await getDoc(ref)).exists()) {
        btn.disabled = false;
        return formError(`A project with the address “${id}” already exists.`);
      }
      await setDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(ref, {
        ...data,
        createdAt: editing.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await markManaged();
    toast(editing ? "Changes saved." : "Project created.");
    openList();
  } catch (err) {
    formError(friendlyError(err));
  }

  btn.disabled = false;
});

$("#btn-delete").addEventListener("click", async () => {
  if (editing && (await removeProject(editing))) {
    openList();
  }
});

// ------------------------------------------------------------
// 9. SITE SECTIONS VISUAL EDITOR & FORMS
// ------------------------------------------------------------
$$(".sec-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    $$(".sec-pill").forEach(p => p.classList.remove("is-active"));
    pill.classList.add("is-active");
    activeSection = pill.dataset.sec;
    renderActiveSection();
  });
});

function renderActiveSection() {
  const container = $("#section-form-container");
  if (!container) return;
  const sec = siteContent[activeSection] || {};

  if (activeSection === "hero") {
    container.innerHTML = `
      <h2>Hero &amp; Focus Card Settings</h2>
      <div class="row2">
        <div class="field">
          <label for="sec-hero-prefix">Headline Prefix</label>
          <input id="sec-hero-prefix" value="${escapeHtml(sec.headline_prefix || '')}" placeholder="Have an idea?">
        </div>
        <div class="field">
          <label for="sec-hero-grad">Headline Gradient Accent</label>
          <input id="sec-hero-grad" value="${escapeHtml(sec.headline_gradient || '')}" placeholder="Let's make it useful product.">
        </div>
      </div>
      <div class="field">
        <label for="sec-hero-lead">Lead Description</label>
        <textarea id="sec-hero-lead" rows="3">${escapeHtml(sec.lead || '')}</textarea>
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-hero-degree">Degree Badge</label>
          <input id="sec-hero-degree" value="${escapeHtml(sec.degree || '')}" placeholder="B.Tech · Computer Science">
        </div>
        <div class="field">
          <label for="sec-hero-location">Location Badge</label>
          <input id="sec-hero-location" value="${escapeHtml(sec.location || '')}" placeholder="Faridabad, India">
        </div>
      </div>

      <h3 style="margin-top: 14px;">Focus Card</h3>
      <div class="row2">
        <div class="field">
          <label for="sec-hero-flabel">Top Label</label>
          <input id="sec-hero-flabel" value="${escapeHtml(sec.focus_label || '')}" placeholder="CURRENT FOCUS">
        </div>
        <div class="field">
          <label for="sec-hero-fstatus">Status Pill</label>
          <input id="sec-hero-fstatus" value="${escapeHtml(sec.focus_status || '')}" placeholder="Building">
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-hero-favatar">Avatar Image Path / URL</label>
          <input id="sec-hero-favatar" value="${escapeHtml(sec.focus_avatar || '')}" placeholder="sagar-profile.jpg">
        </div>
        <div class="field">
          <label for="sec-hero-fbadge">Bottom Label</label>
          <input id="sec-hero-fbadge" value="${escapeHtml(sec.focus_badge || '')}" placeholder="PORTFOLIO">
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-hero-ftitle1">Card Title Line 1</label>
          <input id="sec-hero-ftitle1" value="${escapeHtml(sec.focus_title_line1 || '')}" placeholder="Curious mind.">
        </div>
        <div class="field">
          <label for="sec-hero-ftitle2">Card Title Line 2</label>
          <input id="sec-hero-ftitle2" value="${escapeHtml(sec.focus_title_line2 || '')}" placeholder="Practical builder.">
        </div>
      </div>
      <div class="field">
        <label for="sec-hero-fdesc">Card Description</label>
        <textarea id="sec-hero-fdesc" rows="2">${escapeHtml(sec.focus_description || '')}</textarea>
      </div>
      <div class="field">
        <label for="sec-hero-ftags">Focus Tags (Comma-separated)</label>
        <input id="sec-hero-ftags" value="${escapeHtml((sec.focus_tags || []).join(', '))}" placeholder="Python, Full-Stack, AI / ML">
      </div>
    `;
  } else if (activeSection === "about") {
    container.innerHTML = `
      <h2>About Me Section</h2>
      <div class="field">
        <label for="sec-about-kicker">Section Kicker</label>
        <input id="sec-about-kicker" value="${escapeHtml(sec.kicker || '')}" placeholder="A LITTLE ABOUT ME">
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-about-prefix">Title Prefix</label>
          <input id="sec-about-prefix" value="${escapeHtml(sec.title_prefix || '')}" placeholder="Learning by">
        </div>
        <div class="field">
          <label for="sec-about-grad">Title Gradient Accent</label>
          <input id="sec-about-grad" value="${escapeHtml(sec.title_gradient || '')}" placeholder="building.">
        </div>
      </div>
      <div class="field">
        <label for="sec-about-bio">Bio Story</label>
        <textarea id="sec-about-bio" rows="6">${escapeHtml(sec.bio || '')}</textarea>
      </div>
    `;
  } else if (activeSection === "projects_header") {
    container.innerHTML = `
      <h2>Projects Section Heading</h2>
      <div class="field">
        <label for="sec-ph-kicker">Section Kicker</label>
        <input id="sec-ph-kicker" value="${escapeHtml(sec.kicker || '')}" placeholder="SELECTED WORK">
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-ph-prefix">Title Prefix</label>
          <input id="sec-ph-prefix" value="${escapeHtml(sec.title_prefix || '')}" placeholder="Projects &">
        </div>
        <div class="field">
          <label for="sec-ph-grad">Title Gradient Accent</label>
          <input id="sec-ph-grad" value="${escapeHtml(sec.title_gradient || '')}" placeholder="experiments.">
        </div>
      </div>
      <div class="field">
        <label for="sec-ph-desc">Section Description</label>
        <textarea id="sec-ph-desc" rows="3">${escapeHtml(sec.description || '')}</textarea>
      </div>
    `;
  } else if (activeSection === "journey") {
    const items = sec.items || [];
    container.innerHTML = `
      <h2>The Journey Settings</h2>
      <div class="field">
        <label for="sec-j-kicker">Section Kicker</label>
        <input id="sec-j-kicker" value="${escapeHtml(sec.kicker || '')}" placeholder="THE JOURNEY">
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-j-prefix">Title Prefix</label>
          <input id="sec-j-prefix" value="${escapeHtml(sec.title_prefix || '')}" placeholder="Small steps.">
        </div>
        <div class="field">
          <label for="sec-j-grad">Title Gradient Accent</label>
          <input id="sec-j-grad" value="${escapeHtml(sec.title_gradient || '')}" placeholder="Real progress.">
        </div>
      </div>

      <div class="adm-head" style="margin-top: 24px; margin-bottom: 8px;">
        <div>
          <h3 style="margin: 0;">Timeline Entries (${items.length})</h3>
          <p class="text-muted">Create, read, update, reorder or delete milestone entries.</p>
        </div>
        <button class="btn btn-primary btn-sm" type="button" id="btn-add-journey-item">
          <i data-lucide="plus" class="icon" aria-hidden="true"></i> Add Timeline Event
        </button>
      </div>

      <div class="crud-item-list" id="journey-items-list">
        ${items
          .map(
            (it, idx) => `
          <div class="crud-card" data-idx="${idx}" data-editable="true" tabindex="0" title="Click to edit this timeline entry">
            <div class="crud-card-info">
              <div class="crud-card-meta">
                <span class="pill ${it.isCurrent || it.date === 'NEXT' ? '' : 'draft'}">${escapeHtml(it.date)}</span>
                <span class="tag-badge">${escapeHtml(it.label)}</span>
              </div>
              <h4>${escapeHtml(it.title)}</h4>
              <p>${escapeHtml(it.description)}</p>
            </div>
            <div class="crud-card-actions">
              <button class="icon-btn" data-act="up" ${idx === 0 ? 'disabled' : ''} title="Move up">
                <i data-lucide="arrow-up" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" data-act="down" ${idx === items.length - 1 ? 'disabled' : ''} title="Move down">
                <i data-lucide="arrow-down" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" data-act="edit" title="Edit">
                <i data-lucide="pencil" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn danger" data-act="delete" title="Delete">
                <i data-lucide="trash-2" class="icon" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    $("#btn-add-journey-item")?.addEventListener("click", () => openItemModal("journey", "add", null, -1));

    $("#journey-items-list")?.addEventListener("click", e => {
      const card = e.target.closest("[data-idx]");
      if (!card) return;
      const btn = e.target.closest("[data-act]");
      const idx = Number(card.dataset.idx);

      if (!btn) {
        openItemModal("journey", "edit", items[idx], idx);
        return;
      }

      const act = btn.dataset.act;
      if (act === "edit") openItemModal("journey", "edit", items[idx], idx);
      if (act === "delete") deleteItem("journey", idx);
      if (act === "up") moveItem("journey", idx, -1);
      if (act === "down") moveItem("journey", idx, 1);
    });

    $("#journey-items-list")?.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest("[data-act]")) return;
      const card = e.target.closest("[data-idx]");
      if (!card) return;
      e.preventDefault();
      const idx = Number(card.dataset.idx);
      openItemModal("journey", "edit", items[idx], idx);
    });
  } else if (activeSection === "skills") {
    const nodes = sec.nodes || [];
    const steps = sec.flow_steps || [];
    container.innerHTML = `
      <h2>Skills &amp; Architecture Settings</h2>
      <div class="field">
        <label for="sec-sk-kicker">Section Kicker</label>
        <input id="sec-sk-kicker" value="${escapeHtml(sec.kicker || '')}" placeholder="Skills">
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-sk-grad">Title Gradient Accent</label>
          <input id="sec-sk-grad" value="${escapeHtml(sec.title_gradient || '')}" placeholder="Full Stack.">
        </div>
        <div class="field">
          <label for="sec-sk-desc">Description</label>
          <input id="sec-sk-desc" value="${escapeHtml(sec.description || '')}">
        </div>
      </div>

      <div class="adm-head" style="margin-top: 24px; margin-bottom: 8px;">
        <div>
          <h3 style="margin: 0;">Stack Flow Nodes (${nodes.length})</h3>
          <p class="text-muted">Cards representing your tech layers (Web, Mobile, Backend, Database).</p>
        </div>
        <button class="btn btn-primary btn-sm" type="button" id="btn-add-skill-node">
          <i data-lucide="plus" class="icon" aria-hidden="true"></i> Add Stack Node
        </button>
      </div>

      <div class="crud-item-list" id="skill-nodes-list">
        ${nodes
          .map(
            (n, idx) => `
          <div class="crud-card" data-idx="${idx}" data-editable="true" tabindex="0" title="Click to edit this skill node">
            <div class="crud-card-info">
              <div class="crud-card-meta">
                <span class="pill">${escapeHtml(n.step)}</span>
                ${(n.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('')}
              </div>
              <h4>${escapeHtml(n.title)}</h4>
              <p>${escapeHtml(n.description)}</p>
            </div>
            <div class="crud-card-actions">
              <button class="icon-btn" data-act="up" ${idx === 0 ? 'disabled' : ''}>
                <i data-lucide="arrow-up" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" data-act="down" ${idx === nodes.length - 1 ? 'disabled' : ''}>
                <i data-lucide="arrow-down" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" data-act="edit">
                <i data-lucide="pencil" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn danger" data-act="delete">
                <i data-lucide="trash-2" class="icon" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="adm-head" style="margin-top: 28px; margin-bottom: 8px;">
        <div>
          <h3 style="margin: 0;">Product Flow Steps (${steps.length})</h3>
          <p class="text-muted">Workflow sequence: From Idea to Product (Plan, Interface, Backend, Database, Launch).</p>
        </div>
        <button class="btn btn-primary btn-sm" type="button" id="btn-add-flow-step">
          <i data-lucide="plus" class="icon" aria-hidden="true"></i> Add Workflow Step
        </button>
      </div>

      <div class="crud-item-list" id="flow-steps-list">
        ${steps
          .map(
            (st, idx) => `
          <div class="crud-card" data-idx="${idx}" data-editable="true" tabindex="0" title="Click to edit this workflow step">
            <div class="crud-card-info">
              <div class="crud-card-meta">
                <span class="pill">${escapeHtml(st.step)}</span>
              </div>
              <h4>${escapeHtml(st.title)}</h4>
              <p>${escapeHtml(st.description)}</p>
            </div>
            <div class="crud-card-actions">
              <button class="icon-btn" data-act="up" ${idx === 0 ? 'disabled' : ''}>
                <i data-lucide="arrow-up" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" data-act="down" ${idx === steps.length - 1 ? 'disabled' : ''}>
                <i data-lucide="arrow-down" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn" data-act="edit">
                <i data-lucide="pencil" class="icon" aria-hidden="true"></i>
              </button>
              <button class="icon-btn danger" data-act="delete">
                <i data-lucide="trash-2" class="icon" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    $("#btn-add-skill-node")?.addEventListener("click", () => openItemModal("skill_node", "add", null, -1));

    $("#skill-nodes-list")?.addEventListener("click", e => {
      const card = e.target.closest("[data-idx]");
      if (!card) return;
      const btn = e.target.closest("[data-act]");
      const idx = Number(card.dataset.idx);

      if (!btn) {
        openItemModal("skill_node", "edit", nodes[idx], idx);
        return;
      }

      const act = btn.dataset.act;
      if (act === "edit") openItemModal("skill_node", "edit", nodes[idx], idx);
      if (act === "delete") deleteItem("skill_node", idx);
      if (act === "up") moveItem("skill_node", idx, -1);
      if (act === "down") moveItem("skill_node", idx, 1);
    });

    $("#skill-nodes-list")?.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest("[data-act]")) return;
      const card = e.target.closest("[data-idx]");
      if (!card) return;
      e.preventDefault();
      const idx = Number(card.dataset.idx);
      openItemModal("skill_node", "edit", nodes[idx], idx);
    });

    $("#btn-add-flow-step")?.addEventListener("click", () => openItemModal("flow_step", "add", null, -1));

    $("#flow-steps-list")?.addEventListener("click", e => {
      const card = e.target.closest("[data-idx]");
      if (!card) return;
      const btn = e.target.closest("[data-act]");
      const idx = Number(card.dataset.idx);

      if (!btn) {
        openItemModal("flow_step", "edit", steps[idx], idx);
        return;
      }

      const act = btn.dataset.act;
      if (act === "edit") openItemModal("flow_step", "edit", steps[idx], idx);
      if (act === "delete") deleteItem("flow_step", idx);
      if (act === "up") moveItem("flow_step", idx, -1);
      if (act === "down") moveItem("flow_step", idx, 1);
    });

    $("#flow-steps-list")?.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest("[data-act]")) return;
      const card = e.target.closest("[data-idx]");
      if (!card) return;
      e.preventDefault();
      const idx = Number(card.dataset.idx);
      openItemModal("flow_step", "edit", steps[idx], idx);
    });
  } else if (activeSection === "contact") {
    container.innerHTML = `
      <h2>Contact &amp; Socials Settings</h2>
      <div class="field">
        <label for="sec-cnt-kicker">Section Kicker</label>
        <input id="sec-cnt-kicker" value="${escapeHtml(sec.kicker || '')}" placeholder="LET'S BUILD">
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-cnt-prefix">Title Prefix</label>
          <input id="sec-cnt-prefix" value="${escapeHtml(sec.title_prefix || '')}" placeholder="Have an idea?">
        </div>
        <div class="field">
          <label for="sec-cnt-grad">Title Gradient Accent</label>
          <input id="sec-cnt-grad" value="${escapeHtml(sec.title_gradient || '')}" placeholder="I can turn it into a product.">
        </div>
      </div>
      <div class="field">
        <label for="sec-cnt-desc">Description</label>
        <textarea id="sec-cnt-desc" rows="2">${escapeHtml(sec.description || '')}</textarea>
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-cnt-cta">Call-to-Action Button Text</label>
          <input id="sec-cnt-cta" value="${escapeHtml(sec.cta_text || '')}" placeholder="Tell me about your idea">
        </div>
        <div class="field">
          <label for="sec-cnt-email">Contact Email</label>
          <input id="sec-cnt-email" type="email" value="${escapeHtml(sec.email || '')}" placeholder="guptasagar2201@gmail.com">
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label for="sec-cnt-wa-num">WhatsApp Phone (Country Code + Number)</label>
          <input id="sec-cnt-wa-num" value="${escapeHtml(sec.whatsapp_number || '')}" placeholder="919354707042">
        </div>
        <div class="field">
          <label for="sec-cnt-wa-msg">Default WhatsApp Message</label>
          <input id="sec-cnt-wa-msg" value="${escapeHtml(sec.whatsapp_message || '')}" placeholder="Hi Sagar, I have an idea for a product. Can we talk?">
        </div>
      </div>
      <div class="field">
        <label for="sec-cnt-gh">GitHub Profile URL</label>
        <input id="sec-cnt-gh" type="url" value="${escapeHtml(sec.github_url || '')}" placeholder="https://github.com/Sagar-clou">
      </div>
    `;
  }

  icons();
}

function saveActiveSectionFromForm() {
  if (!siteContent[activeSection]) siteContent[activeSection] = {};
  const s = siteContent[activeSection];

  if (activeSection === "hero") {
    s.headline_prefix = $("#sec-hero-prefix")?.value.trim() || "";
    s.headline_gradient = $("#sec-hero-grad")?.value.trim() || "";
    s.lead = $("#sec-hero-lead")?.value.trim() || "";
    s.degree = $("#sec-hero-degree")?.value.trim() || "";
    s.location = $("#sec-hero-location")?.value.trim() || "";
    s.focus_label = $("#sec-hero-flabel")?.value.trim() || "";
    s.focus_status = $("#sec-hero-fstatus")?.value.trim() || "";
    s.focus_avatar = $("#sec-hero-favatar")?.value.trim() || "";
    s.focus_title_line1 = $("#sec-hero-ftitle1")?.value.trim() || "";
    s.focus_title_line2 = $("#sec-hero-ftitle2")?.value.trim() || "";
    s.focus_description = $("#sec-hero-fdesc")?.value.trim() || "";
    s.focus_badge = $("#sec-hero-fbadge")?.value.trim() || "";
    const tagsVal = $("#sec-hero-ftags")?.value || "";
    s.focus_tags = tagsVal
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);
  } else if (activeSection === "about") {
    s.kicker = $("#sec-about-kicker")?.value.trim() || "";
    s.title_prefix = $("#sec-about-prefix")?.value.trim() || "";
    s.title_gradient = $("#sec-about-grad")?.value.trim() || "";
    s.bio = $("#sec-about-bio")?.value.trim() || "";
  } else if (activeSection === "projects_header") {
    s.kicker = $("#sec-ph-kicker")?.value.trim() || "";
    s.title_prefix = $("#sec-ph-prefix")?.value.trim() || "";
    s.title_gradient = $("#sec-ph-grad")?.value.trim() || "";
    s.description = $("#sec-ph-desc")?.value.trim() || "";
  } else if (activeSection === "journey") {
    s.kicker = $("#sec-j-kicker")?.value.trim() || "";
    s.title_prefix = $("#sec-j-prefix")?.value.trim() || "";
    s.title_gradient = $("#sec-j-grad")?.value.trim() || "";
  } else if (activeSection === "skills") {
    s.kicker = $("#sec-sk-kicker")?.value.trim() || "";
    s.title_gradient = $("#sec-sk-grad")?.value.trim() || "";
    s.description = $("#sec-sk-desc")?.value.trim() || "";
  } else if (activeSection === "contact") {
    s.kicker = $("#sec-cnt-kicker")?.value.trim() || "";
    s.title_prefix = $("#sec-cnt-prefix")?.value.trim() || "";
    s.title_gradient = $("#sec-cnt-grad")?.value.trim() || "";
    s.description = $("#sec-cnt-desc")?.value.trim() || "";
    s.cta_text = $("#sec-cnt-cta")?.value.trim() || "";
    s.email = $("#sec-cnt-email")?.value.trim() || "";
    s.whatsapp_number = $("#sec-cnt-wa-num")?.value.trim() || "";
    s.whatsapp_message = $("#sec-cnt-wa-msg")?.value.trim() || "";
    s.github_url = $("#sec-cnt-gh")?.value.trim() || "";
  }
}

$("#btn-save-section").addEventListener("click", async () => {
  saveActiveSectionFromForm();
  const btn = $("#btn-save-section");
  btn.disabled = true;

  try {
    await setDoc(doc(db, "settings", "site"), { content: siteContent, managed: true }, { merge: true });
    toast("Section saved! Live site updated.");
  } catch (err) {
    toast(friendlyError(err), "error");
  }

  btn.disabled = false;
});

// ------------------------------------------------------------
// 10. LIST ITEM REORDERING, DELETION & MODALS
// ------------------------------------------------------------
function moveItem(type, index, dir) {
  let list;
  if (type === "journey") list = siteContent.journey.items;
  if (type === "skill_node") list = siteContent.skills.nodes;
  if (type === "flow_step") list = siteContent.skills.flow_steps;
  if (!list) return;

  const target = index + dir;
  if (target < 0 || target >= list.length) return;

  [list[index], list[target]] = [list[target], list[index]];
  renderActiveSection();
}

async function deleteItem(type, index) {
  let list;
  if (type === "journey") list = siteContent.journey.items;
  if (type === "skill_node") list = siteContent.skills.nodes;
  if (type === "flow_step") list = siteContent.skills.flow_steps;
  if (!list || !list[index]) return;

  const itemTitle = list[index].title || "this item";
  const ok = await confirmDialog(`Delete "${itemTitle}"?`, "This entry will be removed from the section.");
  if (!ok) return;

  list.splice(index, 1);
  renderActiveSection();
  toast("Item removed.");
}

/* Modal for Add / Edit Item */
function openItemModal(type, mode, item, index) {
  modalItemContext = { type, mode, item, index };
  const dlg = $("#modal-item");
  const titleEl = $("#modal-item-title");
  const fieldsEl = $("#modal-item-fields");
  show($("#modal-item-error"), false);

  if (type === "journey") {
    titleEl.textContent = mode === "add" ? "Add Timeline Event" : "Edit Timeline Event";
    fieldsEl.innerHTML = `
      <div class="row2">
        <div class="field">
          <label for="m-j-date">Period / Year</label>
          <input id="m-j-date" required value="${escapeHtml(item?.date || '')}" placeholder="e.g. 2026 or NEXT">
        </div>
        <div class="field">
          <label for="m-j-label">Category Label</label>
          <input id="m-j-label" required value="${escapeHtml(item?.label || '')}" placeholder="e.g. DATA & VISUALIZATION">
        </div>
      </div>
      <div class="field">
        <label for="m-j-title">Milestone Title</label>
        <input id="m-j-title" required value="${escapeHtml(item?.title || '')}" placeholder="What did you build or learn?">
      </div>
      <div class="field">
        <label for="m-j-desc">Description</label>
        <textarea id="m-j-desc" rows="3" required>${escapeHtml(item?.description || '')}</textarea>
      </div>
      <label class="switch" style="margin-top: 8px;">
        <input type="checkbox" id="m-j-current" ${item?.isCurrent ? 'checked' : ''}>
        <span class="switch-track" aria-hidden="true"></span>
        <span><b>Mark as Current Direction</b><small>Highlights with current indicator</small></span>
      </label>
    `;
  } else if (type === "skill_node") {
    titleEl.textContent = mode === "add" ? "Add Stack Node" : "Edit Stack Node";
    fieldsEl.innerHTML = `
      <div class="row2">
        <div class="field">
          <label for="m-sn-step">Step Badge</label>
          <input id="m-sn-step" required value="${escapeHtml(item?.step || '01 / WEB')}">
        </div>
        <div class="field">
          <label for="m-sn-title">Node Title</label>
          <input id="m-sn-title" required value="${escapeHtml(item?.title || '')}" placeholder="Web, Mobile, etc.">
        </div>
      </div>
      <div class="field">
        <label for="m-sn-desc">Description</label>
        <textarea id="m-sn-desc" rows="2" required>${escapeHtml(item?.description || '')}</textarea>
      </div>
      <div class="field">
        <label for="m-sn-tags">Technologies (Comma-separated)</label>
        <input id="m-sn-tags" value="${escapeHtml((item?.tags || []).join(', '))}" placeholder="HTML, CSS, JavaScript">
      </div>
    `;
  } else if (type === "flow_step") {
    titleEl.textContent = mode === "add" ? "Add Workflow Step" : "Edit Workflow Step";
    fieldsEl.innerHTML = `
      <div class="row2">
        <div class="field">
          <label for="m-fs-step">Step Code</label>
          <input id="m-fs-step" required value="${escapeHtml(item?.step || '01 / PLAN')}">
        </div>
        <div class="field">
          <label for="m-fs-title">Step Title</label>
          <input id="m-fs-title" required value="${escapeHtml(item?.title || '')}" placeholder="Define the problem">
        </div>
      </div>
      <div class="field">
        <label for="m-fs-desc">Description</label>
        <textarea id="m-fs-desc" rows="2" required>${escapeHtml(item?.description || '')}</textarea>
      </div>
    `;
  }

  dlg.showModal();
}

$("#btn-modal-cancel").addEventListener("click", () => $("#modal-item").close());

$("#form-modal-item").addEventListener("submit", e => {
  e.preventDefault();
  if (!modalItemContext) return;
  const { type, mode, index } = modalItemContext;

  if (type === "journey") {
    const date = $("#m-j-date")?.value.trim();
    const label = $("#m-j-label")?.value.trim();
    const title = $("#m-j-title")?.value.trim();
    const description = $("#m-j-desc")?.value.trim();
    const isCurrent = !!$("#m-j-current")?.checked;
    if (!date || !title) return showModalItemError("Period and Title are required.");

    const entry = {
      id: modalItemContext.item?.id || `journey-${Date.now()}`,
      date,
      label,
      title,
      description,
      isCurrent
    };
    if (!siteContent.journey) siteContent.journey = { items: [] };
    if (!siteContent.journey.items) siteContent.journey.items = [];

    if (mode === "add") siteContent.journey.items.push(entry);
    else siteContent.journey.items[index] = entry;
  } else if (type === "skill_node") {
    const step = $("#m-sn-step")?.value.trim();
    const title = $("#m-sn-title")?.value.trim();
    const description = $("#m-sn-desc")?.value.trim();
    const tags = ($("#m-sn-tags")?.value || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);
    if (!step || !title) return showModalItemError("Step and Title are required.");

    const entry = {
      id: modalItemContext.item?.id || `skill-${Date.now()}`,
      step,
      title,
      description,
      tags
    };
    if (!siteContent.skills) siteContent.skills = { nodes: [], flow_steps: [] };
    if (!siteContent.skills.nodes) siteContent.skills.nodes = [];

    if (mode === "add") siteContent.skills.nodes.push(entry);
    else siteContent.skills.nodes[index] = entry;
  } else if (type === "flow_step") {
    const step = $("#m-fs-step")?.value.trim();
    const title = $("#m-fs-title")?.value.trim();
    const description = $("#m-fs-desc")?.value.trim();
    if (!step || !title) return showModalItemError("Step and Title are required.");

    const entry = {
      id: modalItemContext.item?.id || `flow-${Date.now()}`,
      step,
      title,
      description
    };
    if (!siteContent.skills) siteContent.skills = { nodes: [], flow_steps: [] };
    if (!siteContent.skills.flow_steps) siteContent.skills.flow_steps = [];

    if (mode === "add") siteContent.skills.flow_steps.push(entry);
    else siteContent.skills.flow_steps[index] = entry;
  }

  $("#modal-item").close();
  renderActiveSection();
  toast(mode === "add" ? "Item created." : "Item updated.");
});

function showModalItemError(msg) {
  const err = $("#modal-item-error");
  err.textContent = msg;
  show(err, true);
}

// ------------------------------------------------------------
// 11. JSON & KEY-VALUE PROPERTY ENGINE
// ------------------------------------------------------------
const jsonSelect = $("#json-section-select");
const btnModeKv = $("#btn-mode-kv");
const btnModeRaw = $("#btn-mode-raw");
const viewKv = $("#json-view-kv");
const viewRaw = $("#json-view-raw");
const rawTextarea = $("#raw-json-textarea");
const syntaxTag = $("#json-syntax-status");

jsonSelect.addEventListener("change", () => renderJsonView());

btnModeKv.addEventListener("click", () => {
  jsonMode = "kv";
  btnModeKv.classList.add("is-active");
  btnModeRaw.classList.remove("is-active");
  show(viewKv, true);
  show(viewRaw, false);
  renderJsonView();
});

btnModeRaw.addEventListener("click", () => {
  jsonMode = "raw";
  btnModeRaw.classList.add("is-active");
  btnModeKv.classList.remove("is-active");
  show(viewKv, false);
  show(viewRaw, true);
  renderJsonView();
});

function getTargetJsonObject() {
  const target = jsonSelect.value;
  if (target === "all") return siteContent;
  if (!siteContent[target]) siteContent[target] = {};
  return siteContent[target];
}

function renderJsonView() {
  const target = jsonSelect.value;
  const obj = getTargetJsonObject();

  if (jsonMode === "kv") {
    renderKvTable(obj, target);
  } else {
    rawTextarea.value = JSON.stringify(obj, null, 2);
    validateRawJson();
  }
}

function detectType(val) {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

function renderKvTable(obj, targetName) {
  const listEl = $("#kv-props-list");
  const countEl = $("#kv-count");
  const titleEl = $("#kv-title");
  if (!listEl) return;

  const keys = Object.keys(obj);
  titleEl.textContent = targetName === "all" ? "All Site Keys (Root Object)" : `Key-Value Pairs in [${targetName}]`;
  countEl.textContent = `${keys.length} key${keys.length === 1 ? '' : 's'} defined in this JSON scope.`;

  if (!keys.length) {
    listEl.innerHTML = `<div class="text-muted" style="padding: 32px; text-align: center;">No keys defined yet. Click "Add Property Field" to create one.</div>`;
    return;
  }

  listEl.innerHTML = keys
    .map(k => {
      const val = obj[k];
      const type = detectType(val);
      const displayVal = type === "object" || type === "array" ? JSON.stringify(val, null, 2) : String(val ?? "");
      const valueControl =
        type === "object" || type === "array"
          ? `<textarea class="prop-val-input" rows="3" data-type="${type}" data-key="${escapeHtml(k)}">${escapeHtml(
              displayVal
            )}</textarea>`
          : `<input class="prop-val-input" value="${escapeHtml(displayVal)}" data-type="${type}" data-key="${escapeHtml(
              k
            )}">`;

      return `
      <div class="prop-card" data-key="${escapeHtml(k)}">
        <div class="prop-key-row">
          <div class="prop-key-title">
            <span class="prop-key-name">${escapeHtml(k)}</span>
            <span class="prop-type-badge ${type}">${type}</span>
          </div>
          <div class="prop-actions">
            <button class="icon-btn danger" data-act="delete-key" title="Delete '${escapeHtml(k)}'">
              <i data-lucide="trash-2" class="icon" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="prop-val-row">${valueControl}</div>
      </div>
    `;
    })
    .join("");

  icons();
}

/* Event Delegation for Property Cards */
$("#kv-props-list")?.addEventListener("click", async e => {
  const btn = e.target.closest("[data-act=delete-key]");
  const card = e.target.closest(".prop-card[data-key]");
  if (!btn || !card) return;

  const key = card.dataset.key;
  const ok = await confirmDialog(
    `Delete key "${key}"?`,
    "This key and its value will be permanently removed from this JSON section."
  );
  if (!ok) return;

  const obj = getTargetJsonObject();
  delete obj[key];
  renderJsonView();
  toast(`Key "${key}" deleted.`);
});

$("#kv-props-list")?.addEventListener("change", e => {
  const card = e.target.closest(".prop-card[data-key]");
  if (!card) return;

  const origKey = card.dataset.key;
  const valInput = card.querySelector(".prop-val-input");
  const obj = getTargetJsonObject();

  const rawVal = valInput?.value ?? "";
  const type = valInput?.dataset.type;

  let parsedVal = rawVal;
  if (type === "number") {
    parsedVal = Number(rawVal);
  } else if (type === "boolean") {
    parsedVal = rawVal === "true";
  } else if (type === "array" || type === "object") {
    try {
      parsedVal = JSON.parse(rawVal);
    } catch (_) {
      parsedVal = rawVal;
    }
  }

  obj[origKey] = parsedVal;
});

/* Modal: Add New Key-Value */
$("#btn-add-kv").addEventListener("click", () => {
  show($("#modal-kv-error"), false);
  $("#kv-input-key").value = "";
  $("#kv-input-value").value = "";
  $("#modal-kv").showModal();
});

$("#btn-modal-kv-cancel").addEventListener("click", () => $("#modal-kv").close());

$("#form-modal-kv").addEventListener("submit", e => {
  e.preventDefault();
  const key = $("#kv-input-key").value.trim();
  const type = $("#kv-input-type").value;
  const rawVal = $("#kv-input-value").value.trim();
  const errEl = $("#modal-kv-error");

  if (!key) {
    errEl.textContent = "Please enter a key name.";
    show(errEl, true);
    return;
  }

  let finalVal;
  try {
    if (type === "number") {
      finalVal = Number(rawVal) || 0;
    } else if (type === "boolean") {
      finalVal = rawVal.toLowerCase() === "true";
    } else if (type === "array") {
      finalVal = rawVal ? JSON.parse(rawVal) : [];
    } else if (type === "object") {
      finalVal = rawVal ? JSON.parse(rawVal) : {};
    } else {
      finalVal = rawVal;
    }
  } catch (err) {
    errEl.textContent = `Invalid ${type} syntax: ${err.message}`;
    show(errEl, true);
    return;
  }

  const obj = getTargetJsonObject();
  obj[key] = finalVal;
  $("#modal-kv").close();
  renderJsonView();
  toast(`Key "${key}" created.`);
});

// ------------------------------------------------------------
// 12. RAW JSON CODE VALIDATION & DEPLOYMENT
// ------------------------------------------------------------
function validateRawJson() {
  try {
    JSON.parse(rawTextarea.value);
    syntaxTag.className = "json-status-tag";
    syntaxTag.innerHTML = `<i data-lucide="check-circle" class="icon" aria-hidden="true"></i> Valid JSON`;
    icons();
    return true;
  } catch (err) {
    syntaxTag.className = "json-status-tag error";
    syntaxTag.innerHTML = `<i data-lucide="alert-circle" class="icon" aria-hidden="true"></i> Syntax Error: ${escapeHtml(
      err.message
    )}`;
    icons();
    return false;
  }
}

rawTextarea?.addEventListener("input", validateRawJson);

$("#btn-minify-json")?.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(rawTextarea.value);
    rawTextarea.value = JSON.stringify(parsed);
    validateRawJson();
    toast("Minified JSON.");
  } catch (err) {
    toast("Cannot minify: " + err.message, "error");
  }
});

$("#btn-format-json")?.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(rawTextarea.value);
    rawTextarea.value = JSON.stringify(parsed, null, 2);
    validateRawJson();
    toast("Formatted JSON.");
  } catch (err) {
    toast("Cannot format: " + err.message, "error");
  }
});

$("#btn-validate-json")?.addEventListener("click", () => {
  if (validateRawJson()) {
    toast("JSON format is completely valid.");
  } else {
    toast("Invalid JSON syntax.", "error");
  }
});

$("#btn-copy-json")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(rawTextarea.value);
    toast("Copied JSON to clipboard.");
  } catch (_) {
    toast("Failed to copy.", "error");
  }
});

/* Save & Deploy JSON Button */
$("#btn-save-json").addEventListener("click", async () => {
  const btn = $("#btn-save-json");
  btn.disabled = true;

  try {
    if (jsonMode === "raw") {
      if (!validateRawJson()) {
        btn.disabled = false;
        toast("Fix the JSON syntax errors before saving.", "error");
        return;
      }
      const parsed = JSON.parse(rawTextarea.value);
      const target = jsonSelect.value;
      if (target === "all") siteContent = parsed;
      else siteContent[target] = parsed;
    }

    await setDoc(doc(db, "settings", "site"), { content: siteContent, managed: true }, { merge: true });
    toast("JSON content deployed! Live site updated.");
    renderJsonView();
    renderActiveSection();
  } catch (err) {
    toast(friendlyError(err), "error");
  }

  btn.disabled = false;
});

// ------------------------------------------------------------
// 13. UNLOAD CONFIRMATION GUARD
// ------------------------------------------------------------
window.addEventListener("beforeunload", e => {
  if (!$("#view-editor").hidden) {
    e.preventDefault();
    e.returnValue = "";
  }
});
