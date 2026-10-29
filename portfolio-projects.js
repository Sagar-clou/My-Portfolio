import { projectCardHTML } from './project-card.js';

const grid = document.querySelector('#projects .project-grid');
const status = document.querySelector('#projects-status');

async function loadManagedProjects() {
  try {
    const { db, isConfigured } = await import('./firebase-init.js');
    if (!isConfigured) return;

    const { collection, doc, getDoc, onSnapshot, query, where } =
      await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    const settings = await getDoc(doc(db, 'settings', 'site'));
    if (!settings.exists() || settings.data().managed !== true) return;

    const publishedProjects = query(
      collection(db, 'projects'),
      where('published', '==', true)
    );
    onSnapshot(publishedProjects, snapshot => {
      const projects = snapshot.docs
        .map(project => ({ id: project.id, ...project.data() }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      grid.innerHTML = projects.length
        ? projects.map(project => projectCardHTML(project)).join('')
        : '<p>No published projects yet.</p>';
      status.hidden = true;
      if (window.lucide) window.lucide.createIcons();
    }, error => {
      console.error('Could not watch published projects in Firestore.', error);
      status.textContent = 'Live projects could not be loaded. Showing the saved portfolio content.';
      status.hidden = false;
    });
  } catch (error) {
    console.error('Could not connect to Firestore projects.', error);
    status.textContent = 'Live projects could not be loaded. Showing the saved portfolio content.';
    status.hidden = false;
  }
}

loadManagedProjects();
/* ============================================================
   FILE: portfolio-projects.js
   ROLE: Loads project cards from Firestore; renders project content in index.html.
   ============================================================ */
