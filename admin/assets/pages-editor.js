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
    sectionSavedSnapshots: {},
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
      });
    }
    if (type === 'layout') {
      return Object.assign(base, { min_height: 480, blocks: [] });
    }
    if (type === 'service_tiles') {
      return Object.assign(base, { tiles: [] });
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
      return count ? count + ' service tile' + (count === 1 ? '' : 's') : 'No tiles yet';
    }
    if (section.type === 'layout') {
      const count = (section.blocks || []).length;
      return count ? count + ' layout block' + (count === 1 ? '' : 's') : 'Empty layout';
    }
    if (section.type === 'image') {
      return section.caption || section.image?.file || 'Full-width image';
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
    updateAllSaveButtons();
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
    updateGlobalSaveUi();
  }

  function markSectionDirty(sectionId) {
    if (!sectionId) return;
    updateSectionSaveUi(sectionId);
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
      body.appendChild(
        buildImageFields('image', section.image || {}, section.image?.aspect_ratio || 16 / 9, {
          presetIds: ['wide', 'landscape', 'square'],
          onChange: function () {
            markSectionDirty(section.id);
          },
        })
      );
      body.appendChild(fieldInput('Caption (optional)', 'caption', section.caption || ''));
    }

    if (section.type === 'service_tiles') {
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

  function buildImageFields(prefix, image, aspect, options) {
    options = options || {};
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

    if (image.file) {
      const preview = el('div', 'image-field-preview');
      preview.innerHTML =
        '<div class="image-field-preview__frame" style="aspect-ratio:' +
        currentAspect +
        '"><img src="' +
        escapeHtml(imageUrl(image.file)) +
        '" alt=""></div>';
      wrap.appendChild(preview);
    }

    wrap.querySelector('[data-action="pick-image"]').addEventListener('click', function () {
      openMediaPicker(wrap.querySelector('[data-image-field="file"]'));
    });
    wrap.querySelector('[data-action="crop-image"]').addEventListener('click', function () {
      if (!image.file) {
        window.alert('Choose an image first.');
        return;
      }
      state.cropTarget = {
        wrap: wrap,
        image: image,
        aspect: currentAspect,
        presetIds: options.presetIds || CROP_PRESET_IDS,
      };
      openCropModal(image, currentAspect, options.presetIds, function () {
        if (typeof options.onChange === 'function') options.onChange();
      });
    });

    wrap.querySelectorAll('[data-image-field]').forEach(function (input) {
      input.addEventListener('input', function () {
        image[input.dataset.imageField] = input.value;
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
        };
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

    ['hero-tagline', 'hero-background-image', 'page-hero-eyebrow', 'page-hero-heading', 'page-hero-lead', 'service-title', 'service-nav-label', 'service-href', 'service-tag', 'service-description', 'service-in-menu', 'service-visible', 'service-parent-slug'].forEach(function (id) {
      const node = document.getElementById(id);
      if (!node) return;
      node.addEventListener('input', markPageMetaDirty);
      node.addEventListener('change', markPageMetaDirty);
    });

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
