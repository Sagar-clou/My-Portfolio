/* ============================================================
   FILE: script.js
   ROLE: Shared public-site interactions such as navigation,
         icons, chat, and social links; used by index.html and
         profile.html.
   ============================================================ */

// ------------------------------------------------------------
// 1. ICON INITIALIZATION
// ------------------------------------------------------------
if (window.lucide) {
  window.lucide.createIcons();
}

// ------------------------------------------------------------
// 2. MOBILE NAVIGATION DRAWER
// ------------------------------------------------------------
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const navBackdrop = document.querySelector('.nav-backdrop');

const setNavigationOpen = (open) => {
  if (!menuButton || !nav || !navBackdrop) return;

  nav.classList.toggle('open', open);
  nav.setAttribute('aria-hidden', String(!open && window.innerWidth <= 768));
  navBackdrop.classList.toggle('open', open);
  nav.closest('.topbar')?.classList.toggle('drawer-active', open);
  document.body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');

  const menuIcon = document.createElement('i');
  menuIcon.dataset.lucide = open ? 'x' : 'menu';
  menuIcon.className = 'icon';
  menuIcon.setAttribute('aria-hidden', 'true');
  menuButton.replaceChildren(menuIcon);

  if (window.lucide) {
    window.lucide.createIcons();
  }
};

if (menuButton && nav && navBackdrop) {
  setNavigationOpen(false);

  menuButton.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    setNavigationOpen(open);
    if (open) {
      nav.querySelector('a')?.focus();
    }
  });

  navBackdrop.addEventListener('click', () => setNavigationOpen(false));

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setNavigationOpen(false);
    });
  });

  window.addEventListener('resize', () => setNavigationOpen(false));
}

// ------------------------------------------------------------
// 3. SCROLL REVEAL ANIMATIONS
// ------------------------------------------------------------
const revealElements = document.querySelectorAll('.reveal');
if (revealElements.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((el) => revealObserver.observe(el));
}

// ------------------------------------------------------------
// 4. FLOATING SOCIAL LINKS (FABS) SCROLL BEHAVIOR
// ------------------------------------------------------------
const socialFabs = document.querySelector('.social-fabs');
if (socialFabs) {
  let previousScrollY = window.scrollY;

  window.addEventListener(
    'scroll',
    () => {
      const currentScrollY = window.scrollY;
      socialFabs.classList.toggle(
        'is-horizontal',
        currentScrollY > 0 && currentScrollY > previousScrollY
      );
      previousScrollY = currentScrollY;
    },
    { passive: true }
  );
}

// ------------------------------------------------------------
// 5. PORTFOLIO ASSISTANT CHAT WIDGET
// ------------------------------------------------------------
const chatToggle = document.querySelector('.chat-toggle');
const chatPanel = document.querySelector('#chat-panel');
const chatClose = document.querySelector('.chat-close');
const chatMessages = document.querySelector('#chat-messages');
const chatForm = document.querySelector('.chat-form');
const chatInput = document.querySelector('#chat-input');
let closeChat;

if (chatToggle && chatPanel && chatClose && chatMessages && chatForm && chatInput) {
  const setChatOpen = (open) => {
    chatPanel.classList.toggle('open', open);
    chatToggle.closest('.chat-widget').classList.toggle('chat-open', open);
    chatPanel.setAttribute('aria-hidden', String(!open));
    chatToggle.setAttribute('aria-expanded', String(open));
    chatToggle.setAttribute('aria-label', open ? 'Close portfolio assistant' : 'Open portfolio assistant');
    if (open) chatInput.focus();
  };

  closeChat = () => {
    setChatOpen(false);
    chatToggle.focus();
  };

  const addMessage = (text, sender, link) => {
    const message = document.createElement('div');
    message.className = 'chat-message chat-message-' + sender;

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

  const getAnswer = (question) => {
    const text = question.toLowerCase();

    if (/\b(project|work|built|portfolio|prototype)s?\b/.test(text)) {
      return {
        text: 'Sagar has public GitHub projects for a satellite fire-alert prototype, a C family-tree generator, a responsive chat UI demo, and an e-learning dashboard.',
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
      return {
        text: 'Hello! Ask me about Sagar’s projects, skills, background, or how to get in touch.'
      };
    }

    return {
      text: 'I can help with questions about Sagar’s background, skills, projects, or contact details. Try asking about one of those.'
    };
  };

  chatToggle.addEventListener('click', () => {
    setChatOpen(chatToggle.getAttribute('aria-expanded') !== 'true');
  });

  chatClose.addEventListener('click', closeChat);

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = chatInput.value.trim();
    if (!question) return;

    addMessage(question, 'user');
    const answer = getAnswer(question);
    addMessage(answer.text, 'assistant', answer.link);
    chatInput.value = '';
    chatInput.focus();
  });

  chatMessages.querySelectorAll('.chat-suggestions button').forEach((button) => {
    button.addEventListener('click', () => {
      chatInput.value = button.textContent;
      chatForm.requestSubmit();
    });
  });
}

// ------------------------------------------------------------
// 6. GLOBAL KEYBOARD ACCESSIBILITY (ESC TO CLOSE)
// ------------------------------------------------------------
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  if (nav?.classList.contains('open')) {
    setNavigationOpen(false);
    menuButton?.focus();
  }

  if (chatPanel?.classList.contains('open')) {
    closeChat?.();
  }
});
