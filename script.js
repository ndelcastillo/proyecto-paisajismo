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
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchEmpty = document.getElementById('searchEmpty');

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

  const STOPWORDS = new Set(['o', 'y', 'de', 'la', 'el', 'en', 'del', 'los', 'las', 'un', 'una', 'al', 'con', 'para']);

  function normalize(str) {
    return str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function queryWords(str) {
    return normalize(str)
      .split(/\s+/)
      .filter(w => w.length > 0 && !STOPWORDS.has(w));
  }

  let searchIndex = [];

  function buildSearchIndex() {
    searchIndex = moduleContents.flatMap(content => {
      const moduleId = content.dataset.moduleContent;
      const sections = Array.from(content.querySelectorAll('[data-section]'));
      return sections.map(sec => {
        const titleEl = sec.querySelector('h3');
        const title = titleEl ? titleEl.textContent.trim() : sec.id;
        return {
          id: sec.id,
          moduleId: moduleId,
          title: title,
          text: normalize(sec.textContent)
        };
      });
    });
  }

  function searchLaminas(query) {
    const words = queryWords(query);
    if (words.length === 0) return [];
    return searchIndex.filter(entry => words.every(w => entry.text.includes(w)));
  }

  function clearActiveResult() {
    Array.from(searchResults.children).forEach(li => li.classList.remove('is-active'));
  }

  function renderResults(matches) {
    searchResults.innerHTML = '';

    if (matches.length === 0) {
      searchResults.hidden = true;
      searchEmpty.hidden = false;
      return;
    }

    searchEmpty.hidden = true;

    matches.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'search__result';

      const a = document.createElement('a');
      a.href = '#' + entry.id;
      a.dataset.resultId = entry.id;
      a.dataset.resultModule = entry.moduleId;

      const modSpan = document.createElement('span');
      modSpan.className = 'search__result-module';
      modSpan.textContent = 'Mód. ' + entry.moduleId;

      const titleSpan = document.createElement('span');
      titleSpan.textContent = entry.title;

      a.appendChild(modSpan);
      a.appendChild(titleSpan);
      li.appendChild(a);
      searchResults.appendChild(li);
    });

    searchResults.hidden = false;
  }

  function goToLamina(id, moduleId) {
    if (moduleId !== currentModule) {
      activateModule(moduleId);
    }

    requestAnimationFrame(() => {
      const targetEl = document.getElementById(id);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    searchInput.value = '';
    searchResults.hidden = true;
    searchResults.innerHTML = '';
    searchEmpty.hidden = true;

    if (window.innerWidth <= 880) {
      sidebar.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }

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

  searchInput.addEventListener('input', () => {
    const matches = searchLaminas(searchInput.value);
    renderResults(matches);
  });

  searchResults.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-result-id]');
    if (!a) return;
    e.preventDefault();
    goToLamina(a.dataset.resultId, a.dataset.resultModule);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = Array.from(searchResults.children);
    if (items.length === 0) return;

    const activeIndex = items.findIndex(li => li.classList.contains('is-active'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[Math.min(activeIndex + 1, items.length - 1)];
      clearActiveResult();
      next.classList.add('is-active');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[Math.max(activeIndex - 1, 0)];
      clearActiveResult();
      prev.classList.add('is-active');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIndex >= 0 ? items[activeIndex] : items[0];
      const a = target.querySelector('a[data-result-id]');
      if (a) goToLamina(a.dataset.resultId, a.dataset.resultModule);
    } else if (e.key === 'Escape') {
      searchInput.value = '';
      searchResults.hidden = true;
      searchResults.innerHTML = '';
      searchEmpty.hidden = true;
    }
  });

  buildSearchIndex();

  activateModule('1', { keepScroll: true });
});
