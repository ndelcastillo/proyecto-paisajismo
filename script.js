document.addEventListener('DOMContentLoaded', () => {

  const navLinks = Array.from(document.querySelectorAll('.index__list a'));
  const scaleFill = document.getElementById('scaleFill');
  const sidebar = document.getElementById('sidebar');
  const navToggle = document.getElementById('navToggle');
  const moduleBtns = Array.from(document.querySelectorAll('[data-module-btn]'));
  const moduleContents = Array.from(document.querySelectorAll('[data-module-content]'));
  const indexLists = Array.from(document.querySelectorAll('.index__list'));
  const indexGroups = Array.from(document.querySelectorAll('[data-index-group]'));
  const activeModuleLabel = document.getElementById('activeModuleLabel');

  const moduleNames = {
    '1': 'Módulo I',
    '2': 'Módulo II',
    '3': 'Módulo III',
    '4': 'Módulo IV',
    '5': 'Módulo V',
    '6': 'Módulo VI',
    '7': 'Módulo VII',
    '8': 'Módulo VIII'
  };

  let observer = null;
  let currentModule = '1';

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scaleFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }

  function setupObserver() {
    if (observer) observer.disconnect();

    const activeContent = document.querySelector('[data-module-content="' + currentModule + '"]');
    const sections = activeContent ? Array.from(activeContent.querySelectorAll('[data-section]')) : [];
    const activeLinks = indexLists.filter(list => list.dataset.moduleIndex === currentModule)
                                   .flatMap(list => Array.from(list.querySelectorAll('a')));

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        const link = activeLinks.find(a => a.dataset.nav === id);

        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }

        if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
          navLinks.forEach(a => a.classList.remove('is-active'));
          if (link) link.classList.add('is-active');
        }
      });
    }, { threshold: [0.35, 0.6], rootMargin: '-10% 0px -40% 0px' });

    sections.forEach(sec => observer.observe(sec));

    if (sections[0]) {
      sections[0].classList.add('is-visible');
      const firstLink = activeLinks.find(a => a.dataset.nav === sections[0].id);
      if (firstLink) {
        navLinks.forEach(a => a.classList.remove('is-active'));
        firstLink.classList.add('is-active');
      }
    }
  }

  function activateModule(moduleId, opts) {
    opts = opts || {};
    currentModule = moduleId;

    moduleContents.forEach(el => {
      el.hidden = el.dataset.moduleContent !== moduleId;
    });

    indexGroups.forEach(group => {
      group.hidden = group.dataset.indexGroup !== moduleId;
    });

    moduleBtns.forEach(btn => {
      const isActive = btn.dataset.moduleBtn === moduleId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    if (activeModuleLabel) activeModuleLabel.textContent = moduleNames[moduleId] || moduleId;

    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });

    setupObserver();
    updateProgress();
  }

  moduleBtns.forEach(btn => {
    btn.addEventListener('click', () => activateModule(btn.dataset.moduleBtn));
  });

  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const list = a.closest('.index__list');
      const targetModule = list ? list.dataset.moduleIndex : null;

      if (targetModule && targetModule !== currentModule) {
        e.preventDefault();
        activateModule(targetModule);
        requestAnimationFrame(() => {
          const targetEl = document.getElementById(a.dataset.nav);
          if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      if (window.innerWidth <= 880) {
        sidebar.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  window.addEventListener('scroll', updateProgress, { passive: true });

  activateModule('1', { keepScroll: true });
});
