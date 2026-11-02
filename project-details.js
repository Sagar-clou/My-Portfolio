/* ============================================================
   FILE: project-details.js
   ROLE: Loads and renders one project detail; connects project.html to
         the shared seed project data and markdown renderer.
   ============================================================ */

import { seedProjects } from './seed-projects.js';
import { renderMarkdown } from './markdown.js';

const projects = Object.fromEntries(seedProjects.map(project => [project.id, project]));
const detail = document.querySelector('#project-detail-content');
const notFound = document.querySelector('#project-not-found');

function renderProject(project) {
  if (project) {
    document.title = `${project.title} — Sagar Gupta`;
    const image = document.querySelector('#project-image');
    image.src = project.image || '';
    image.alt = project.imageAlt || project.title;
    image.hidden = !project.image;

    for (const [id, url] of [['project-repo', project.repository], ['project-source', project.source]]) {
      const link = document.querySelector(`#${id}`);
      link.href = url || '#';
      link.hidden = !url;
    }

    document.querySelector('#project-readme').innerHTML = renderMarkdown(project.readme || '');
    detail.hidden = false;
    notFound.hidden = true;
  } else {
    document.title = 'Project not found — Sagar Gupta';
    detail.hidden = true;
    notFound.hidden = false;
  }
}

const projectId = new URLSearchParams(window.location.search).get('project');
renderProject(projects[projectId]);

async function loadManagedProject() {
  try {
    const { db, isConfigured } = await import('./firebase-init.js');
    if (!isConfigured || !projectId) return;

    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    const settings = await getDoc(doc(db, 'settings', 'site'));
    if (!settings.exists() || settings.data().managed !== true) return;

    const snapshot = await getDoc(doc(db, 'projects', projectId));
    const project = snapshot.exists() && snapshot.data().published
      ? { id: snapshot.id, ...snapshot.data() }
      : null;
    renderProject(project);
  } catch (error) {
    console.error('Could not load the live project details from Firestore.', error);
  }
}

loadManagedProject();
if (window.lucide) window.lucide.createIcons();
