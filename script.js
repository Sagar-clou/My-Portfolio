const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const navBackdrop = document.querySelector('.nav-backdrop');
const setNavigationOpen = open => {
  if (!menuButton || !nav || !navBackdrop) return;

  nav.classList.toggle('open', open);
  nav.setAttribute('aria-hidden', String(!open && window.innerWidth <= 768));
  navBackdrop.classList.toggle('open', open);
  nav.closest('.topbar')?.classList.toggle('drawer-active', open);
  document.body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuButton.textContent = open ? '×' : '☰';
};
const closeNavigation = () => {
  setNavigationOpen(false);
};
if (menuButton && nav && navBackdrop) {
  closeNavigation();
  menuButton.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    setNavigationOpen(open);
    if (open) {
      nav.querySelector('a')?.focus();
    }
  });
  navBackdrop.addEventListener('click', closeNavigation);
}
document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => {
  closeNavigation();
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    closeNavigation();
    menuButton?.focus();
  }
});
window.addEventListener('resize', closeNavigation);

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

const chatToggle = document.querySelector('.chat-toggle');
const chatPanel = document.querySelector('#chat-panel');
const chatClose = document.querySelector('.chat-close');
const chatMessages = document.querySelector('#chat-messages');
const chatForm = document.querySelector('.chat-form');
const chatInput = document.querySelector('#chat-input');

if (chatToggle && chatPanel && chatClose && chatMessages && chatForm && chatInput) {
  const setChatOpen = open => {
    chatPanel.classList.toggle('open', open);
    chatPanel.setAttribute('aria-hidden', String(!open));
    chatToggle.setAttribute('aria-expanded', String(open));
    chatToggle.setAttribute('aria-label', open ? 'Close portfolio assistant' : 'Open portfolio assistant');
    if (open) chatInput.focus();
  };

  const addMessage = (text, sender, link) => {
    const message = document.createElement('div');
    message.className = `chat-message chat-message-${sender}`;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    message.append(paragraph);
    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.className = 'chat-link';
      anchor.textContent = link.label;
      message.append(anchor);
    }
    chatMessages.append(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const getAnswer = question => {
    const text = question.toLowerCase();
    if (/\b(project|work|built|portfolio|prototype)s?\b/.test(text)) {
      return {
        text: 'Sagar’s portfolio includes an e-learning platform, a family-tree visualization, and concepts for smart food-waste management and satellite-based alerts.',
        link: { href: '#projects', label: 'Explore the projects' }
      };
    }
    if (/\b(skill|technolog|tool|language|python|sql|html|css|javascript)\b/.test(text)) {
      return {
        text: 'Sagar is developing skills in Python, data structures and algorithms, HTML, CSS, JavaScript, MySQL/SQL, and machine-learning fundamentals.',
        link: { href: '#skills', label: 'See the toolkit' }
      };
    }
    if (/\b(contact|email|hire|reach|connect|whatsapp)\b/.test(text)) {
      return {
        text: 'You can reach Sagar by email or WhatsApp from the contact section.',
        link: { href: '#contact', label: 'Go to contact details' }
      };
    }
    if (/\b(about|who|sagar|student|study|college|degree|location|where)\b/.test(text)) {
      return {
        text: 'Sagar Gupta is a Computer Science Engineering student in Faridabad, India, interested in full-stack development and data science.',
        link: { href: '#about', label: 'Read more about Sagar' }
      };
    }
    if (/\b(hello|hi|hey)\b/.test(text)) {
      return { text: 'Hello! Ask me about Sagar’s projects, skills, background, or how to get in touch.' };
    }
    return {
      text: 'I can help with questions about Sagar’s background, skills, projects, or contact details. Try asking about one of those.'
    };
  };

  chatToggle.addEventListener('click', () => {
    setChatOpen(chatToggle.getAttribute('aria-expanded') !== 'true');
  });
  chatClose.addEventListener('click', () => {
    setChatOpen(false);
    chatToggle.focus();
  });
  chatForm.addEventListener('submit', event => {
    event.preventDefault();
    const question = chatInput.value.trim();
    if (!question) return;
    addMessage(question, 'user');
    const answer = getAnswer(question);
    addMessage(answer.text, 'assistant', answer.link);
    chatInput.value = '';
    chatInput.focus();
  });
  chatMessages.querySelectorAll('.chat-suggestions button').forEach(button => {
    button.addEventListener('click', () => {
      chatInput.value = button.textContent;
      chatForm.requestSubmit();
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && chatPanel.classList.contains('open')) {
      setChatOpen(false);
      chatToggle.focus();
    }
  });
}
