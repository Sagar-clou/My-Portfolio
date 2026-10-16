const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const navBackdrop = document.querySelector('.nav-backdrop');
const closeNavigation = () => {
  nav?.classList.remove('open');
  nav?.setAttribute('aria-hidden', 'true');
  navBackdrop?.classList.remove('open');
  nav?.closest('.topbar')?.classList.remove('drawer-active');
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
  if (menuButton) menuButton.textContent = '☰';
};
menuButton?.addEventListener('click', () => {
  const open = !nav.classList.contains('open');
  if (open) {
    nav.classList.add('open');
    nav.setAttribute('aria-hidden', 'false');
    navBackdrop?.classList.add('open');
    nav.closest('.topbar')?.classList.add('drawer-active');
    document.body.classList.add('menu-open');
    menuButton.setAttribute('aria-label', 'Close navigation');
    menuButton.textContent = '×';
    nav.querySelector('a')?.focus();
  } else {
    closeNavigation();
  }
  menuButton.setAttribute('aria-expanded', String(open));
});
navBackdrop?.addEventListener('click', closeNavigation);
document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => {
  closeNavigation();
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    closeNavigation();
    menuButton?.focus();
  }
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.project-card');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  cards.forEach(card => {
    const categories = (card.dataset.category || '').split(' ');
    card.classList.toggle('hidden', filter !== 'all' && !categories.includes(filter));
  });
}));

const projectDialog = document.querySelector('#project-dialog');
if (projectDialog) {
  const projectDialogVisual = projectDialog.querySelector('.project-dialog-visual');
  document.querySelectorAll('.project-details-button').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.project-card');
      const visual = card.querySelector('.project-visual');
      const meta = card.querySelector('.project-meta');
      projectDialogVisual.replaceChildren(visual.cloneNode(true));
      projectDialog.querySelector('.project-dialog-status').textContent = meta.querySelector('span').textContent;
      projectDialog.querySelector('.project-dialog-type').textContent = meta.querySelector('.project-type').textContent;
      projectDialog.querySelector('#project-dialog-title').textContent = card.querySelector('h3').textContent;
      projectDialog.querySelector('.project-dialog-description').textContent = card.dataset.details;
      projectDialog.querySelector('.project-dialog-tags').replaceChildren(
        ...Array.from(card.querySelectorAll('.tag-row span'), tag => tag.cloneNode(true))
      );
      projectDialog.showModal();
    });
  });

  projectDialog.querySelector('.project-dialog-close').addEventListener('click', () => projectDialog.close());
  projectDialog.addEventListener('click', event => {
    if (event.target === projectDialog) projectDialog.close();
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
