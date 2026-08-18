/**
 * Hartup Construction — Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initNavDropdowns();
  initHeaderScroll();
  initProjectFilter();
  initContactForm();
  initLightbox();
  initVideoModal();
  setActiveNavLink();
});

/* ---- Mobile Navigation ---- */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-mobile');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ---- Header scroll effect ---- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ---- Nav dropdown (mobile) ---- */
function initNavDropdowns() {
  document.querySelectorAll('.nav-dropdown-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = btn.closest('.nav-dropdown');
      const isOpen = dropdown?.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });
}

/* ---- Active nav link ---- */
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const newBuildPages = ['new-builds.html', 'one-bedroom.html', 'two-bedroom.html', 'three-bedroom.html'];
  const links = document.querySelectorAll('.nav-desktop a, .nav-mobile a, .nav-dropdown > a, .nav-dropdown-menu a');

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const isExactMatch = href === currentPage || (currentPage === '' && href === 'index.html');
    const isNewBuildSection = newBuildPages.includes(currentPage) &&
      (href === 'new-builds.html' || newBuildPages.includes(href));

    if (isExactMatch || isNewBuildSection) {
      link.classList.add('active');
    }
  });
}

/* ---- Project gallery filter ---- */
function initProjectFilter() {
  const tabs = document.querySelectorAll('.filter-tab');
  const projects = document.querySelectorAll('.project-card');

  if (!tabs.length || !projects.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;

      projects.forEach(project => {
        if (filter === 'all' || project.dataset.category === filter) {
          project.classList.remove('hidden-project');
        } else {
          project.classList.add('hidden-project');
        }
      });
    });
  });
}

/* ---- Contact form ---- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const successMsg = document.querySelector('.form-success');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (successMsg) {
      successMsg.classList.add('show');
      form.reset();

      setTimeout(() => {
        successMsg.classList.remove('show');
      }, 5000);
    }
  });
}

/* ---- Image lightbox ---- */
function initLightbox() {
  const lightbox = document.getElementById('image-lightbox');
  if (!lightbox) return;

  const image = lightbox.querySelector('.lightbox-image');
  const caption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const backdrop = lightbox.querySelector('.lightbox-backdrop');
  let lastFocused = null;

  function openLightbox(src, alt) {
    lastFocused = document.activeElement;
    image.src = src;
    image.alt = alt;
    caption.textContent = alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    image.src = '';
    image.alt = '';
    caption.textContent = '';
    document.body.style.overflow = '';
    lastFocused?.focus();
  }

  document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const src = trigger.dataset.lightboxSrc || trigger.querySelector('img')?.src;
      const alt = trigger.dataset.lightboxAlt || trigger.querySelector('img')?.alt || '';
      if (src) openLightbox(src, alt);
    });
  });

  closeBtn?.addEventListener('click', closeLightbox);
  backdrop?.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (lightbox.classList.contains('open') && e.key === 'Escape') closeLightbox();
  });
}

/* ---- Video modal ---- */
function initVideoModal() {
  const modal = document.getElementById('video-modal');
  if (!modal) return;

  const iframe = modal.querySelector('iframe');
  const closeBtn = modal.querySelector('.video-modal-close');
  const backdrop = modal.querySelector('.video-modal-backdrop');
  let lastFocused = null;

  function openVideo(url, title) {
    lastFocused = document.activeElement;
    const autoplayUrl = url.includes('autoplay') ? url : `${url}${url.includes('?') ? '&' : '?'}autoplay=1`;
    iframe.src = autoplayUrl;
    iframe.title = title;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeVideo() {
    modal.classList.remove('open');
    iframe.src = '';
    iframe.title = '';
    document.body.style.overflow = '';
    lastFocused?.focus();
  }

  document.querySelectorAll('.video-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const url = trigger.dataset.videoUrl;
      const title = trigger.dataset.videoTitle || 'Design video';
      if (url) openVideo(url, title);
    });
  });

  closeBtn?.addEventListener('click', closeVideo);
  backdrop?.addEventListener('click', closeVideo);
  document.addEventListener('keydown', e => {
    if (modal.classList.contains('open') && e.key === 'Escape') closeVideo();
  });
}
