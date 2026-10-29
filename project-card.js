import { escapeHtml } from "./markdown.js";

// Only allow http(s) links, site-relative paths, and (for images) embedded data: images.
export const safeUrl = (value, { allowData = false } = {}) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (allowData && /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[\w%./~-][\w%./~ -]*$/.test(url) && !/^(javascript|data|vbscript):/i.test(url)) return url;
  return "";
};

export const projectHref = id => `project.html?project=${encodeURIComponent(id)}`;

const arrow = '<i data-lucide="arrow-up-right" class="icon" aria-hidden="true"></i>';

// Same markup as the hand-written cards that used to live in index.html.
export const projectCardHTML = (p, { link = true } = {}) => {
  const href = projectHref(p.id);
  const image = safeUrl(p.image, { allowData: true });
  const repo = safeUrl(p.repository);
  const source = safeUrl(p.source);
  const tags = (p.tags || []).map(t => `<span>${escapeHtml(t)}</span>`).join("");
  return `
<article class="project-card reveal visible">
  ${link ? `<a class="project-card-link" href="${escapeHtml(href)}" aria-label="Open ${escapeHtml(p.title)} details"></a>` : ""}
  <div class="project-visual">
    ${image ? `<img class="project-image" src="${escapeHtml(image)}" alt="${escapeHtml(p.imageAlt || p.title)}">` : ""}
    <span class="project-image-hint" aria-hidden="true">View project details ${arrow}</span>
  </div>
  <div class="project-info">
    <div class="project-meta"><span>${escapeHtml(p.meta || "")}</span>${p.type ? `<span class="project-type">${escapeHtml(p.type)}</span>` : ""}</div>
    <h3>${escapeHtml(p.title)}</h3>
    <p>${escapeHtml(p.summary || "")}</p>
    <div class="tag-row">${tags}</div>
    <div class="project-links">
      <a href="${escapeHtml(href)}">Project details ${arrow}</a>
      ${repo ? `<a href="${escapeHtml(repo)}" target="_blank" rel="noopener noreferrer">GitHub repo ${arrow}</a>` : ""}
      ${source ? `<a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">View code <i data-lucide="code-2" class="icon" aria-hidden="true"></i></a>` : ""}
    </div>
  </div>
</article>`;
};
/* ============================================================
   FILE: project-card.js
   ROLE: Reusable project-card markup and URL sanitization; used by portfolio-projects.js.
   ============================================================ */
