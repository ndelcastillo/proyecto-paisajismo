# Buscador en el sidebar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un buscador de texto libre en la parte superior del sidebar que, al escribir una palabra o frase (p. ej. "caduca o perenne"), muestre las láminas cuyo título o cuerpo de texto contienen esas palabras, y al elegir una navegue hasta ella (cambiando de módulo si hace falta).

**Architecture:** Sitio estático sin build ni framework (HTML + CSS + JS vanilla, sin dependencias). El buscador se implementa como: (1) un índice en memoria construido una vez al cargar la página, leyendo las 60 `<section class="lamina" data-section>` de los 8 bloques `[data-module-content]` (incluidos los que están `hidden`); (2) un matcher por palabras normalizadas (sin acentos, sin mayúsculas, ignorando stopwords); (3) un dropdown de resultados bajo el input; (4) navegación que reutiliza el patrón ya existente en `script.js` de `activateModule()` + `scrollIntoView`.

**Tech Stack:** HTML, CSS, JavaScript vanilla (ES6+, sin dependencias, sin bundler). No hay test runner en el repo — la verificación es manual en el navegador.

## Global Constraints

- No agregar dependencias externas (sin librerías de fuzzy-search, sin frameworks).
- Seguir el lenguaje visual existente (`styles.css` tokens: `--ink`, `--moss`, `--paper-panel`, `--font-mono`, bordes finos, sin bordes redondeados grandes) — ver `styles.css:1-23` para tokens y `.module-switch__btn` / `.index__list a` como referencia de estilo de controles existentes.
- El matching debe ser por palabras sueltas normalizadas (sin acentos/mayúsculas), ignorando conectores comunes en español (o, y, de, la, el, en, del, los, las, un, una, del, al, con, para), y una lámina matchea solo si **todas** las palabras no-stopword de la query aparecen como substring en su texto.
- Debe funcionar tanto en desktop (sidebar siempre visible) como en mobile (sidebar colapsable vía `#navToggle` / `.is-open`, ver `styles.css:592-608`).
- Todo el trabajo se hace directo en `index.html`, `styles.css` y `script.js` — no se crean archivos nuevos (proyecto de 3 archivos, sin infraestructura para módulos JS separados).

---

### Task 1: Marcado HTML del buscador

**Files:**
- Modify: `index.html:27-38` (dentro de `<aside class="sidebar" id="sidebar">`, antes de `<div class="stamp">`)

**Interfaces:**
- Produce: elemento `#searchInput` (input de texto) y `#searchResults` (contenedor `<ul>` de resultados, oculto por defecto vía atributo `hidden`), y `#searchEmpty` (mensaje "Sin resultados", oculto por defecto) — estos IDs los consume el Task 3 (JS).

- [ ] **Step 1: Agregar el bloque de búsqueda al sidebar**

Insertar como primer hijo de `<aside class="sidebar" id="sidebar">`, inmediatamente antes de `<div class="stamp">` (línea 28 actual):

```html
      <div class="search">
        <label for="searchInput" class="search__label">Buscar en la guía</label>
        <input
          type="search"
          id="searchInput"
          class="search__input"
          placeholder="Ej.: caduca o perenne…"
          autocomplete="off"
          aria-describedby="searchEmpty"
        >
        <ul class="search__results" id="searchResults" hidden></ul>
        <p class="search__empty" id="searchEmpty" hidden>Sin resultados</p>
      </div>
```

- [ ] **Step 2: Verificar visualmente sin estilos**

Abrir `index.html` en el navegador. El input debe aparecer arriba del sello "Curso de Diseño de Jardines", sin estilos (feo, sin CSS todavía) pero presente y funcional para tipear (no hace nada aún).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Agregar marcado HTML del buscador en el sidebar"
```

---

### Task 2: Estilos CSS del buscador

**Files:**
- Modify: `styles.css` (agregar nueva sección, sugerido después de la sección `SIDEBAR` y antes de `.compass`, es decir después de la línea `styles.css:243` que cierra `.index__list a.is-active .index__num`)

**Interfaces:**
- Consume: tokens existentes `--ink`, `--ink-soft`, `--ink-faint`, `--line`, `--paper-panel`, `--moss-deep`, `--ochre`, `--font-mono`, `--font-body`, `--white` (definidos en `styles.css:4-23`).
- Produce: clases `.search`, `.search__label`, `.search__input`, `.search__results`, `.search__result`, `.search__result a`, `.search__result-module`, `.search__empty`, y un modificador `.search__result.is-active` (para navegación por teclado) — consumidas por el HTML del Task 1 y el JS del Task 3.

- [ ] **Step 1: Agregar los estilos**

Insertar este bloque después de la línea 243 (`.index__list a.is-active .index__num{...}`) y antes de `.compass{`:

```css
/* =========================================================
   BUSCADOR — barra de búsqueda sobre el cajetín
   ========================================================= */
.search{
  margin-bottom: 22px;
  position: relative;
}
.search__label{
  display: block;
  font-family: var(--font-mono);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
  margin-bottom: 8px;
}
.search__input{
  width: 100%;
  font-family: var(--font-body);
  font-size: 13.5px;
  color: var(--ink);
  background: var(--paper-panel);
  border: 1px solid var(--line);
  padding: 9px 10px;
  outline: none;
  transition: border-color 0.15s ease;
}
.search__input::placeholder{ color: var(--ink-faint); }
.search__input:focus{ border-color: var(--moss-deep); }

.search__results{
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--white);
}
.search__results[hidden]{ display: none; }

.search__result a{
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 9px 10px;
  text-decoration: none;
  font-size: 13px;
  color: var(--ink-soft);
  border-bottom: 1px solid var(--line-soft);
}
.search__result:last-child a{ border-bottom: none; }
.search__result a:hover,
.search__result.is-active a{
  background: var(--paper-panel);
  color: var(--ink);
}
.search__result-module{
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ochre);
  flex: 0 0 auto;
  white-space: nowrap;
}

.search__empty{
  margin: 6px 0 0;
  padding: 9px 10px;
  font-size: 12.5px;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  background: var(--white);
}
.search__empty[hidden]{ display: none; }
```

- [ ] **Step 2: Verificar visualmente**

Recargar `index.html` en el navegador. El input debe verse consistente con el resto del sidebar (mismo tipo de borde fino, misma paleta). Confirmar que en mobile (ancho < 880px, sidebar colapsado) el buscador aparece dentro del sidebar desplegable sin romper el layout — abrir el toggle "Índice" y comprobar.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "Agregar estilos del buscador del sidebar"
```

---

### Task 3: Lógica de indexado, búsqueda y navegación en JS

**Files:**
- Modify: `script.js` (agregar código dentro del listener `DOMContentLoaded` existente, líneas 1-131)

**Interfaces:**
- Consume: `moduleContents` (ya definido en `script.js:8`), `activateModule(moduleId, opts)` (ya definida en `script.js:70-94`), `sidebar` y `navToggle` (ya definidos en `script.js:5-6`), y los elementos `#searchInput`, `#searchResults`, `#searchEmpty` del Task 1.
- Produce: función interna `buildSearchIndex()`, `normalize(str)`, `searchLaminas(query)`, `renderResults(matches)`, `goToLamina(id, moduleId)` — todas de uso interno a este archivo, sin exponerse globalmente.

- [ ] **Step 1: Agregar las referencias a los nuevos elementos DOM**

En `script.js`, después de la línea `const activeModuleLabel = document.getElementById('activeModuleLabel');` (línea 11), agregar:

```js
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchEmpty = document.getElementById('searchEmpty');
```

- [ ] **Step 2: Agregar la normalización de texto y las stopwords**

Después del bloque `moduleNames` (que termina en la línea 22 con `};`), agregar:

```js
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
```

- [ ] **Step 3: Agregar la construcción del índice de búsqueda**

Después del bloque anterior, agregar:

```js
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
```

- [ ] **Step 4: Agregar la función de búsqueda**

```js
  function searchLaminas(query) {
    const words = queryWords(query);
    if (words.length === 0) return [];
    return searchIndex.filter(entry => words.every(w => entry.text.includes(w)));
  }
```

- [ ] **Step 5: Agregar el renderizado de resultados**

```js
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
```

- [ ] **Step 6: Agregar la navegación hacia una lámina encontrada**

```js
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
```

Nota: esta función depende de `currentModule`, que ya existe como variable mutable en el archivo (`script.js:25`), y de `activateModule`, ya definida más abajo en el archivo — en JS con `function` declarations dentro del mismo scope esto funciona por hoisting, sin necesidad de reordenar código.

- [ ] **Step 7: Conectar los eventos de input, click y teclado**

Agregar antes de la línea final `activateModule('1', { keepScroll: true });` (línea 130):

```js
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
```

- [ ] **Step 8: Verificar manualmente en el navegador**

Abrir `index.html`. Probar:
1. Escribir "caduca o perenne" en el buscador → debe aparecer como resultado la lámina "Caducas, perennes y coníferas" (Módulo VI, `#s39`), y posiblemente otras láminas que mencionen ambas palabras.
2. Hacer clic en ese resultado → debe cambiar al Módulo VI y hacer scroll hasta esa lámina, y el input debe limpiarse.
3. Estando en el Módulo I, buscar algo que solo existe en otro módulo (p. ej. "riego") → confirmar que también salta de módulo correctamente.
4. Escribir algo sin coincidencias (p. ej. "xyzxyz") → debe mostrar "Sin resultados".
5. Borrar el texto del input → la lista de resultados y el mensaje de vacío deben ocultarse.
6. Probar flechas arriba/abajo y Enter para navegar sin mouse.
7. Probar en mobile (reducir ventana a <880px, abrir el toggle "Índice") → el buscador debe funcionar y cerrar el sidebar al elegir un resultado, igual que los links del índice.

- [ ] **Step 9: Commit**

```bash
git add script.js
git commit -m "Agregar lógica de búsqueda e indexado en el sidebar"
```

---

## Self-Review Notes

- Cobertura: HTML (Task 1), CSS (Task 2), JS de indexado/búsqueda/render/navegación/teclado (Task 3) — cubre el diseño acordado en su totalidad (ubicación arriba del sello, lista de coincidencias con salto al elegir, búsqueda en título+cuerpo, matching por palabras normalizadas ignorando stopwords).
- Sin placeholders: todos los pasos incluyen código completo y verificable.
- Consistencia de nombres: `searchIndex`, `searchInput`, `searchResults`, `searchEmpty`, `goToLamina`, `searchLaminas`, `renderResults` se usan de forma consistente entre los tres tasks.
- No se requiere test runner: el proyecto no tiene infraestructura de testing automatizado (sitio estático de 3 archivos), por lo que la verificación de cada task es manual en navegador, detallada paso a paso.
