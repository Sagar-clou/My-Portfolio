import { db, isConfigured } from './firebase-init.js';

const escapeHtml = str => String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export function applySiteContent(content) {
  if (!content || typeof content !== 'object') return;

  // 1. Hero Section
  if (content.hero) {
    const h = content.hero;
    const heroH1 = document.querySelector('.hero-copy h1');
    if (heroH1) {
      const prefix = escapeHtml(h.headline_prefix || 'Have an idea?');
      const grad = escapeHtml(h.headline_gradient || "Let's make it useful product.");
      heroH1.innerHTML = `${prefix}<br><span class="gradient-text">${grad}</span>`;
    }

    const heroLead = document.querySelector('.hero-lead');
    if (heroLead && h.lead) {
      heroLead.innerHTML = escapeHtml(h.lead).replace(/Sagar Gupta/g, '<strong>Sagar Gupta</strong>');
    }

    const heroMeta = document.querySelector('.hero-meta');
    if (heroMeta && (h.degree || h.location)) {
      heroMeta.innerHTML = `
        <span><i data-lucide="graduation-cap" class="icon meta-icon" aria-hidden="true"></i> ${escapeHtml(h.degree || 'B.Tech · Computer Science')}</span>
        <span><i data-lucide="map-pin" class="icon meta-icon" aria-hidden="true"></i> ${escapeHtml(h.location || 'Faridabad, India')}</span>
      `;
    }

    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
      const tinyLabel = profileCard.querySelector('.tiny-label');
      if (tinyLabel && h.focus_label) tinyLabel.textContent = h.focus_label;

      const livePill = profileCard.querySelector('.live-pill');
      if (livePill && h.focus_status) livePill.innerHTML = `<span></span> ${escapeHtml(h.focus_status)}`;

      const avatarImg = profileCard.querySelector('.avatar img');
      if (avatarImg && h.focus_avatar) avatarImg.src = h.focus_avatar;

      const cardH2 = profileCard.querySelector('h2');
      if (cardH2 && (h.focus_title_line1 || h.focus_title_line2)) {
        cardH2.innerHTML = `${escapeHtml(h.focus_title_line1 || '')}<br><span>${escapeHtml(h.focus_title_line2 || '')}</span>`;
      }

      const cardP = profileCard.querySelector('p');
      if (cardP && h.focus_description) cardP.textContent = h.focus_description;

      const focusTags = profileCard.querySelector('.focus-tags');
      if (focusTags && Array.isArray(h.focus_tags)) {
        focusTags.innerHTML = h.focus_tags.map(t => `<span>${escapeHtml(t)}</span>`).join('');
      }

      const cardBottom = profileCard.querySelector('.card-bottom span');
      if (cardBottom && h.focus_badge) cardBottom.textContent = h.focus_badge;
    }
  }

  // 2. About Section
  if (content.about) {
    const a = content.about;
    const aboutSection = document.querySelector('.about-section');
    if (aboutSection) {
      const kicker = aboutSection.querySelector('.section-kicker');
      if (kicker && a.kicker) kicker.textContent = a.kicker;

      const h2 = aboutSection.querySelector('h2');
      if (h2) {
        const pref = escapeHtml(a.title_prefix || 'Learning by');
        const grad = escapeHtml(a.title_gradient || 'building.');
        h2.innerHTML = `${pref} <span class="gradient-text">${grad}</span>`;
      }

      const textEl = aboutSection.querySelector('.about-text');
      if (textEl && a.bio) {
        textEl.textContent = a.bio;
      }
    }
  }

  // 3. Projects Heading
  if (content.projects_header) {
    const ph = content.projects_header;
    const pSection = document.querySelector('.projects-section .section-heading');
    if (pSection) {
      const kicker = pSection.querySelector('.section-kicker');
      if (kicker && ph.kicker) kicker.textContent = ph.kicker;

      const h2 = pSection.querySelector('h2');
      if (h2) {
        const pref = escapeHtml(ph.title_prefix || 'Projects &');
        const grad = escapeHtml(ph.title_gradient || 'experiments.');
        h2.innerHTML = `${pref} <span class="gradient-text">${grad}</span>`;
      }

      const p = pSection.querySelector('p');
      if (p && ph.description) p.textContent = ph.description;
    }
  }

  // 4. Journey Timeline
  if (content.journey) {
    const j = content.journey;
    const jSection = document.querySelector('.journey-section');
    if (jSection) {
      const kicker = jSection.querySelector('.section-kicker');
      if (kicker && j.kicker) kicker.textContent = j.kicker;

      const h2 = jSection.querySelector('h2');
      if (h2) {
        const pref = escapeHtml(j.title_prefix || 'Small steps.');
        const grad = escapeHtml(j.title_gradient || 'Real progress.');
        h2.innerHTML = `${pref} <span class="gradient-text">${grad}</span>`;
      }

      const timelineEl = jSection.querySelector('.timeline');
      if (timelineEl && Array.isArray(j.items) && j.items.length) {
        timelineEl.innerHTML = j.items.map(item => `
          <div class="timeline-item${item.isCurrent || item.date === 'NEXT' ? ' timeline-current' : ''} visible">
            <div class="timeline-date">${escapeHtml(item.date)}</div>
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <span class="timeline-label">${escapeHtml(item.label)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // 5. Skills Section
  if (content.skills) {
    const s = content.skills;
    const sSection = document.querySelector('.skills-section');
    if (sSection) {
      const kicker = sSection.querySelector('.section-kicker');
      if (kicker && s.kicker) kicker.textContent = s.kicker;

      const titleHeading = sSection.querySelector('.section-heading:nth-of-type(2)');
      if (titleHeading) {
        const h2 = titleHeading.querySelector('h2');
        if (h2 && s.title_gradient) h2.innerHTML = `<span class="gradient-text">${escapeHtml(s.title_gradient)}</span>`;
        const p = titleHeading.querySelector('p');
        if (p && s.description) p.textContent = s.description;
      }

      // Stack Flow nodes
      const stackFlow = sSection.querySelector('.stack-flow');
      if (stackFlow && Array.isArray(s.nodes) && s.nodes.length >= 4) {
        const n1 = s.nodes[0] || {};
        const n2 = s.nodes[1] || {};
        const n3 = s.nodes[2] || {};
        const n4 = s.nodes[3] || {};

        const renderTags = tags => (tags || []).map(t => {
          if (typeof t === 'string' && t.toLowerCase().includes('learning')) {
            return `<span class="learning-tag">${escapeHtml(t)}</span>`;
          }
          return `<span>${escapeHtml(t)}</span>`;
        }).join('');

        stackFlow.innerHTML = `
          <div class="stack-clients">
            <article class="stack-node stack-client">
              <span class="stack-layer">${escapeHtml(n1.step || '01 / WEB')}</span>
              <h3>${escapeHtml(n1.title || 'Web')}</h3>
              <p>${escapeHtml(n1.description || '')}</p>
              <div class="stack-tags">${renderTags(n1.tags)}</div>
            </article>
            <article class="stack-node stack-client">
              <span class="stack-layer">${escapeHtml(n2.step || '02 / MOBILE')}</span>
              <h3>${escapeHtml(n2.title || 'Mobile')}</h3>
              <p>${escapeHtml(n2.description || '')}</p>
              <div class="stack-tags">${renderTags(n2.tags)}</div>
            </article>
          </div>
          <span class="stack-connector" aria-hidden="true"></span>
          <article class="stack-node stack-backend">
            <span class="stack-layer">${escapeHtml(n3.step || '03 / SERVER')}</span>
            <h3>${escapeHtml(n3.title || 'Backend')}</h3>
            <p>${escapeHtml(n3.description || '')}</p>
            <div class="stack-tags">${renderTags(n3.tags)}</div>
          </article>
          <span class="stack-connector" aria-hidden="true"></span>
          <article class="stack-node stack-database">
            <span class="stack-layer">${escapeHtml(n4.step || '04 / DATA')}</span>
            <h3>${escapeHtml(n4.title || 'Database')}</h3>
            <p>${escapeHtml(n4.description || '')}</p>
            <div class="stack-tags">${renderTags(n4.tags)}</div>
          </article>
        `;
      }

      // Product Flow steps
      const pFlow = sSection.querySelector('.product-flow');
      if (pFlow) {
        const pfHeading = pFlow.querySelector('.product-flow-heading');
        if (pfHeading) {
          const l = pfHeading.querySelector('.stack-layer');
          if (l && s.flow_kicker) l.textContent = s.flow_kicker;
          const h3 = pfHeading.querySelector('h3');
          if (h3 && s.flow_title) h3.textContent = s.flow_title;
          const p = pfHeading.querySelector('p');
          if (p && s.flow_description) p.textContent = s.flow_description;
        }

        const pfSteps = pFlow.querySelector('.product-flow-steps');
        if (pfSteps && Array.isArray(s.flow_steps) && s.flow_steps.length) {
          pfSteps.innerHTML = s.flow_steps.map((st, idx) => `
            ${idx > 0 ? '<span class="product-flow-connector" aria-hidden="true"></span>' : ''}
            <article class="product-flow-step">
              <span>${escapeHtml(st.step)}</span>
              <h4>${escapeHtml(st.title)}</h4>
              <p>${escapeHtml(st.description)}</p>
            </article>
          `).join('');
        }
      }
    }
  }

  // 6. Contact & Socials
  if (content.contact) {
    const c = content.contact;
    const cSection = document.querySelector('.contact-section');
    if (cSection) {
      const kicker = cSection.querySelector('.section-kicker');
      if (kicker && c.kicker) kicker.textContent = c.kicker;

      const h2 = cSection.querySelector('h2');
      if (h2) {
        const pref = escapeHtml(c.title_prefix || 'Have an idea?');
        const grad = escapeHtml(c.title_gradient || 'I can turn it into a product.');
        h2.innerHTML = `${pref}<br><span class="gradient-text">${grad}</span>`;
      }

      const p = cSection.querySelector('p');
      if (p && c.description) p.textContent = c.description;

      const waUrl = `https://wa.me/${encodeURIComponent(c.whatsapp_number || '919354707042')}?text=${encodeURIComponent(c.whatsapp_message || 'Hi Sagar, I have an idea for a product. Can we talk?')}`;

      const ctaBtn = cSection.querySelector('.contact-cta');
      if (ctaBtn) {
        ctaBtn.href = waUrl;
        if (c.cta_text) ctaBtn.innerHTML = `${escapeHtml(c.cta_text)} <i data-lucide="arrow-up-right" class="icon" aria-hidden="true"></i>`;
      }

      const waBtn = cSection.querySelector('.contact-whatsapp');
      if (waBtn) waBtn.href = waUrl;

      // Social FABs
      const fabWa = document.querySelector('.social-link-whatsapp');
      if (fabWa) fabWa.href = waUrl;

      const email = c.email || 'guptasagar2201@gmail.com';
      const fabEmail = document.querySelector('.social-link-email');
      if (fabEmail) fabEmail.href = `mailto:${encodeURIComponent(email)}`;

      const footerEmail = document.querySelector('.footer-email');
      if (footerEmail) {
        footerEmail.href = `mailto:${encodeURIComponent(email)}`;
        footerEmail.textContent = email;
      }

      const ghUrl = c.github_url || 'https://github.com/Sagar-clou';
      const fabGh = document.querySelector('.social-link-github');
      if (fabGh) fabGh.href = ghUrl;
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

// Automatically subscribe to Firestore settings/site document
async function initLiveContent() {
  if (!isConfigured || !db) return;
  try {
    const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    onSnapshot(doc(db, 'settings', 'site'), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.content) {
          applySiteContent(data.content);
        }
      }
    }, err => {
      console.warn('Live content sync:', err?.message || err);
    });
  } catch (err) {
    console.warn('Could not initialize live content sync:', err);
  }
}

initLiveContent();
/* ============================================================
   FILE: portfolio-content.js
   ROLE: Loads editable public site sections from Firestore; updates sections in index.html.
   ============================================================ */
