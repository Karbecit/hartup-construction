(function () {
  'use strict';

  const config = window.HartupPageEditor || {};
  const CROP_PRESETS = {
    square: { id: 'square', label: 'Square', ratio: '1:1', aspect: 1 },
    landscape: { id: 'landscape', label: 'Landscape', ratio: '4:3', aspect: 4 / 3 },
    wide: { id: 'wide', label: 'Wide', ratio: '16:9', aspect: 16 / 9 },
    portrait: { id: 'portrait', label: 'Portrait', ratio: '3:4', aspect: 3 / 4 },
  };
  const CROP_PRESET_IDS = ['square', 'landscape', 'wide', 'portrait'];
  const IMAGE_SCALE_OPTIONS = [
    ['0.6', 'Small (60%)'],
    ['0.75', 'Compact (75%)'],
    ['0.85', 'Medium (85%)'],
    ['1', 'Large (100%)'],
    ['1.15', 'Extra large (115%)'],
    ['1.3', 'Maximum (130%)'],
  ];
  const state = {
    page: structuredClone(config.page || {}),
    hero: structuredClone(config.hero || {}),
    mediaFiles: config.mediaFiles || [],
    services: config.services || [],
    cropTarget: null,
    cropEditor: null,
    cropEditorReady: false,
    cropActivePreset: 'landscape',
    mediaTargetInput: null,
    mediaPickCallback: null,
    collapsedSections: new Set(),
    collapsedDesigns: new Set(),
    designCollapseInitialized: new Set(),
    sectionSavedSnapshots: {},
    designSavedSnapshots: {},
    savedSectionOrder: '',
    pageMetaDirty: false,
  };

  if (!state.page.sections) state.page.sections = [];

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function newSectionId() {
    return 'sec_' + Math.random().toString(16).slice(2, 10);
  }

  function defaultSection(type) {
    const base = { id: newSectionId(), type, enabled: true, background: 'default' };
    if (type === 'image_text') {
      return Object.assign(base, {
        eyebrow: '',
        heading: 'New section heading',
        paragraphs: [''],
        bullets: [],
        image_position: 'right',
        image_scale: 1,
        heading_size: 'lg',
        heading_weight: 'semibold',
        text_size: 'normal',
        eyebrow_size: 'sm',
        image: { file: '', alt: '', crop_x: 0, crop_y: 0, crop_zoom: 1, aspect_ratio: 4 / 3 },
      });
    }
    if (type === 'text') {
      return Object.assign(base, {
        eyebrow: '',
        heading: 'New text section',
        paragraphs: [''],
        bullets: [],
        heading_size: 'lg',
        heading_weight: 'semibold',
        text_size: 'normal',
        eyebrow_size: 'sm',
      });
    }
    if (type === 'image') {
      return Object.assign(base, {
        image_scale: 1,
        image: { file: '', alt: '', crop_x: 0, crop_y: 0, crop_zoom: 1, aspect_ratio: 16 / 9 },
        caption: '',
        overlay: defaultOverlay(),
      });
    }
    if (type === 'layout') {
      return Object.assign(base, { min_height: 480, blocks: [] });
    }
    if (type === 'designs') {
      return Object.assign(base, { items: [] });
    }
    if (type === 'service_tiles') {
      return Object.assign(base, {
        eyebrow: '',
        heading: '',
        paragraphs: [],
        heading_size: 'lg',
        heading_weight: 'semibold',
        text_size: 'normal',
        eyebrow_size: 'sm',
        tiles: [],
      });
    }
    return base;
  }

  function aspectLabel(aspect) {
    const match = CROP_PRESET_IDS.map(function (id) {
      return CROP_PRESETS[id];
    }).find(function (preset) {
      return Math.abs(preset.aspect - aspect) < 0.01;
    });
    return match ? match.ratio : aspect.toFixed(2).replace(/\.00$/, '') + ':1';
  }

  function presetForAspect(aspect) {
    const value = aspect || 4 / 3;
    let best = CROP_PRESETS.landscape;
    let bestDiff = Infinity;
    CROP_PRESET_IDS.forEach(function (id) {
      const diff = Math.abs(CROP_PRESETS[id].aspect - value);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = CROP_PRESETS[id];
      }
    });
    return best;
  }

  function sectionSummary(section) {
    if (section.type === 'service_tiles') {
      const count = (section.tiles || []).length;
      const heading = section.heading || section.eyebrow || '';
      const tiles = count ? count + ' tile' + (count === 1 ? '' : 's') : 'No tiles yet';
      return heading ? heading + ' · ' + tiles : tiles;
    }
    if (section.type === 'layout') {
      const count = (section.blocks || []).length;
      return count ? count + ' layout block' + (count === 1 ? '' : 's') : 'Empty layout';
    }
    if (section.type === 'image') {
      const overlayText = (section.overlay && section.overlay.text) || '';
      return overlayText || section.caption || section.image?.file || 'Full-width image';
    }
    if (section.type === 'designs') {
      const count = (section.items || []).length;
      return count ? count + ' design' + (count === 1 ? '' : 's') : 'No designs yet';
    }
    return section.heading || section.eyebrow || 'Untitled section';
  }

  function isSectionCollapsed(sectionId) {
    if (!state.collapsedSections.size && state.page.sections.length > 1) {
      state.page.sections.forEach(function (section) {
        state.collapsedSections.add(section.id);
      });
    }
    return state.collapsedSections.has(sectionId);
  }

  function toggleSectionCollapsed(sectionId) {
    if (state.collapsedSections.has(sectionId)) state.collapsedSections.delete(sectionId);
    else state.collapsedSections.add(sectionId);
  }

  function imageUrl(file) {
    if (!file) return '';
    const parts = String(file).split('/').map(encodeURIComponent);
    return '/images/' + parts.join('/');
  }

  function snapshotSection(section) {
    return JSON.stringify(section);
  }

  function initSectionSnapshots() {
    state.sectionSavedSnapshots = {};
    state.page.sections.forEach(function (section) {
      state.sectionSavedSnapshots[section.id] = snapshotSection(section);
    });
    state.savedSectionOrder = state.page.sections.map(function (section) {
      return section.id;
    }).join('|');
    state.pageMetaDirty = false;
    initDesignSnapshots();
    updateAllSaveButtons();
  }

  function initDesignSnapshots() {
    state.designSavedSnapshots = {};
    state.page.sections.forEach(function (section) {
      if (section.type !== 'designs') return;
      (section.items || []).forEach(function (item) {
        if (item && item.id) state.designSavedSnapshots[item.id] = JSON.stringify(item);
      });
    });
  }

  function isDesignDirty(item) {
    if (!item || !item.id) return true;
    return JSON.stringify(item) !== (state.designSavedSnapshots[item.id] || '');
  }

  function updateDesignSaveUi(card, item) {
    if (!card) return;
    const btn = card.querySelector('[data-action="save-design"]');
    const dirty = isDesignDirty(item);
    if (btn) {
      btn.disabled = !dirty;
      btn.classList.toggle('is-dirty', dirty);
    }
  }

  function updateAllDesignSaveButtons() {
    document.querySelectorAll('.design-admin-item').forEach(function (card) {
      const sectionCard = card.closest('.section-card');
      const sectionId = sectionCard ? sectionCard.dataset.sectionId : '';
      const section = state.page.sections.find(function (entry) {
        return entry.id === sectionId;
      });
      const index = parseInt(card.dataset.designIndex || '-1', 10);
      const item = section && Array.isArray(section.items) ? section.items[index] : null;
      if (item) updateDesignSaveUi(card, item);
    });
  }

  function isSectionDirty(sectionId) {
    const section = state.page.sections.find(function (item) {
      return item.id === sectionId;
    });
    if (!section) return false;
    return snapshotSection(section) !== (state.sectionSavedSnapshots[sectionId] || '');
  }

  function isSectionOrderDirty() {
    const order = state.page.sections
      .map(function (section) {
        return section.id;
      })
      .join('|');
    return order !== state.savedSectionOrder;
  }

  function isPageDirty() {
    if (state.pageMetaDirty || isSectionOrderDirty()) return true;
    return state.page.sections.some(function (section) {
      return isSectionDirty(section.id);
    });
  }

  function updateSectionSaveUi(sectionId) {
    const card = document.querySelector('.section-card[data-section-id="' + sectionId + '"]');
    if (!card) return;
    const btn = card.querySelector('[data-action="save-section"]');
    const dirty = isSectionDirty(sectionId);
    if (btn) {
      btn.disabled = !dirty;
      btn.classList.toggle('is-dirty', dirty);
    }
  }

  function updateGlobalSaveUi() {
    const btn = document.getElementById('editor-save-btn');
    const dirty = isPageDirty();
    if (btn) {
      btn.disabled = !dirty;
      btn.classList.toggle('is-dirty', dirty);
    }
  }

  function updateAllSaveButtons() {
    state.page.sections.forEach(function (section) {
      updateSectionSaveUi(section.id);
    });
    updateAllDesignSaveButtons();
    updateGlobalSaveUi();
  }

  function markSectionDirty(sectionId) {
    if (!sectionId) return;
    updateSectionSaveUi(sectionId);
    updateAllDesignSaveButtons();
    updateGlobalSaveUi();
  }

  function markPageMetaDirty() {
    state.pageMetaDirty = true;
    updateGlobalSaveUi();
  }

  function setSectionSaveStatus(sectionId, message) {
    const card = document.querySelector('.section-card[data-section-id="' + sectionId + '"]');
    const status = card?.querySelector('.section-card__save-status');
    if (status) status.textContent = message || '';
  }

  function renderSections() {
    const root = document.getElementById('sections-root');
    if (!root) return;
    root.innerHTML = '';

    state.page.sections.forEach(function (section, index) {
      root.appendChild(buildSectionCard(section, index));
    });

    if (!state.page.sections.length) {
      root.appendChild(el('p', 'admin-help', 'No sections yet — add one above.'));
    }

    updateAllSaveButtons();
  }

  function buildSectionCard(section, index) {
    const collapsed = isSectionCollapsed(section.id);
    const card = el('article', 'section-card' + (collapsed ? ' is-collapsed' : ''));
    card.dataset.sectionId = section.id;

    const header = el('div', 'section-card__header');
    header.innerHTML =
      '<span class="section-card__handle" title="Drag to reorder" draggable="true">⋮⋮</span>' +
      '<button type="button" class="section-card__toggle" aria-expanded="' +
      (collapsed ? 'false' : 'true') +
      '" aria-label="Toggle section">' +
      (collapsed ? '▸' : '▾') +
      '</button>' +
      '<strong class="section-card__title">' +
      escapeHtml((config.sectionTypes || {})[section.type] || section.type) +
      '</strong>' +
      '<span class="section-card__summary">' +
      escapeHtml(sectionSummary(section)) +
      '</span>' +
      '<label class="admin-checkbox section-card__enabled"><input type="checkbox" data-field="enabled"' +
      (section.enabled !== false ? ' checked' : '') +
      '> Visible</label>' +
      '<button type="button" class="admin-btn admin-btn--ghost section-card__remove" data-action="remove">Remove</button>';

    const body = el('div', 'section-card__body admin-form');
    body.hidden = collapsed;
    body.appendChild(fieldSelect('Background', 'background', section.background || 'default', [
      ['default', 'Default'],
      ['elevated', 'Elevated'],
    ]));

    if (section.type === 'image_text' || section.type === 'text') {
      body.appendChild(buildTextStyleFields(section));
      body.appendChild(fieldInput('Eyebrow', 'eyebrow', section.eyebrow || ''));
      body.appendChild(fieldInput('Heading', 'heading', section.heading || ''));
      body.appendChild(fieldTextarea('Paragraphs (one per line)', 'paragraphs', (section.paragraphs || []).join('\n')));
      body.appendChild(fieldTextarea('Bullet points (one per line)', 'bullets', (section.bullets || []).join('\n')));
    }

    if (section.type === 'image_text') {
      body.appendChild(fieldSelect('Image position', 'image_position', section.image_position || 'right', [
        ['left', 'Image on left'],
        ['right', 'Image on right'],
      ]));
      body.appendChild(
        fieldSelect('Image display size', 'image_scale', String(section.image_scale ?? 1), IMAGE_SCALE_OPTIONS)
      );
      body.appendChild(
        buildImageFields('image', section.image || {}, section.image?.aspect_ratio || 4 / 3, {
          presetIds: ['square', 'landscape', 'wide'],
          onChange: function () {
            markSectionDirty(section.id);
          },
        })
      );
    }

    if (section.type === 'image') {
      body.appendChild(
        fieldSelect('Image display size', 'image_scale', String(section.image_scale ?? 1), IMAGE_SCALE_OPTIONS)
      );
      const overlayEditor = buildOverlayEditor(section);
      body.appendChild(
        buildImageFields('image', section.image || {}, section.image?.aspect_ratio || 16 / 9, {
          presetIds: ['wide', 'landscape', 'square'],
          onChange: function () {
            markSectionDirty(section.id);
            overlayEditor.refresh();
          },
        })
      );
      body.appendChild(fieldInput('Caption (optional)', 'caption', section.caption || ''));
      body.appendChild(overlayEditor.root);
    }

    if (section.type === 'designs') {
      body.appendChild(el('p', 'admin-help', 'Each design uses the standard showcase layout: details on one side, one large image and two smaller images on the other. Floor plan download and View Video buttons only appear when a file or video URL is added.'));
      body.appendChild(buildDesignsEditor(section));
    }

    if (section.type === 'service_tiles') {
      body.appendChild(buildTextStyleFields(section));
      body.appendChild(fieldInput('Eyebrow', 'eyebrow', section.eyebrow || ''));
      body.appendChild(fieldInput('Heading', 'heading', section.heading || ''));
      body.appendChild(fieldTextarea('Paragraphs (one per line)', 'paragraphs', (section.paragraphs || []).join('\n')));
      body.appendChild(buildServiceTilesEditor(section));
    }

    if (section.type === 'layout') {
      const layoutMount = el('div', 'layout-editor-mount');
      body.appendChild(layoutMount);
      if (window.HartupLayoutEditor) {
        window.HartupLayoutEditor.mount(section, layoutMount, layoutEditorApi(section));
      } else {
        layoutMount.appendChild(el('p', 'admin-help', 'Layout editor failed to load — hard refresh the page.'));
      }
    }

    const footer = el('div', 'section-card__footer');
    footer.innerHTML =
      '<span class="section-card__save-status" aria-live="polite"></span>' +
      '<button type="button" class="admin-btn section-card__save" data-action="save-section" disabled>Save section</button>';
    body.appendChild(footer);

    footer.querySelector('[data-action="save-section"]').addEventListener('click', function () {
      saveSection(section.id);
    });

    card.appendChild(header);
    card.appendChild(body);

    header.querySelector('.section-card__toggle').addEventListener('click', function () {
      toggleSectionCollapsed(section.id);
      renderSections();
    });

    header.querySelector('[data-action="remove"]').addEventListener('click', function (event) {
      event.stopPropagation();
      state.page.sections = state.page.sections.filter(function (item) {
        return item.id !== section.id;
      });
      state.collapsedSections.delete(section.id);
      renderSections();
    });

    card.querySelectorAll('[data-field]').forEach(function (input) {
      input.addEventListener('input', function () {
        syncSectionFromCard(card, section);
        const summary = header.querySelector('.section-card__summary');
        if (summary) summary.textContent = sectionSummary(section);
        markSectionDirty(section.id);
      });
      input.addEventListener('change', function () {
        syncSectionFromCard(card, section);
        const summary = header.querySelector('.section-card__summary');
        if (summary) summary.textContent = sectionSummary(section);
        markSectionDirty(section.id);
      });
    });

    const handle = header.querySelector('.section-card__handle');
    handle.addEventListener('dragstart', function (event) {
      card.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', section.id);
    });
    handle.addEventListener('dragend', function () {
      card.classList.remove('is-dragging');
      document.querySelectorAll('.section-card').forEach(function (node) {
        node.classList.remove('is-drag-over');
      });
    });

    card.addEventListener('dragover', function (event) {
      event.preventDefault();
      card.classList.add('is-drag-over');
    });
    card.addEventListener('dragleave', function () {
      card.classList.remove('is-drag-over');
    });
    card.addEventListener('drop', function (event) {
      event.preventDefault();
      card.classList.remove('is-drag-over');
      const draggedId = event.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === section.id) return;
      reorderSections(draggedId, section.id);
    });

    return card;
  }

  function reorderSections(draggedId, targetId) {
    const sections = state.page.sections.slice();
    const from = sections.findIndex(function (item) {
      return item.id === draggedId;
    });
    const to = sections.findIndex(function (item) {
      return item.id === targetId;
    });
    if (from < 0 || to < 0) return;
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    state.page.sections = sections;
    markSectionDirty(draggedId);
    markSectionDirty(targetId);
    updateGlobalSaveUi();
    renderSections();
  }

  function syncSectionFromCard(card, section) {
    section.enabled = card.querySelector('[data-field="enabled"]').checked;
    section.background = card.querySelector('[data-field="background"]').value;
    if ('eyebrow' in section) section.eyebrow = val(card, 'eyebrow');
    if ('heading' in section) section.heading = val(card, 'heading');
    if ('paragraphs' in section) section.paragraphs = lines(val(card, 'paragraphs'));
    if ('bullets' in section) section.bullets = lines(val(card, 'bullets'));
    if ('image_position' in section) section.image_position = val(card, 'image_position');
    if ('image_scale' in section) section.image_scale = parseFloat(val(card, 'image_scale')) || 1;
    if ('heading_size' in section) section.heading_size = val(card, 'heading_size');
    if ('heading_weight' in section) section.heading_weight = val(card, 'heading_weight');
    if ('text_size' in section) section.text_size = val(card, 'text_size');
    if ('eyebrow_size' in section) section.eyebrow_size = val(card, 'eyebrow_size');
    if ('caption' in section) section.caption = val(card, 'caption');
  }

  function buildTextStyleFields(section) {
    const wrap = el('div', 'text-style-fields admin-form');
    wrap.innerHTML = buildTextStyleFieldsHtml(section);
    bindTextStyleFields(wrap, section, function () {
      markSectionDirty(section.id);
    });
    return wrap;
  }

  function buildTextStyleFieldsHtml(section) {
    return (
      '<div class="text-style-fields__row">' +
      fieldSelectHtml('Heading size', 'heading_size', section.heading_size || 'lg', [
        ['sm', 'Small'],
        ['md', 'Medium'],
        ['lg', 'Large'],
        ['xl', 'Extra large'],
      ]) +
      fieldSelectHtml('Heading weight', 'heading_weight', section.heading_weight || 'semibold', [
        ['normal', 'Normal'],
        ['semibold', 'Semi-bold'],
        ['bold', 'Bold'],
      ]) +
      fieldSelectHtml('Text size', 'text_size', section.text_size || 'normal', [
        ['sm', 'Small'],
        ['normal', 'Normal'],
        ['lg', 'Large'],
        ['lead', 'Lead / intro'],
      ]) +
      fieldSelectHtml('Eyebrow size', 'eyebrow_size', section.eyebrow_size || 'sm', [
        ['sm', 'Small'],
        ['normal', 'Normal'],
        ['lg', 'Large'],
      ]) +
      '</div>'
    );
  }

  function fieldSelectHtml(label, field, value, options) {
    let html = '<label>' + escapeHtml(label) + '<select data-style-field="' + field + '">';
    options.forEach(function (option) {
      html +=
        '<option value="' +
        escapeHtml(option[0]) +
        '"' +
        (option[0] === value ? ' selected' : '') +
        '>' +
        escapeHtml(option[1]) +
        '</option>';
    });
    html += '</select></label>';
    return html;
  }

  function bindTextStyleFields(root, target, onChange) {
    root.querySelectorAll('[data-style-field]').forEach(function (input) {
      input.addEventListener('change', function () {
        target[input.dataset.styleField] = input.value;
        if (typeof onChange === 'function') onChange();
      });
    });
  }

  function layoutEditorApi(section) {
    return {
      escapeHtml: escapeHtml,
      imageUrl: imageUrl,
      openMediaPicker: function (input, callback) {
        state.mediaTargetInput = input;
        state.mediaPickCallback = callback || null;
        renderMediaGrid();
        document.getElementById('media-modal').hidden = false;
      },
      openCropModal: function (image, aspect, presetIds, onSave) {
        openCropModal(image, aspect, presetIds, onSave);
      },
      buildImageFields: function (prefix, image, aspect, options) {
        return buildImageFields(prefix, image, aspect, options);
      },
      buildTextStyleFieldsHtml: buildTextStyleFieldsHtml,
      bindTextStyleFields: bindTextStyleFields,
      onChange: function () {
        const summary = document.querySelector(
          '.section-card[data-section-id="' + section.id + '"] .section-card__summary'
        );
        if (summary) summary.textContent = sectionSummary(section);
        markSectionDirty(section.id);
      },
    };
  }

  function val(card, field) {
    const input = card.querySelector('[data-field="' + field + '"]');
    return input ? input.value : '';
  }

  function lines(text) {
    return String(text || '')
      .split('\n')
      .map(function (line) {
        return line.trim();
      })
      .filter(Boolean);
  }

  function fieldInput(label, field, value) {
    const wrap = el('label');
    wrap.textContent = label;
    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.field = field;
    input.value = value || '';
    wrap.appendChild(input);
    return wrap;
  }

  function fieldTextarea(label, field, value) {
    const wrap = el('label');
    wrap.textContent = label;
    const textarea = document.createElement('textarea');
    textarea.rows = 3;
    textarea.dataset.field = field;
    textarea.value = value || '';
    wrap.appendChild(textarea);
    return wrap;
  }

  function fieldSelect(label, field, value, options) {
    const wrap = el('label');
    wrap.textContent = label;
    const select = document.createElement('select');
    select.dataset.field = field;
    options.forEach(function (option) {
      const node = document.createElement('option');
      node.value = option[0];
      node.textContent = option[1];
      if (option[0] === value) node.selected = true;
      select.appendChild(node);
    });
    wrap.appendChild(select);
    return wrap;
  }

  const IMAGE_TRANSITIONS = [
    ['fade', 'Fade'],
    ['slide', 'Slide left'],
    ['slide-up', 'Slide up'],
    ['zoom', 'Zoom in'],
    ['wipe', 'Wipe'],
  ];

  function emptyImageSlide(aspect) {
    return {
      file: '',
      alt: '',
      crop_x: 0,
      crop_y: 0,
      crop_zoom: 1,
      crop_x_mobile: 0,
      crop_y_mobile: 0,
      crop_zoom_mobile: 1,
      aspect_ratio: aspect || 4 / 3,
      cropped_area_pixels: '',
    };
  }

  function ensureSlideshowFields(image) {
    if (!image || typeof image !== 'object') return image;
    if (!Array.isArray(image.slides)) image.slides = [];
    if (!image.transition) image.transition = 'fade';
    if (!image.transition_ms) image.transition_ms = 800;
    if (!image.hold_seconds) image.hold_seconds = 5;
    return image;
  }

  function slideshowSettingsHtml(target) {
    const transition = target.transition || 'fade';
    const speedSec = ((target.transition_ms || 800) / 1000).toFixed(1).replace(/\.0$/, '');
    const hold = String(target.hold_seconds || 5);
    let html =
      '<div class="slideshow-editor__settings-grid">' +
      '<label>Transition<select data-slideshow-field="transition">';
    IMAGE_TRANSITIONS.forEach(function (option) {
      html +=
        '<option value="' +
        option[0] +
        '"' +
        (option[0] === transition ? ' selected' : '') +
        '>' +
        option[1] +
        '</option>';
    });
    html +=
      '</select></label>' +
      '<label>Transition speed<div class="slideshow-editor__unit">' +
      '<input type="number" min="0.2" max="10" step="0.1" data-slideshow-field="transition_seconds" value="' +
      escapeHtml(speedSec) +
      '"><span>seconds</span></div></label>' +
      '<label>Show each image for<div class="slideshow-editor__unit">' +
      '<input type="number" min="0.5" max="60" step="0.5" data-slideshow-field="hold_seconds" value="' +
      escapeHtml(hold) +
      '"><span>seconds</span></div></label>' +
      '</div>';
    return html;
  }

  function bindSlideshowSettings(root, target, onChange) {
    root.querySelectorAll('[data-slideshow-field]').forEach(function (input) {
      const eventName = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventName, function () {
        const field = input.dataset.slideshowField;
        if (field === 'transition') {
          target.transition = input.value || 'fade';
        } else if (field === 'transition_seconds') {
          const seconds = parseFloat(input.value);
          target.transition_ms = isNaN(seconds) ? 800 : Math.round(Math.max(0.15, Math.min(10, seconds)) * 1000);
        } else if (field === 'hold_seconds') {
          const seconds = parseFloat(input.value);
          target.hold_seconds = isNaN(seconds) ? 5 : Math.max(0.5, Math.min(60, seconds));
        }
        if (typeof onChange === 'function') onChange();
      });
    });
  }

  function buildSlideshowEditor(image, options) {
    options = options || {};
    ensureSlideshowFields(image);
    const box = el('div', 'slideshow-editor');
    const allowCrop = options.allowCrop !== false;

    function notify() {
      if (typeof options.onChange === 'function') options.onChange();
    }

    function containerAspect() {
      return image.aspect_ratio || options.aspect || 4 / 3;
    }

    function extraCount() {
      return (image.slides || []).filter(function (slide) {
        return slide && slide.file;
      }).length;
    }

    function render() {
      const total = (image.file ? 1 : 0) + extraCount();
      box.innerHTML =
        '<div class="slideshow-editor__head">' +
        '<p class="slideshow-editor__title">Slideshow</p>' +
        '<p class="slideshow-editor__hint">' +
        (total > 1
          ? total + ' images · plays automatically on the site'
          : 'Add more images to play them in sequence') +
        '</p></div>' +
        '<div class="slideshow-editor__slides"></div>' +
        '<button type="button" class="admin-btn admin-btn--ghost slideshow-editor__add" data-action="add-slide">+ Add image</button>' +
        '<div class="slideshow-editor__settings"' +
        (total > 1 ? '' : ' hidden') +
        '>' +
        slideshowSettingsHtml(image) +
        '</div>';

      const list = box.querySelector('.slideshow-editor__slides');
      (image.slides || []).forEach(function (slide, index) {
        list.appendChild(buildSlideRow(slide, index));
      });

      box.querySelector('[data-action="add-slide"]').addEventListener('click', function () {
        image.slides.push(emptyImageSlide(containerAspect()));
        render();
        notify();
        const pick = box.querySelector('.slideshow-editor__slide:last-child [data-action="pick-slide"]');
        if (pick) pick.click();
      });

      bindSlideshowSettings(box, image, notify);
    }

    function buildSlideRow(slide, index) {
      const row = el('div', 'slideshow-editor__slide');
      row.innerHTML =
        (slide.file
          ? '<img class="slideshow-editor__thumb" src="' + escapeHtml(imageUrl(slide.file)) + '" alt="">'
          : '<div class="slideshow-editor__thumb slideshow-editor__thumb--empty">No image</div>') +
        '<div class="slideshow-editor__slide-fields">' +
        '<div class="image-field-row">' +
        '<input type="text" data-slide-field="file" value="' +
        escapeHtml(slide.file || '') +
        '">' +
        '<button type="button" class="admin-btn admin-btn--ghost" data-action="pick-slide">Choose</button>' +
        (allowCrop
          ? '<button type="button" class="admin-btn admin-btn--ghost" data-action="crop-slide">Pan / zoom</button>'
          : '') +
        '</div>' +
        (allowCrop
          ? '<input type="text" data-slide-field="alt" placeholder="Alt text" value="' +
            escapeHtml(slide.alt || '') +
            '">'
          : '') +
        '</div>' +
        '<div class="slideshow-editor__slide-actions">' +
        '<button type="button" class="admin-btn admin-btn--ghost" data-action="move-up" title="Move up"' +
        (index === 0 ? ' disabled' : '') +
        '>↑</button>' +
        '<button type="button" class="admin-btn admin-btn--ghost" data-action="move-down" title="Move down"' +
        (index === image.slides.length - 1 ? ' disabled' : '') +
        '>↓</button>' +
        '<button type="button" class="slideshow-editor__remove" data-action="remove-slide">Remove</button>' +
        '</div>';

      const fileInput = row.querySelector('[data-slide-field="file"]');
      row.querySelector('[data-action="pick-slide"]').addEventListener('click', function () {
        openMediaPicker(fileInput, function () {
          slide.file = fileInput.value;
          if (!slide.aspect_ratio) slide.aspect_ratio = containerAspect();
          render();
          notify();
        });
      });

      const cropBtn = row.querySelector('[data-action="crop-slide"]');
      if (cropBtn) {
        cropBtn.addEventListener('click', function () {
          if (!slide.file) {
            window.alert('Choose an image first.');
            return;
          }
          openCropModal(slide, containerAspect(), options.presetIds, function () {
            render();
            notify();
          });
        });
      }

      row.querySelectorAll('[data-slide-field]').forEach(function (input) {
        input.addEventListener('input', function () {
          slide[input.dataset.slideField] = input.value;
          notify();
        });
      });

      row.querySelector('[data-action="move-up"]').addEventListener('click', function () {
        if (index <= 0) return;
        const moved = image.slides.splice(index, 1)[0];
        image.slides.splice(index - 1, 0, moved);
        render();
        notify();
      });
      row.querySelector('[data-action="move-down"]').addEventListener('click', function () {
        if (index >= image.slides.length - 1) return;
        const moved = image.slides.splice(index, 1)[0];
        image.slides.splice(index + 1, 0, moved);
        render();
        notify();
      });
      row.querySelector('[data-action="remove-slide"]').addEventListener('click', function () {
        image.slides.splice(index, 1);
        render();
        notify();
      });

      return row;
    }

    render();
    return box;
  }

  function buildHeroSlideshowEditor(hero) {
    ensureSlideshowFields(hero);
    if (!Array.isArray(hero.background_slides)) hero.background_slides = [];
    const box = el('div', 'slideshow-editor');

    function notify() {
      markPageMetaDirty();
    }

    function render() {
      const total = (document.getElementById('hero-background-image')?.value ? 1 : 0) + hero.background_slides.filter(Boolean).length;
      box.innerHTML =
        '<div class="slideshow-editor__head">' +
        '<p class="slideshow-editor__title">Slideshow</p>' +
        '<p class="slideshow-editor__hint">' +
        (total > 1
          ? total + ' images · plays automatically on the homepage'
          : 'Add more background images to play them in sequence') +
        '</p></div>' +
        '<div class="slideshow-editor__slides"></div>' +
        '<button type="button" class="admin-btn admin-btn--ghost slideshow-editor__add" data-action="add-slide">+ Add image</button>' +
        '<div class="slideshow-editor__settings"' +
        (total > 1 ? '' : ' hidden') +
        '>' +
        slideshowSettingsHtml(hero) +
        '</div>';

      const list = box.querySelector('.slideshow-editor__slides');
      hero.background_slides.forEach(function (file, index) {
        list.appendChild(buildHeroSlideRow(file, index));
      });

      box.querySelector('[data-action="add-slide"]').addEventListener('click', function () {
        hero.background_slides.push('');
        render();
        notify();
        const pick = box.querySelector('.slideshow-editor__slide:last-child [data-action="pick-slide"]');
        if (pick) pick.click();
      });

      bindSlideshowSettings(box, hero, notify);
    }

    function buildHeroSlideRow(file, index) {
      const row = el('div', 'slideshow-editor__slide');
      row.innerHTML =
        (file
          ? '<img class="slideshow-editor__thumb" src="' + escapeHtml(imageUrl(file)) + '" alt="">'
          : '<div class="slideshow-editor__thumb slideshow-editor__thumb--empty">No image</div>') +
        '<div class="slideshow-editor__slide-fields">' +
        '<div class="image-field-row">' +
        '<input type="text" data-hero-slide-file value="' +
        escapeHtml(file || '') +
        '">' +
        '<button type="button" class="admin-btn admin-btn--ghost" data-action="pick-slide">Choose</button>' +
        '</div></div>' +
        '<button type="button" class="slideshow-editor__remove" data-action="remove-slide">Remove</button>';

      const fileInput = row.querySelector('[data-hero-slide-file]');
      row.querySelector('[data-action="pick-slide"]').addEventListener('click', function () {
        openMediaPicker(fileInput, function () {
          hero.background_slides[index] = fileInput.value;
          render();
          notify();
        });
      });
      fileInput.addEventListener('input', function () {
        hero.background_slides[index] = fileInput.value;
        notify();
      });
      row.querySelector('[data-action="remove-slide"]').addEventListener('click', function () {
        hero.background_slides.splice(index, 1);
        render();
        notify();
      });
      return row;
    }

    render();
    return box;
  }

  function refreshImagePreview(wrap, image, aspect) {
    let preview = wrap.querySelector('.image-field-preview');
    if (!image.file) {
      if (preview) preview.remove();
      return;
    }
    if (!preview) {
      preview = el('div', 'image-field-preview');
      const slideshow = wrap.querySelector('.slideshow-editor');
      if (slideshow) wrap.insertBefore(preview, slideshow);
      else wrap.appendChild(preview);
    }
    preview.innerHTML =
      '<div class="image-field-preview__frame" style="aspect-ratio:' +
      aspect +
      '"><img src="' +
      escapeHtml(imageUrl(image.file)) +
      '" alt=""></div>';
  }

  function buildImageFields(prefix, image, aspect, options) {
    options = options || {};
    image = image || {};
    ensureSlideshowFields(image);
    const currentAspect = image.aspect_ratio || aspect || 4 / 3;
    const preset = presetForAspect(currentAspect);
    const wrap = el('div', 'image-field-block');
    wrap.innerHTML =
      '<label>Image file<div class="image-field-row">' +
      '<input type="text" data-image-field="file" value="' +
      escapeHtml(image.file || '') +
      '">' +
      '<button type="button" class="admin-btn admin-btn--ghost" data-action="pick-image">Choose</button>' +
      '<button type="button" class="admin-btn admin-btn--ghost" data-action="crop-image">Pan / zoom</button>' +
      '</div></label>' +
      '<label>Alt text<input type="text" data-image-field="alt" value="' +
      escapeHtml(image.alt || '') +
      '"></label>' +
      '<p class="image-field-aspect">Display shape: <strong data-aspect-label>' +
      escapeHtml(preset.label + ' (' + preset.ratio + ')') +
      '</strong></p>';

    refreshImagePreview(wrap, image, currentAspect);
    wrap.appendChild(
      buildSlideshowEditor(image, {
        aspect: currentAspect,
        presetIds: options.presetIds,
        onChange: options.onChange,
      })
    );

    wrap.querySelector('[data-action="pick-image"]').addEventListener('click', function () {
      const fileInput = wrap.querySelector('[data-image-field="file"]');
      openMediaPicker(fileInput, function () {
        image.file = fileInput.value;
        refreshImagePreview(wrap, image, image.aspect_ratio || currentAspect);
        if (typeof options.onChange === 'function') options.onChange();
      });
    });
    wrap.querySelector('[data-action="crop-image"]').addEventListener('click', function () {
      if (!image.file) {
        window.alert('Choose an image first.');
        return;
      }
      openCropModal(image, image.aspect_ratio || currentAspect, options.presetIds, function () {
        const label = wrap.querySelector('[data-aspect-label]');
        const nextPreset = presetForAspect(image.aspect_ratio || currentAspect);
        if (label) label.textContent = nextPreset.label + ' (' + nextPreset.ratio + ')';
        refreshImagePreview(wrap, image, image.aspect_ratio || currentAspect);
        if (typeof options.onChange === 'function') options.onChange();
      });
    });

    wrap.querySelectorAll('[data-image-field]').forEach(function (input) {
      input.addEventListener('input', function () {
        image[input.dataset.imageField] = input.value;
        if (input.dataset.imageField === 'file') {
          refreshImagePreview(wrap, image, image.aspect_ratio || currentAspect);
        }
        if (typeof options.onChange === 'function') options.onChange();
      });
    });

    return wrap;
  }

  function serviceOptionsHtml(selectedSlug) {
    return (
      '<option value="">Select service</option>' +
      state.services
        .map(function (service) {
          const selected = service.slug === selectedSlug ? ' selected' : '';
          return (
            '<option value="' +
            escapeHtml(service.slug) +
            '"' +
            selected +
            '>' +
            escapeHtml(service.nav_label || service.title) +
            '</option>'
          );
        })
        .join('')
    );
  }

  function tileAspectPresetId(aspect) {
    return Math.abs((aspect || 4 / 3) - 1) < 0.01 ? 'square' : 'landscape';
  }

  function updateServiceTileThumb(item, tile) {
    const image = tile.image || {};
    const aspect = image.aspect_ratio || 4 / 3;
    const wrap = item.querySelector('.gallery-admin-item__thumb-wrap');
    const thumb = item.querySelector('.gallery-admin-item__thumb');
    const placeholder = item.querySelector('.service-tile-admin-item__placeholder');

    if (wrap) wrap.style.setProperty('--thumb-aspect', String(aspect));

    if (image.file) {
      item.dataset.src = imageUrl(image.file);
      if (thumb) {
        thumb.src = imageUrl(image.file);
        thumb.hidden = false;
      }
      if (placeholder) placeholder.hidden = true;
    } else {
      delete item.dataset.src;
      if (thumb) thumb.hidden = true;
      if (placeholder) placeholder.hidden = false;
    }
  }

  function initServiceTileDrag(list, section, renderTiles, notifyChange) {
    let draggedItem = null;
    let dragFromHandle = false;

    list.querySelectorAll('.service-tile-admin-item').forEach(function (item) {
      item.setAttribute('draggable', 'false');
      const handle = item.querySelector('.gallery-admin-item__drag');
      if (!handle) return;
      handle.addEventListener('mousedown', function (event) {
        event.preventDefault();
        dragFromHandle = true;
        item.setAttribute('draggable', 'true');
      });
    });

    list.addEventListener('dragstart', function (event) {
      const item = event.target.closest('.service-tile-admin-item');
      if (!item || !dragFromHandle) {
        event.preventDefault();
        return;
      }
      draggedItem = item;
      item.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
    });

    list.addEventListener('dragend', function () {
      dragFromHandle = false;
      if (draggedItem) {
        draggedItem.classList.remove('is-dragging');
        draggedItem.setAttribute('draggable', 'false');
        draggedItem = null;
      }
      list.querySelectorAll('.service-tile-admin-item').forEach(function (item) {
        item.classList.remove('is-drag-over');
      });
    });

    list.addEventListener('dragover', function (event) {
      event.preventDefault();
      const target = event.target.closest('.service-tile-admin-item');
      if (!target || !draggedItem || target === draggedItem) return;
      list.querySelectorAll('.service-tile-admin-item').forEach(function (item) {
        item.classList.toggle('is-drag-over', item === target);
      });
      const rect = target.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      if (after) target.after(draggedItem);
      else target.before(draggedItem);
    });

    list.addEventListener('drop', function (event) {
      event.preventDefault();
      const tiles = [];
      list.querySelectorAll('.service-tile-admin-item').forEach(function (item) {
        const index = parseInt(item.dataset.tileIndex || '-1', 10);
        if (index >= 0 && section.tiles[index]) tiles.push(section.tiles[index]);
      });
      if (tiles.length === section.tiles.length) {
        section.tiles = tiles;
        renderTiles();
        if (typeof notifyChange === 'function') notifyChange();
      }
    });
  }

  function buildServiceTileItem(section, tile, index, list, notifyChange) {
    const image = tile.image || {};
    const aspect = image.aspect_ratio || 4 / 3;
    const aspectGroup = 'tile-aspect-' + section.id + '-' + index;
    const presetId = tileAspectPresetId(aspect);

    const item = el('article', 'gallery-admin-item service-tile-admin-item');
    item.dataset.tileIndex = String(index);

    item.innerHTML =
      '<button type="button" class="gallery-admin-item__drag" aria-label="Drag to reorder" title="Drag to reorder">⋮⋮</button>' +
      '<div class="gallery-admin-item__thumb-wrap" style="--thumb-aspect:' +
      aspect +
      '">' +
      (image.file
        ? '<img class="gallery-admin-item__thumb" src="' + escapeHtml(imageUrl(image.file)) + '" alt="">'
        : '<div class="service-tile-admin-item__placeholder">No image</div>') +
      '</div>' +
      '<div class="gallery-admin-item__controls">' +
      '<label class="toggle-pill toggle-pill--preset">' +
      '<input type="radio" name="' +
      escapeHtml(aspectGroup) +
      '" value="square"' +
      (presetId === 'square' ? ' checked' : '') +
      '><span>Square (1:1)</span></label>' +
      '<label class="toggle-pill toggle-pill--preset">' +
      '<input type="radio" name="' +
      escapeHtml(aspectGroup) +
      '" value="landscape"' +
      (presetId === 'landscape' ? ' checked' : '') +
      '><span>Landscape (4:3)</span></label>' +
      '<button type="button" class="gallery-admin-item__focus" data-action="pick-image">Choose image</button>' +
      '<button type="button" class="gallery-admin-item__focus" data-action="crop-image">Pan / zoom</button>' +
      '<button type="button" class="gallery-admin-item__remove" data-action="remove-tile">Remove</button>' +
      '</div>' +
      '<div class="gallery-admin-item__texts">' +
      '<label class="gallery-admin-item__alt">Service<select data-tile-field="service_slug">' +
      serviceOptionsHtml(tile.service_slug) +
      '</select></label>' +
      '<label class="gallery-admin-item__caption">Tile label (optional)<input type="text" data-tile-field="label" value="' +
      escapeHtml(tile.label || '') +
      '"></label>' +
      '</div>' +
      '<input type="hidden" data-image-field="file" value="' +
      escapeHtml(image.file || '') +
      '">' +
      '<input type="hidden" data-image-field="alt" value="' +
      escapeHtml(image.alt || '') +
      '">';

    if (image.file) item.dataset.src = imageUrl(image.file);

    item.querySelector('[data-action="pick-image"]').addEventListener('click', function () {
      const fileInput = item.querySelector('[data-image-field="file"]');
      openMediaPicker(fileInput, function () {
        tile.image = tile.image || {};
        tile.image.file = fileInput.value;
        updateServiceTileThumb(item, tile);
        if (typeof notifyChange === 'function') notifyChange();
      });
    });

    item.querySelector('[data-action="crop-image"]').addEventListener('click', function () {
      if (!tile.image?.file) {
        window.alert('Choose an image first.');
        return;
      }
      const currentAspect = tile.image.aspect_ratio || 4 / 3;
      openCropModal(tile.image, currentAspect, ['square', 'landscape'], function () {
        updateServiceTileThumb(item, tile);
        if (typeof notifyChange === 'function') notifyChange();
      });
    });

    item.querySelector('[data-action="remove-tile"]').addEventListener('click', function () {
      section.tiles.splice(index, 1);
      renderServiceTiles(section, list, notifyChange);
      if (typeof notifyChange === 'function') notifyChange();
    });

    item.querySelectorAll('[data-tile-field]').forEach(function (input) {
      input.addEventListener('input', function () {
        tile[input.dataset.tileField] = input.value;
        if (typeof notifyChange === 'function') notifyChange();
      });
      input.addEventListener('change', function () {
        tile[input.dataset.tileField] = input.value;
        if (typeof notifyChange === 'function') notifyChange();
      });
    });

    item.querySelectorAll('[name="' + aspectGroup + '"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        const preset = CROP_PRESETS[radio.value];
        if (!preset) return;
        tile.image = tile.image || {};
        tile.image.aspect_ratio = preset.aspect;
        updateServiceTileThumb(item, tile);
        if (typeof notifyChange === 'function') notifyChange();
      });
    });

    item.querySelector('[data-image-field="file"]').addEventListener('input', function (event) {
      tile.image = tile.image || {};
      tile.image.file = event.target.value;
      updateServiceTileThumb(item, tile);
      if (typeof notifyChange === 'function') notifyChange();
    });

    tile.image = tile.image || {};
    item.appendChild(
      buildSlideshowEditor(tile.image, {
        aspect: tile.image.aspect_ratio || 4 / 3,
        presetIds: ['square', 'landscape'],
        onChange: function () {
          updateServiceTileThumb(item, tile);
          if (typeof notifyChange === 'function') notifyChange();
        },
      })
    );

    return item;
  }

  function renderServiceTiles(section, list, notifyChange) {
    list.innerHTML = '';
    (section.tiles || []).forEach(function (tile, index) {
      list.appendChild(buildServiceTileItem(section, tile, index, list, notifyChange));
    });
    initServiceTileDrag(
      list,
      section,
      function () {
        renderServiceTiles(section, list, notifyChange);
      },
      notifyChange
    );
  }

  function buildServiceTilesEditor(section) {
    const wrap = el('div', 'service-tiles-editor');
    const list = el('div', 'gallery-admin-list service-tiles-list');
    wrap.appendChild(list);

    function notifyChange() {
      markSectionDirty(section.id);
      const summary = document.querySelector(
        '.section-card[data-section-id="' + section.id + '"] .section-card__summary'
      );
      if (summary) summary.textContent = sectionSummary(section);
    }

    const addBtn = el('button', 'admin-btn admin-btn--ghost', 'Add tile');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      section.tiles = section.tiles || [];
      section.tiles.push({
        service_slug: '',
        label: '',
        image: { file: '', alt: '', crop_x: 0, crop_y: 0, crop_zoom: 1, aspect_ratio: 4 / 3 },
      });
      renderServiceTiles(section, list, notifyChange);
      notifyChange();
    });

    wrap.appendChild(addBtn);
    renderServiceTiles(section, list, notifyChange);
    return wrap;
  }

  function defaultOverlay() {
    return { text: '', size: 'lg', color: 'light', x: 10, y: 32, w: 80, h: 36 };
  }

  function emptyImageField(aspect) {
    return {
      file: '',
      alt: '',
      crop_x: 0,
      crop_y: 0,
      crop_zoom: 1,
      aspect_ratio: aspect || 4 / 3,
    };
  }

  function clampOverlay(overlay) {
    overlay.w = Math.max(8, Math.min(100, Number(overlay.w) || 80));
    overlay.h = Math.max(8, Math.min(100, Number(overlay.h) || 30));
    overlay.x = Math.max(0, Math.min(100 - overlay.w, Number(overlay.x) || 0));
    overlay.y = Math.max(0, Math.min(100 - overlay.h, Number(overlay.y) || 0));
    return overlay;
  }

  function buildOverlayEditor(section) {
    if (!section.overlay || typeof section.overlay !== 'object') {
      section.overlay = defaultOverlay();
    }
    const overlay = clampOverlay(section.overlay);
    const wrap = el('div', 'overlay-editor');

    function notify() {
      markSectionDirty(section.id);
      const summary = document.querySelector(
        '.section-card[data-section-id="' + section.id + '"] .section-card__summary'
      );
      if (summary) summary.textContent = sectionSummary(section);
    }

    function applyBox(box) {
      box.style.left = overlay.x + '%';
      box.style.top = overlay.y + '%';
      box.style.width = overlay.w + '%';
      box.style.height = overlay.h + '%';
      box.className =
        'overlay-editor__box overlay-editor__box--' +
        (overlay.color === 'dark' ? 'dark' : 'light') +
        ' overlay-editor__box--' +
        (overlay.size || 'lg');
      const label = box.querySelector('.overlay-editor__text');
      if (label) label.textContent = overlay.text || 'Overlay text';
    }

    function refresh() {
      const img = wrap.querySelector('.overlay-editor__image');
      const file = section.image && section.image.file;
      if (!img) return;
      if (file) {
        img.src = imageUrl(file);
        img.hidden = false;
      } else {
        img.removeAttribute('src');
        img.hidden = true;
      }
    }

    wrap.innerHTML =
      '<div class="overlay-editor__head">' +
      '<p class="overlay-editor__title">Overlay text</p>' +
      '<p class="admin-help">Optional text on top of the image. Drag to place, use the corner to resize. Leave blank to hide it on the site.</p>' +
      '</div>' +
      '<div class="overlay-editor__fields">' +
      '<label>Text<input type="text" data-overlay-field="text" value="' +
      escapeHtml(overlay.text || '') +
      '" placeholder="e.g. OUR DESIGNS"></label>' +
      '<label>Size<select data-overlay-field="size">' +
      ['sm', 'md', 'lg', 'xl']
        .map(function (size) {
          const labels = { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large' };
          return (
            '<option value="' +
            size +
            '"' +
            (overlay.size === size ? ' selected' : '') +
            '>' +
            labels[size] +
            '</option>'
          );
        })
        .join('') +
      '</select></label>' +
      '<label>Colour<select data-overlay-field="color">' +
      '<option value="light"' +
      (overlay.color !== 'dark' ? ' selected' : '') +
      '>Light text</option>' +
      '<option value="dark"' +
      (overlay.color === 'dark' ? ' selected' : '') +
      '>Dark text</option>' +
      '</select></label>' +
      '</div>' +
      '<div class="overlay-editor__canvas" data-overlay-canvas>' +
      '<img class="overlay-editor__image" alt="">' +
      '<div class="overlay-editor__placeholder">Choose an image to position the overlay</div>' +
      '<div class="overlay-editor__box" data-overlay-box>' +
      '<span class="overlay-editor__text"></span>' +
      '<span class="overlay-editor__resize" title="Drag to resize"></span>' +
      '</div></div>';

    const canvas = wrap.querySelector('[data-overlay-canvas]');
    const box = wrap.querySelector('[data-overlay-box]');
    applyBox(box);
    refresh();

    wrap.querySelectorAll('[data-overlay-field]').forEach(function (input) {
      const eventName = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventName, function () {
        overlay[input.dataset.overlayField] = input.value;
        applyBox(box);
        notify();
      });
    });

    box.addEventListener('pointerdown', function (event) {
      if (event.target.closest('.overlay-editor__resize')) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const origX = overlay.x;
      const origY = overlay.y;
      function move(ev) {
        const dx = ((ev.clientX - startX) / rect.width) * 100;
        const dy = ((ev.clientY - startY) / rect.height) * 100;
        overlay.x = origX + dx;
        overlay.y = origY + dy;
        clampOverlay(overlay);
        applyBox(box);
      }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        notify();
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    const handle = wrap.querySelector('.overlay-editor__resize');
    handle.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      event.stopPropagation();
      const rect = canvas.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const origW = overlay.w;
      const origH = overlay.h;
      function move(ev) {
        overlay.w = origW + ((ev.clientX - startX) / rect.width) * 100;
        overlay.h = origH + ((ev.clientY - startY) / rect.height) * 100;
        clampOverlay(overlay);
        applyBox(box);
      }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        notify();
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    return { root: wrap, refresh: refresh };
  }

  function emptyDesignItem() {
    return {
      id: 'des_' + Math.random().toString(16).slice(2, 10),
      name: '',
      description: [],
      bullets: [],
      price_from: '',
      width: '',
      length: '',
      area: '',
      bedrooms: '',
      bathrooms: '',
      floorplan_pdf: '',
      video_url: '',
      image_position: 'right',
      hero_image: emptyImageField(4 / 3),
      hero_caption: 'Floor Plan',
      image_2: emptyImageField(4 / 3),
      image_2_caption: 'Exterior view',
      image_3: emptyImageField(4 / 3),
      image_3_caption: 'Exterior view',
    };
  }

  function isDesignCollapsed(designId) {
    return state.collapsedDesigns.has(designId);
  }

  function toggleDesignCollapsed(designId) {
    if (state.collapsedDesigns.has(designId)) state.collapsedDesigns.delete(designId);
    else state.collapsedDesigns.add(designId);
  }

  function setDesignSaveStatus(card, message) {
    const status = card.querySelector('.design-admin-item__save-status');
    if (status) status.textContent = message || '';
  }

  function saveDesignItem(section, item, card) {
    setDesignSaveStatus(card, 'Saving…');
    savePage({
      statusEl: document.getElementById('editor-save-status'),
      onSuccess: function () {
        setDesignSaveStatus(card, 'Saved');
        window.setTimeout(function () {
          setDesignSaveStatus(card, '');
        }, 2000);
      },
    }).catch(function () {
      setDesignSaveStatus(card, 'Save failed');
    });
  }

  function designImagePresetId(aspect) {
    const preset = presetForAspect(aspect || 4 / 3);
    if (preset.id === 'square' || preset.id === 'wide' || preset.id === 'landscape') return preset.id;
    return 'landscape';
  }

  function updateDesignImageThumb(itemEl, image) {
    const aspect = image.aspect_ratio || 4 / 3;
    const wrap = itemEl.querySelector('.gallery-admin-item__thumb-wrap');
    const thumb = itemEl.querySelector('.gallery-admin-item__thumb');
    const placeholder = itemEl.querySelector('.design-image-admin-item__placeholder');
    if (wrap) wrap.style.setProperty('--thumb-aspect', String(aspect));
    if (image.file) {
      itemEl.dataset.src = imageUrl(image.file);
      if (thumb) {
        thumb.src = imageUrl(image.file);
        thumb.hidden = false;
      }
      if (placeholder) placeholder.hidden = true;
    } else {
      delete itemEl.dataset.src;
      if (thumb) thumb.hidden = true;
      if (placeholder) placeholder.hidden = false;
    }
  }

  function buildDesignImageItem(item, imageKey, captionKey, label, captionValue, notifyChange) {
    if (!item[imageKey] || typeof item[imageKey] !== 'object') item[imageKey] = emptyImageField(4 / 3);
    const image = item[imageKey];
    const aspect = image.aspect_ratio || 4 / 3;
    const aspectGroup = 'design-aspect-' + (item.id || 'new') + '-' + imageKey;
    const presetId = designImagePresetId(aspect);

    const row = el('article', 'gallery-admin-item design-image-admin-item');
    row.innerHTML =
      '<div class="gallery-admin-item__thumb-wrap" style="--thumb-aspect:' +
      aspect +
      '">' +
      (image.file
        ? '<img class="gallery-admin-item__thumb" src="' + escapeHtml(imageUrl(image.file)) + '" alt="">'
        : '<div class="design-image-admin-item__placeholder">No image</div>') +
      '</div>' +
      '<div class="gallery-admin-item__controls">' +
      '<span class="design-image-admin-item__label">' +
      escapeHtml(label) +
      '</span>' +
      '<label class="toggle-pill toggle-pill--preset"><input type="radio" name="' +
      escapeHtml(aspectGroup) +
      '" value="square"' +
      (presetId === 'square' ? ' checked' : '') +
      '><span>Square (1:1)</span></label>' +
      '<label class="toggle-pill toggle-pill--preset"><input type="radio" name="' +
      escapeHtml(aspectGroup) +
      '" value="landscape"' +
      (presetId === 'landscape' ? ' checked' : '') +
      '><span>Landscape (4:3)</span></label>' +
      '<label class="toggle-pill toggle-pill--preset"><input type="radio" name="' +
      escapeHtml(aspectGroup) +
      '" value="wide"' +
      (presetId === 'wide' ? ' checked' : '') +
      '><span>Wide (16:9)</span></label>' +
      '<button type="button" class="gallery-admin-item__focus" data-action="pick-image">Choose image</button>' +
      '<button type="button" class="gallery-admin-item__focus" data-action="crop-image">Pan / zoom</button>' +
      '</div>' +
      '<div class="gallery-admin-item__texts">' +
      '<label class="gallery-admin-item__caption">Caption<input type="text" data-caption-field value="' +
      escapeHtml(captionValue || '') +
      '"></label>' +
      '<label class="gallery-admin-item__alt">Alt text<input type="text" data-image-field="alt" value="' +
      escapeHtml(image.alt || '') +
      '"></label>' +
      '</div>' +
      '<input type="hidden" data-image-field="file" value="' +
      escapeHtml(image.file || '') +
      '">';

    if (image.file) row.dataset.src = imageUrl(image.file);

    row.querySelector('[data-action="pick-image"]').addEventListener('click', function () {
      const fileInput = row.querySelector('[data-image-field="file"]');
      openMediaPicker(fileInput, function () {
        image.file = fileInput.value;
        updateDesignImageThumb(row, image);
        if (typeof notifyChange === 'function') notifyChange();
      });
    });

    row.querySelector('[data-action="crop-image"]').addEventListener('click', function () {
      if (!image.file) {
        window.alert('Choose an image first.');
        return;
      }
      openCropModal(image, image.aspect_ratio || 4 / 3, ['landscape', 'square', 'wide'], function () {
        const nextPreset = designImagePresetId(image.aspect_ratio || 4 / 3);
        row.querySelectorAll('[name="' + aspectGroup + '"]').forEach(function (radio) {
          radio.checked = radio.value === nextPreset;
        });
        updateDesignImageThumb(row, image);
        if (typeof notifyChange === 'function') notifyChange();
      });
    });

    row.querySelectorAll('[name="' + aspectGroup + '"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        const preset = CROP_PRESETS[radio.value];
        if (!preset) return;
        image.aspect_ratio = preset.aspect;
        updateDesignImageThumb(row, image);
        if (typeof notifyChange === 'function') notifyChange();
      });
    });

    row.querySelector('[data-caption-field]').addEventListener('input', function (event) {
      item[captionKey] = event.target.value;
      if (typeof notifyChange === 'function') notifyChange();
    });

    row.querySelectorAll('[data-image-field]').forEach(function (input) {
      input.addEventListener('input', function () {
        image[input.dataset.imageField] = input.value;
        if (input.dataset.imageField === 'file') updateDesignImageThumb(row, image);
        if (typeof notifyChange === 'function') notifyChange();
      });
    });

    row.appendChild(
      buildSlideshowEditor(image, {
        aspect: image.aspect_ratio || 4 / 3,
        presetIds: ['landscape', 'square', 'wide'],
        onChange: function () {
          updateDesignImageThumb(row, image);
          if (typeof notifyChange === 'function') notifyChange();
        },
      })
    );

    return row;
  }

  function buildDesignsEditor(section) {
    if (!Array.isArray(section.items)) section.items = [];
    if (!state.designCollapseInitialized.has(section.id)) {
      section.items.forEach(function (item) {
        if (item && item.id) state.collapsedDesigns.add(item.id);
      });
      state.designCollapseInitialized.add(section.id);
    }

    const wrap = el('div', 'designs-editor');
    const list = el('div', 'designs-editor__list');
    wrap.appendChild(list);

    function notifyChange() {
      markSectionDirty(section.id);
      updateAllDesignSaveButtons();
      const summary = document.querySelector(
        '.section-card[data-section-id="' + section.id + '"] .section-card__summary'
      );
      if (summary) summary.textContent = sectionSummary(section);
    }

    const addBtn = el('button', 'admin-btn admin-btn--ghost', 'Add design');
    addBtn.type = 'button';
    addBtn.addEventListener('click', function () {
      const item = emptyDesignItem();
      section.items.push(item);
      state.collapsedDesigns.delete(item.id);
      renderDesignItems(section, list, notifyChange);
      notifyChange();
    });
    wrap.appendChild(addBtn);
    renderDesignItems(section, list, notifyChange);
    return wrap;
  }

  function renderDesignItems(section, list, notifyChange) {
    list.innerHTML = '';
    (section.items || []).forEach(function (item, index) {
      list.appendChild(buildDesignItem(section, item, index, list, notifyChange));
    });
  }

  function buildDesignItem(section, item, index, list, notifyChange) {
    if (!item.id) item.id = 'des_' + Math.random().toString(16).slice(2, 10);
    const collapsed = isDesignCollapsed(item.id);
    const card = el('article', 'design-admin-item' + (collapsed ? ' is-collapsed' : ''));
    card.dataset.designIndex = String(index);
    const title = item.name || 'Untitled design';
    card.innerHTML =
      '<div class="design-admin-item__header">' +
      '<button type="button" class="gallery-admin-item__drag" aria-label="Drag to reorder" title="Drag to reorder">⋮⋮</button>' +
      '<button type="button" class="design-admin-item__toggle" aria-expanded="' +
      (collapsed ? 'false' : 'true') +
      '" aria-label="Toggle design">' +
      (collapsed ? '▸' : '▾') +
      '</button>' +
      '<strong class="design-admin-item__title">' +
      escapeHtml(title) +
      '</strong>' +
      '<span class="design-admin-item__save-status" aria-live="polite"></span>' +
      '<button type="button" class="admin-btn design-admin-item__save" data-action="save-design" disabled>Save</button>' +
      '<button type="button" class="gallery-admin-item__remove" data-action="remove-design">Remove</button>' +
      '</div>' +
      '<div class="design-admin-item__body admin-form"></div>';

    const body = card.querySelector('.design-admin-item__body');
    body.hidden = collapsed;
    body.appendChild(fieldInput('Name', 'name', item.name || ''));
    body.appendChild(fieldTextarea('Description (one paragraph per line)', 'description', (item.description || []).join('\n')));
    body.appendChild(fieldTextarea('Bullet points (one per line)', 'bullets', (item.bullets || []).join('\n')));
    body.appendChild(fieldInput('Priced from', 'price_from', item.price_from || ''));

    const dims = el('div', 'design-admin-item__row');
    dims.appendChild(fieldInput('Width (m)', 'width', item.width || ''));
    dims.appendChild(fieldInput('Length (m)', 'length', item.length || ''));
    dims.appendChild(fieldInput('Area (m²)', 'area', item.area || ''));
    body.appendChild(dims);

    const rooms = el('div', 'design-admin-item__row');
    rooms.appendChild(fieldInput('Bedrooms', 'bedrooms', item.bedrooms || ''));
    rooms.appendChild(fieldInput('Bathrooms', 'bathrooms', item.bathrooms || ''));
    body.appendChild(rooms);

    body.appendChild(fieldSelect('Images position', 'image_position', item.image_position || 'right', [
      ['right', 'Images on the right'],
      ['left', 'Images on the left'],
    ]));
    body.appendChild(fieldInput('Floor plan PDF (URL or path)', 'floorplan_pdf', item.floorplan_pdf || ''));
    body.appendChild(fieldInput('Video URL (optional)', 'video_url', item.video_url || ''));

    const images = el('div', 'design-admin-item__images');
    images.appendChild(el('p', 'design-admin-item__image-label', 'Images'));
    [
      ['hero_image', 'hero_caption', 'Large image', item.hero_caption || 'Floor Plan'],
      ['image_2', 'image_2_caption', 'Small image 1', item.image_2_caption || 'Exterior view'],
      ['image_3', 'image_3_caption', 'Small image 2', item.image_3_caption || 'Exterior view'],
    ].forEach(function (entry) {
      images.appendChild(buildDesignImageItem(item, entry[0], entry[1], entry[2], entry[3], notifyChange));
    });
    body.appendChild(images);

    body.querySelectorAll('[data-field]').forEach(function (input) {
      const eventName = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventName, function () {
        const field = input.dataset.field;
        if (field === 'description' || field === 'bullets') item[field] = lines(input.value);
        else item[field] = input.value;
        if (field === 'name') {
          const titleEl = card.querySelector('.design-admin-item__title');
          if (titleEl) titleEl.textContent = item.name || 'Untitled design';
        }
        notifyChange();
      });
    });

    card.querySelector('.design-admin-item__toggle').addEventListener('click', function () {
      toggleDesignCollapsed(item.id);
      renderDesignItems(section, list, notifyChange);
    });

    card.querySelector('[data-action="save-design"]').addEventListener('click', function (event) {
      event.stopPropagation();
      saveDesignItem(section, item, card);
    });

    card.querySelector('[data-action="remove-design"]').addEventListener('click', function () {
      section.items.splice(index, 1);
      state.collapsedDesigns.delete(item.id);
      delete state.designSavedSnapshots[item.id];
      renderDesignItems(section, list, notifyChange);
      notifyChange();
    });

    const handle = card.querySelector('.gallery-admin-item__drag');
    handle.draggable = true;
    handle.addEventListener('dragstart', function (event) {
      card.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    });
    handle.addEventListener('dragend', function () {
      card.classList.remove('is-dragging');
    });
    card.addEventListener('dragover', function (event) {
      event.preventDefault();
      card.classList.add('is-drag-over');
    });
    card.addEventListener('dragleave', function () {
      card.classList.remove('is-drag-over');
    });
    card.addEventListener('drop', function (event) {
      event.preventDefault();
      card.classList.remove('is-drag-over');
      const from = parseInt(event.dataTransfer.getData('text/plain'), 10);
      if (isNaN(from) || from === index) return;
      const items = section.items.slice();
      const [moved] = items.splice(from, 1);
      items.splice(index, 0, moved);
      section.items = items;
      renderDesignItems(section, list, notifyChange);
      notifyChange();
    });

    updateDesignSaveUi(card, item);
    return card;
  }

  function openMediaPicker(input, callback) {
    state.mediaTargetInput = input;
    state.mediaPickCallback = callback || null;
    renderMediaGrid();
    document.getElementById('media-modal').hidden = false;
  }

  function renderMediaGrid() {
    const grid = document.getElementById('media-grid');
    if (!grid) return;
    grid.innerHTML = state.mediaFiles
      .map(function (file) {
        return (
          '<button type="button" class="media-item" data-file="' +
          escapeHtml(file.file) +
          '"><img src="' +
          escapeHtml(file.url || imageUrl(file.file)) +
          '" alt=""><span>' +
          escapeHtml(file.name) +
          '</span></button>'
        );
      })
      .join('');

    grid.querySelectorAll('.media-item').forEach(function (button) {
      button.addEventListener('click', function () {
        if (state.mediaTargetInput) {
          state.mediaTargetInput.value = button.dataset.file;
          state.mediaTargetInput.dispatchEvent(new Event('input'));
        }
        const callback = state.mediaPickCallback;
        state.mediaPickCallback = null;
        document.getElementById('media-modal').hidden = true;
        if (callback) callback();
        else renderSections();
      });
    });
  }

  function showCropModal(modal) {
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.removeAttribute('hidden');
    modal.classList.add('is-open');
    document.body.classList.add('crop-modal-open');
  }

  function hideCropModal(modal) {
    modal.setAttribute('hidden', 'hidden');
    modal.classList.remove('is-open');
    document.body.classList.remove('crop-modal-open');
  }

  function buildCropCompareGrid(presetIds) {
    const grid = document.getElementById('crop-modal-compare-grid');
    if (!grid) return;
    grid.innerHTML = '';
    (presetIds || CROP_PRESET_IDS).forEach(function (presetId) {
      const preset = CROP_PRESETS[presetId];
      if (!preset) return;
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'crop-modal__compare-tile crop-modal__compare-tile--' + presetId;
      tile.setAttribute('data-preset-id', presetId);
      tile.setAttribute('role', 'radio');
      tile.setAttribute('aria-label', preset.label + ', ' + preset.ratio);
      tile.innerHTML =
        '<div class="crop-modal__compare-frame ice-preview-frame">' +
        '<img alt="" draggable="false">' +
        '</div>' +
        '<span class="crop-modal__compare-label">' +
        preset.label +
        ' · ' +
        preset.ratio +
        '</span>';
      tile.addEventListener('click', function () {
        selectCropPreset(presetId, true);
      });
      grid.appendChild(tile);
    });
  }

  function updateCropCompareSelection(presetId) {
    state.cropActivePreset = presetId;
    const grid = document.getElementById('crop-modal-compare-grid');
    if (!grid) return;
    grid.querySelectorAll('.crop-modal__compare-tile').forEach(function (tile) {
      const active = tile.getAttribute('data-preset-id') === presetId;
      tile.classList.toggle('is-selected', active);
      tile.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  function renderCropComparePreviews() {
    if (!state.cropEditor) return;
    const grid = document.getElementById('crop-modal-compare-grid');
    if (!grid) return;
    grid.querySelectorAll('.crop-modal__compare-tile').forEach(function (tile) {
      const presetId = tile.getAttribute('data-preset-id');
      const preset = CROP_PRESETS[presetId];
      const frame = tile.querySelector('.crop-modal__compare-frame');
      if (frame && preset) state.cropEditor.renderPreviewAt(frame, preset.aspect);
    });
  }

  function selectCropPreset(presetId, resetCrop) {
    const preset = CROP_PRESETS[presetId];
    if (!preset || !state.cropEditor) return;
    updateCropCompareSelection(presetId);
    const aspectEl = document.getElementById('crop-modal-aspect');
    if (aspectEl) aspectEl.textContent = 'Crop frame: ' + preset.label + ' (' + preset.ratio + ')';
    state.cropEditor.setAspect(preset.aspect);
    if (resetCrop) state.cropEditor.reset();
    state.cropEditor.layout();
    renderCropComparePreviews();
  }

  function ensureCropEditor() {
    if (state.cropEditorReady && state.cropEditor) return true;
    const editorRoot = document.getElementById('crop-editor-root');
    if (!window.ImageCropEditor || !editorRoot) return false;
    state.cropEditor = window.ImageCropEditor.create(editorRoot, {
      minZoom: 1,
      maxZoom: 3,
      onChange: function (cropState) {
        const zoomInput = document.getElementById('crop-modal-zoom');
        const zoomVal = document.getElementById('crop-modal-zoom-val');
        if (zoomInput) zoomInput.value = String(cropState.zoom);
        if (zoomVal) zoomVal.textContent = Math.round(cropState.zoom * 100) + '%';
        renderCropComparePreviews();
      },
    });
    state.cropEditorReady = true;
    return true;
  }

  function openCropModal(image, aspect, presetIds, onSave) {
    const modal = document.getElementById('crop-modal');
    if (!modal || !ensureCropEditor()) return;
    if (!image.file) return;

    state.cropTarget = {
      image: image,
      onSave: typeof onSave === 'function' ? onSave : null,
    };

    const preset = presetForAspect(aspect || image.aspect_ratio || 4 / 3);
    const allowedPresets = presetIds || CROP_PRESET_IDS;
    buildCropCompareGrid(allowedPresets);
    updateCropCompareSelection(preset.id);
    selectCropPreset(preset.id, false);

    showCropModal(modal);
    state.cropEditor.loadImage(imageUrl(image.file), {
      cropX: image.crop_x || 0,
      cropY: image.crop_y || 0,
      zoom: image.crop_zoom || 1,
      aspectRatio: preset.aspect,
    }).then(function () {
      window.requestAnimationFrame(function () {
        state.cropEditor.layout();
        renderCropComparePreviews();
        const zoomInput = document.getElementById('crop-modal-zoom');
        const zoomVal = document.getElementById('crop-modal-zoom-val');
        const zoom = image.crop_zoom || 1;
        if (zoomInput) zoomInput.value = String(zoom);
        if (zoomVal) zoomVal.textContent = Math.round(zoom * 100) + '%';
      });
    });
  }

  function initCropModal() {
    const modal = document.getElementById('crop-modal');
    if (!modal) return;

    const zoomInput = document.getElementById('crop-modal-zoom');
    const zoomIn = document.getElementById('crop-zoom-in');
    const zoomOut = document.getElementById('crop-zoom-out');
    const saveBtn = document.getElementById('crop-modal-save');
    const cancelBtn = document.getElementById('crop-modal-cancel');
    const resetBtn = document.getElementById('crop-modal-reset');
    const closeBtn = document.getElementById('crop-modal-close');
    const backdrop = document.getElementById('crop-modal-backdrop');

    function closeModal() {
      hideCropModal(modal);
      state.cropTarget = null;
    }

    if (zoomInput) {
      zoomInput.addEventListener('input', function () {
        if (state.cropEditor) {
          state.cropEditor.setZoom(parseFloat(zoomInput.value) || 1);
          renderCropComparePreviews();
        }
      });
    }
    if (zoomIn) {
      zoomIn.addEventListener('click', function () {
        if (state.cropEditor) {
          state.cropEditor.nudgeZoom(0.1);
          renderCropComparePreviews();
        }
      });
    }
    if (zoomOut) {
      zoomOut.addEventListener('click', function () {
        if (state.cropEditor) {
          state.cropEditor.nudgeZoom(-0.1);
          renderCropComparePreviews();
        }
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (state.cropEditor) {
          state.cropEditor.reset();
          renderCropComparePreviews();
        }
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (!state.cropEditor || !state.cropTarget) return;
        const cropState = state.cropEditor.getState();
        Object.assign(state.cropTarget.image, {
          crop_x: cropState.cropX,
          crop_y: cropState.cropY,
          crop_zoom: cropState.zoom,
          aspect_ratio: cropState.aspectRatio,
          cropped_area_pixels: cropState.croppedAreaPixels || '',
        });
        const onSave = state.cropTarget.onSave;
        closeModal();
        if (onSave) onSave();
        else renderSections();
      });
    }
    [cancelBtn, closeBtn, backdrop].forEach(function (node) {
      if (node) node.addEventListener('click', closeModal);
    });
  }

  function collectPayload() {
    document.querySelectorAll('.section-card').forEach(function (card) {
      const id = card.dataset.sectionId;
      const section = state.page.sections.find(function (item) {
        return item.id === id;
      });
      if (section) syncSectionFromCard(card, section);
    });

    const payload = {
      action: 'save_page',
      csrf_token: config.csrfToken,
      title: state.page.title,
      sections: state.page.sections,
      page_hero: state.page.page_hero || {},
    };

    if (config.mode === 'page') {
      payload.page_hero = {
        eyebrow: document.getElementById('page-hero-eyebrow')?.value || '',
        heading: document.getElementById('page-hero-heading')?.value || '',
        lead: document.getElementById('page-hero-lead')?.value || '',
      };
      if (config.slug === 'home') {
        payload.hero = {
          tagline: document.getElementById('hero-tagline')?.value || '',
          background_image: document.getElementById('hero-background-image')?.value || '',
          background_slides: (state.hero.background_slides || []).filter(Boolean),
          transition: state.hero.transition || 'fade',
          transition_ms: state.hero.transition_ms || 800,
          hold_seconds: state.hero.hold_seconds || 5,
        };
      } else {
        payload.visible = document.getElementById('page-visible')?.checked || false;
        payload.in_menu = document.getElementById('page-in-menu')?.checked || false;
        if (config.slug === 'terms') {
          payload.download_pdf = document.getElementById('page-download-pdf')?.value || '';
        }
      }
    }

    if (config.mode === 'service') {
      payload.title = document.getElementById('service-title')?.value || '';
      payload.nav_label = document.getElementById('service-nav-label')?.value || '';
      payload.href = document.getElementById('service-href')?.value || '';
      payload.tag = document.getElementById('service-tag')?.value || '';
      payload.description = document.getElementById('service-description')?.value || '';
      payload.in_menu = document.getElementById('service-in-menu')?.checked || false;
      payload.visible = document.getElementById('service-visible')?.checked || false;
      payload.parent_slug = document.getElementById('service-parent-slug')?.value || '';
    }

    return payload;
  }

  function bindPdfUpload() {
    const input = document.getElementById('page-download-pdf');
    const fileInput = document.getElementById('page-download-pdf-file');
    const uploadBtn = document.getElementById('page-download-pdf-upload');
    const clearBtn = document.getElementById('page-download-pdf-clear');
    const status = document.getElementById('page-download-pdf-status');
    if (!input || !fileInput || !uploadBtn) return;

    uploadBtn.addEventListener('click', function () {
      fileInput.click();
    });

    clearBtn?.addEventListener('click', function () {
      input.value = '';
      fileInput.value = '';
      if (status) status.textContent = 'PDF cleared. Save the page to hide the download button.';
      markPageMetaDirty();
    });

    fileInput.addEventListener('change', function () {
      const file = this.files && this.files[0];
      if (!file) return;
      const data = new FormData();
      data.append('csrf_token', config.csrfToken);
      data.append('pdf', file);
      if (status) status.textContent = 'Uploading…';
      fetch('/admin/api/document.php', { method: 'POST', body: data })
        .then(function (response) {
          return response.json().catch(function () {
            throw new Error('Upload failed — server returned an invalid response.');
          }).then(function (result) {
            if (!response.ok || !result.success) {
              throw new Error(result.message || 'Upload failed');
            }
            return result;
          });
        })
        .then(function (result) {
          input.value = result.file?.url || '';
          if (status) status.textContent = 'PDF uploaded. Save the page to publish the download button.';
          markPageMetaDirty();
        })
        .catch(function (error) {
          if (status) status.textContent = error.message || 'Upload failed';
          alert(error.message || 'Upload failed');
        })
        .finally(function () {
          fileInput.value = '';
        });
    });
  }

  function savePage(options) {
    options = options || {};
    const status = options.statusEl || document.getElementById('editor-save-status');
    const url =
      config.mode === 'service'
        ? '/admin/service-edit.php?slug=' + encodeURIComponent(config.slug)
        : '/admin/page-edit.php?slug=' + encodeURIComponent(config.slug);

    if (status) status.textContent = 'Saving…';

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(collectPayload()),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || !data.success) throw new Error(data.message || 'Save failed');
          initSectionSnapshots();
          if (status) {
            status.textContent = 'Saved';
            window.setTimeout(function () {
              if (status.textContent === 'Saved') status.textContent = '';
            }, 2500);
          }
          if (typeof options.onSuccess === 'function') options.onSuccess();
        });
      })
      .catch(function (error) {
        if (status) status.textContent = error.message || 'Save failed';
        throw error;
      });
  }

  function saveSection(sectionId) {
    const card = document.querySelector('.section-card[data-section-id="' + sectionId + '"]');
    const section = state.page.sections.find(function (item) {
      return item.id === sectionId;
    });
    if (card && section) syncSectionFromCard(card, section);
    setSectionSaveStatus(sectionId, 'Saving…');
    savePage({
      statusEl: document.getElementById('editor-save-status'),
      onSuccess: function () {
        setSectionSaveStatus(sectionId, 'Saved');
        window.setTimeout(function () {
          setSectionSaveStatus(sectionId, '');
        }, 2000);
      },
    }).catch(function () {
      setSectionSaveStatus(sectionId, 'Save failed');
    });
  }

  ready(function () {
    renderSections();
    initSectionSnapshots();
    initCropModal();

    const heroSlideshowRoot = document.getElementById('hero-slideshow-root');
    if (heroSlideshowRoot) {
      ensureSlideshowFields(state.hero);
      heroSlideshowRoot.appendChild(buildHeroSlideshowEditor(state.hero));
    }

    document.getElementById('add-section-btn')?.addEventListener('click', function () {
      const type = document.getElementById('add-section-type')?.value || 'text';
      const section = defaultSection(type);
      state.page.sections.push(section);
      state.collapsedSections.delete(section.id);
      renderSections();
      markSectionDirty(section.id);
    });

    document.getElementById('editor-save-btn')?.addEventListener('click', function () {
      savePage();
    });

    ['hero-tagline', 'hero-background-image', 'page-hero-eyebrow', 'page-hero-heading', 'page-hero-lead', 'page-in-menu', 'page-visible', 'page-download-pdf', 'service-title', 'service-nav-label', 'service-href', 'service-tag', 'service-description', 'service-in-menu', 'service-visible', 'service-parent-slug'].forEach(function (id) {
      const node = document.getElementById(id);
      if (!node) return;
      node.addEventListener('input', markPageMetaDirty);
      node.addEventListener('change', markPageMetaDirty);
    });

    bindPdfUpload();

    document.querySelectorAll('[data-close-modal]').forEach(function (button) {
      button.addEventListener('click', function () {
        const id = button.getAttribute('data-close-modal');
        const modal = document.getElementById(id);
        if (modal) modal.hidden = true;
      });
    });

    document.getElementById('media-upload-form')?.addEventListener('submit', function (event) {
      event.preventDefault();
      const form = event.target;
      const data = new FormData(form);
      fetch('/admin/api/media.php', { method: 'POST', body: data })
        .then(function (response) {
          return response.json().catch(function () {
            throw new Error('Upload failed — server returned an invalid response.');
          }).then(function (result) {
            if (!response.ok || !result.success) {
              throw new Error(result.message || 'Upload failed');
            }
            return result;
          });
        })
        .then(function (result) {
          state.mediaFiles = result.files || state.mediaFiles;
          renderMediaGrid();
          form.reset();
        })
        .catch(function (error) {
          alert(error.message || 'Upload failed');
        });
    });

    document.querySelectorAll('.image-picker-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        const target = document.querySelector(button.dataset.target);
        if (target) openMediaPicker(target);
      });
    });
  });
})();
