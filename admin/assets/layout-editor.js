(function (global) {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  const RICH_TEXT_ALLOWED_TAGS = new Set(['SPAN', 'H2', 'H3', 'P', 'BR', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'DIV']);
  const RICH_TEXT_ALLOWED_CLASS = /^cms-/;

  function defaultTextBlockContent() {
    return (
      '<h2 class="cms-heading cms-heading--lg cms-weight--semibold">Heading</h2>' +
      '<p class="cms-body cms-text--normal">Add your text here.</p>'
    );
  }

  function escapeTextContent(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function legacyTextBlockToHtml(block) {
    if (block.content && String(block.content).trim()) {
      return String(block.content);
    }

    let html = '';
    if (block.eyebrow) {
      html +=
        '<span class="cms-eyebrow cms-text--' +
        (block.eyebrow_size || 'sm') +
        '">' +
        escapeTextContent(block.eyebrow) +
        '</span>';
    }
    if (block.heading) {
      html +=
        '<h2 class="cms-heading cms-heading--' +
        (block.heading_size || 'lg') +
        ' cms-weight--' +
        (block.heading_weight || 'semibold') +
        '">' +
        escapeTextContent(block.heading) +
        '</h2>';
    }
    (block.paragraphs || []).forEach(function (paragraph) {
      html +=
        '<p class="cms-body cms-text--' +
        (block.text_size || 'normal') +
        '">' +
        escapeTextContent(paragraph) +
        '</p>';
    });
    return html;
  }

  function sanitizeRichTextHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<div>' + html + '</div>', 'text/html');
    const root = doc.body.firstElementChild;
    if (!root) return '';

    function cleanNode(node) {
      const remove = [];
      node.childNodes.forEach(function (child) {
        if (child.nodeType !== 1) return;
        const el = child;
        if (!RICH_TEXT_ALLOWED_TAGS.has(el.tagName)) {
          while (el.firstChild) {
            el.parentNode.insertBefore(el.firstChild, el);
          }
          remove.push(el);
          return;
        }
        Array.prototype.slice.call(el.attributes).forEach(function (attr) {
          if (attr.name === 'class') {
            const classes = attr.value.split(/\s+/).filter(function (cls) {
              return RICH_TEXT_ALLOWED_CLASS.test(cls);
            });
            if (classes.length) el.setAttribute('class', classes.join(' '));
            else el.removeAttribute('class');
          } else {
            el.removeAttribute(attr.name);
          }
        });
        cleanNode(el);
      });
      remove.forEach(function (el) {
        el.remove();
      });
    }

    cleanNode(root);
    return root.innerHTML.trim();
  }

  const HEADING_SIZE_CLASSES = ['cms-heading--sm', 'cms-heading--md', 'cms-heading--lg', 'cms-heading--xl'];
  const TEXT_SIZE_CLASSES = ['cms-text--sm', 'cms-text--normal', 'cms-text--lg', 'cms-text--lead'];
  const WEIGHT_CLASSES = ['cms-weight--normal', 'cms-weight--semibold', 'cms-weight--bold'];

  function createSelectionStore(editor) {
    let savedRange = null;

    return {
      save: function () {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
          savedRange = range.cloneRange();
        }
      },
      restore: function () {
        if (!savedRange) return false;
        editor.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
        return true;
      },
    };
  }

  function placeCursorIn(el, atStart) {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(!!atStart);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function stripClasses(el, classes) {
    classes.forEach(function (cls) {
      el.classList.remove(cls);
    });
  }

  function getListItemTextSize(li) {
    const match = TEXT_SIZE_CLASSES.find(function (cls) {
      return li.classList.contains(cls);
    });
    return match ? match.replace('cms-text--', '') : 'normal';
  }

  function createListItem(textSize) {
    const li = document.createElement('li');
    li.className = 'cms-body cms-text--' + (textSize || 'normal');
    li.innerHTML = '<br>';
    return li;
  }

  function getEditableBlock(node, editor) {
    while (node && node !== editor) {
      if (node.nodeType !== 1) {
        node = node.parentElement;
        continue;
      }
      if (node.parentElement === editor) return node;
      if (node.tagName === 'LI') {
        const list = node.closest('ul, ol');
        if (list && list.parentElement === editor) return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function applyStyleConfigToElement(el, config) {
    if (config.kind === 'heading') {
      stripClasses(el, HEADING_SIZE_CLASSES.concat(WEIGHT_CLASSES));
      el.classList.remove('cms-body', 'cms-eyebrow');
      stripClasses(el, TEXT_SIZE_CLASSES);
      el.classList.add('cms-heading', config.sizeClass);
      if (
        !WEIGHT_CLASSES.some(function (cls) {
          return el.classList.contains(cls);
        })
      ) {
        el.classList.add('cms-weight--semibold');
      }
      if (el.tagName !== 'H2') {
        const h2 = document.createElement('h2');
        h2.className = el.className;
        h2.innerHTML = el.innerHTML;
        el.replaceWith(h2);
        return h2;
      }
      return el;
    }

    if (config.kind === 'body') {
      stripClasses(el, TEXT_SIZE_CLASSES);
      el.classList.remove('cms-heading', 'cms-eyebrow');
      stripClasses(el, HEADING_SIZE_CLASSES.concat(WEIGHT_CLASSES));
      el.classList.add('cms-body', config.sizeClass);
      if (el.tagName === 'LI') return el;
      if (el.tagName !== 'P') {
        const p = document.createElement('p');
        p.className = el.className;
        p.innerHTML = el.innerHTML;
        el.replaceWith(p);
        return p;
      }
      return el;
    }

    if (config.kind === 'eyebrow') {
      stripClasses(el, TEXT_SIZE_CLASSES);
      el.classList.remove('cms-heading', 'cms-body');
      stripClasses(el, HEADING_SIZE_CLASSES.concat(WEIGHT_CLASSES));
      el.classList.add('cms-eyebrow', 'cms-text--sm');
      if (el.tagName !== 'SPAN') {
        const span = document.createElement('span');
        span.className = el.className;
        span.innerHTML = el.innerHTML;
        el.replaceWith(span);
        return span;
      }
      return el;
    }

    return el;
  }

  function applyRichTextStyle(editor, config, selectionStore) {
    selectionStore.restore();
    editor.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);

    if (!range.collapsed) {
      const wrapper = document.createElement(config.tag);
      wrapper.className = config.classes;
      try {
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
      } catch (err) {
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
      }
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(wrapper);
      sel.addRange(newRange);
      selectionStore.save();
      return;
    }

    let block = getEditableBlock(range.startContainer, editor);
    if (!block) {
      const el = document.createElement(config.tag);
      el.className = config.classes;
      el.innerHTML = '<br>';
      editor.appendChild(el);
      placeCursorIn(el);
      selectionStore.save();
      return;
    }

    const updated = applyStyleConfigToElement(block, config);
    placeCursorIn(updated);
    selectionStore.save();
  }

  function applyRichTextWeight(editor, weight, selectionStore) {
    selectionStore.restore();
    editor.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    let node = sel.anchorNode;
    if (node.nodeType === 3) node = node.parentElement;
    while (node && node !== editor) {
      if (node.nodeType === 1 && node.classList.contains('cms-heading')) {
        stripClasses(node, WEIGHT_CLASSES);
        node.classList.add('cms-weight--' + weight);
        selectionStore.save();
        return;
      }
      node = node.parentElement;
    }
  }

  function insertBulletList(editor, selectionStore) {
    selectionStore.restore();
    editor.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    let block = getEditableBlock(range.startContainer, editor);

    if (block && block.tagName === 'LI') {
      const newLi = createListItem(getListItemTextSize(block));
      block.after(newLi);
      placeCursorIn(newLi);
      selectionStore.save();
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'cms-styled-text__list';

    if (!range.collapsed) {
      const text = range.toString();
      range.deleteContents();
      text
        .split(/\n+/)
        .map(function (line) {
          return line.trim();
        })
        .filter(Boolean)
        .forEach(function (line) {
          const li = createListItem('normal');
          li.textContent = line;
          ul.appendChild(li);
        });
    }

    if (!ul.children.length) {
      const li = createListItem('normal');
      if (block && block.tagName !== 'UL' && block.textContent.trim()) {
        li.textContent = block.textContent.trim();
      }
      ul.appendChild(li);
    }

    if (block && block.tagName !== 'UL') {
      block.replaceWith(ul);
    } else if (!ul.parentElement) {
      range.insertNode(ul);
    }

    placeCursorIn(ul.querySelector('li'));
    selectionStore.save();
  }

  const RICH_TEXT_STYLES = {
    eyebrow: { kind: 'eyebrow', tag: 'span', classes: 'cms-eyebrow cms-text--sm', sizeClass: 'cms-text--sm' },
    heading_sm: {
      kind: 'heading',
      tag: 'h2',
      classes: 'cms-heading cms-heading--sm cms-weight--semibold',
      sizeClass: 'cms-heading--sm',
    },
    heading_md: {
      kind: 'heading',
      tag: 'h2',
      classes: 'cms-heading cms-heading--md cms-weight--semibold',
      sizeClass: 'cms-heading--md',
    },
    heading_lg: {
      kind: 'heading',
      tag: 'h2',
      classes: 'cms-heading cms-heading--lg cms-weight--semibold',
      sizeClass: 'cms-heading--lg',
    },
    heading_xl: {
      kind: 'heading',
      tag: 'h2',
      classes: 'cms-heading cms-heading--xl cms-weight--semibold',
      sizeClass: 'cms-heading--xl',
    },
    body_sm: { kind: 'body', tag: 'p', classes: 'cms-body cms-text--sm', sizeClass: 'cms-text--sm' },
    body_normal: { kind: 'body', tag: 'p', classes: 'cms-body cms-text--normal', sizeClass: 'cms-text--normal' },
    body_lg: { kind: 'body', tag: 'p', classes: 'cms-body cms-text--lg', sizeClass: 'cms-text--lg' },
    body_lead: { kind: 'body', tag: 'p', classes: 'cms-body cms-text--lead', sizeClass: 'cms-text--lead' },
  };

  function mountRichTextEditor(container, initialHtml) {
    container.innerHTML =
      '<div class="rich-text-editor-wrap">' +
      '<div class="rich-text-toolbar" role="toolbar">' +
      '<span class="rich-text-toolbar__label">Apply to selection</span>' +
      '<button type="button" class="admin-btn admin-btn--ghost admin-btn--xs" data-rich-action="eyebrow">Eyebrow</button>' +
      '<select class="rich-text-toolbar__select" data-rich-action="heading" title="Heading size">' +
      '<option value="">Heading…</option>' +
      '<option value="heading_sm">Small</option>' +
      '<option value="heading_md">Medium</option>' +
      '<option value="heading_lg">Large</option>' +
      '<option value="heading_xl">Extra large</option>' +
      '</select>' +
      '<select class="rich-text-toolbar__select" data-rich-action="body" title="Body text size">' +
      '<option value="">Body…</option>' +
      '<option value="body_sm">Small</option>' +
      '<option value="body_normal">Normal</option>' +
      '<option value="body_lg">Large</option>' +
      '<option value="body_lead">Lead</option>' +
      '</select>' +
      '<select class="rich-text-toolbar__select" data-rich-action="weight" title="Heading weight">' +
      '<option value="">Weight…</option>' +
      '<option value="normal">Normal</option>' +
      '<option value="semibold">Semi-bold</option>' +
      '<option value="bold">Bold</option>' +
      '</select>' +
      '<button type="button" class="admin-btn admin-btn--ghost admin-btn--xs" data-rich-action="bullets">✓ Bullets</button>' +
      '</div>' +
      '<div class="rich-text-editor cms-styled-text" contenteditable="true" spellcheck="true"></div>' +
      '</div>' +
      '<p class="admin-help rich-text-editor__hint">Click in the text, then pick a style. Use ✓ Bullets for tick lists — press Enter to add another item.</p>';

    const editor = container.querySelector('.rich-text-editor');
    const selectionStore = createSelectionStore(editor);
    editor.innerHTML = initialHtml || defaultTextBlockContent();

    editor.addEventListener('keyup', function () {
      selectionStore.save();
    });
    editor.addEventListener('mouseup', function () {
      selectionStore.save();
    });
    editor.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' || event.shiftKey) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const li = getEditableBlock(sel.anchorNode, editor);
      if (li && li.tagName === 'LI') {
        event.preventDefault();
        const newLi = createListItem(getListItemTextSize(li));
        li.after(newLi);
        placeCursorIn(newLi);
        selectionStore.save();
      }
    });

    const toolbar = container.querySelector('.rich-text-toolbar');
    toolbar.addEventListener('mousedown', function (event) {
      selectionStore.save();
      if (event.target.tagName !== 'SELECT' && event.target.tagName !== 'OPTION') {
        event.preventDefault();
      }
    });
    toolbar.querySelectorAll('select').forEach(function (select) {
      select.addEventListener('focus', function () {
        selectionStore.save();
      });
    });

    container.querySelector('[data-rich-action="eyebrow"]').addEventListener('click', function () {
      applyRichTextStyle(editor, RICH_TEXT_STYLES.eyebrow, selectionStore);
    });

    container.querySelector('[data-rich-action="heading"]').addEventListener('change', function (event) {
      const key = event.target.value;
      if (key && RICH_TEXT_STYLES[key]) applyRichTextStyle(editor, RICH_TEXT_STYLES[key], selectionStore);
      event.target.value = '';
    });

    container.querySelector('[data-rich-action="body"]').addEventListener('change', function (event) {
      const key = event.target.value;
      if (key && RICH_TEXT_STYLES[key]) applyRichTextStyle(editor, RICH_TEXT_STYLES[key], selectionStore);
      event.target.value = '';
    });

    container.querySelector('[data-rich-action="weight"]').addEventListener('change', function (event) {
      if (event.target.value) applyRichTextWeight(editor, event.target.value, selectionStore);
      event.target.value = '';
    });

    container.querySelector('[data-rich-action="bullets"]').addEventListener('click', function () {
      insertBulletList(editor, selectionStore);
    });

    return {
      getContent: function () {
        return sanitizeRichTextHtml(editor.innerHTML);
      },
    };
  }

  function mountLayoutEditor(section, wrap, api) {
    wrap.innerHTML = '';
    section.blocks = section.blocks || [];
    section.min_height = section.min_height || 480;

    const toolbar = document.createElement('div');
    toolbar.className = 'layout-editor-toolbar';
    toolbar.innerHTML =
      '<div class="layout-editor-toolbar__actions">' +
      '<button type="button" class="admin-btn admin-btn--ghost" data-action="add-text">+ Text</button>' +
      '<button type="button" class="admin-btn admin-btn--ghost" data-action="add-image">+ Image</button>' +
      '</div>' +
      '<p class="admin-help layout-editor-toolbar__hint">Drag blocks to move, corner to resize. Drag the canvas bottom edge to change height. Click <strong>Edit</strong> to change content.</p>';

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'layout-editor-canvas-wrap';

    const canvas = document.createElement('div');
    canvas.className = 'layout-editor-canvas';

    const canvasResize = document.createElement('div');
    canvasResize.className = 'layout-editor-canvas__resize';
    canvasResize.title = 'Drag to adjust canvas height';
    canvasResize.innerHTML =
      '<span class="layout-editor-canvas__resize-grip" aria-hidden="true">↕</span>' +
      '<span class="layout-editor-canvas__height-label"></span>';

    const heightLabel = canvasResize.querySelector('.layout-editor-canvas__height-label');

    canvasWrap.appendChild(canvas);
    canvasWrap.appendChild(canvasResize);

    wrap.appendChild(toolbar);
    wrap.appendChild(canvasWrap);

    let notifyChange = function () {
      if (typeof api.onChange === 'function') api.onChange();
    };

    toolbar.querySelector('[data-action="add-text"]').addEventListener('click', function () {
      section.blocks.push({
        id: 'blk_' + Math.random().toString(16).slice(2, 10),
        type: 'text',
        x: 6,
        y: 8,
        w: 38,
        h: 34,
        content: defaultTextBlockContent(),
      });
      renderBlocks();
      notifyChange();
    });

    toolbar.querySelector('[data-action="add-image"]').addEventListener('click', function () {
      section.blocks.push({
        id: 'blk_' + Math.random().toString(16).slice(2, 10),
        type: 'image',
        x: 52,
        y: 8,
        w: 40,
        h: 45,
        image: { file: '', alt: '', crop_x: 0, crop_y: 0, crop_zoom: 1, aspect_ratio: 4 / 3 },
      });
      renderBlocks();
      notifyChange();
    });

    function renderBlocks() {
      canvas.innerHTML = '';
      section.blocks.forEach(function (block, index) {
        canvas.appendChild(buildBlockNode(block, index));
      });
      applyCropPreviews(canvas);
    }

    function getCanvasPixelHeight() {
      return canvas.getBoundingClientRect().height || section.min_height;
    }

    function minCanvasHeightForBlocks(canvasHeight) {
      if (!section.blocks.length) return 280;
      let maxBottom = 0;
      section.blocks.forEach(function (block) {
        const bottom = ((block.y + block.h) / 100) * canvasHeight;
        maxBottom = Math.max(maxBottom, bottom);
      });
      return Math.max(280, Math.ceil(maxBottom));
    }

    function preserveBlockPixelSizes(oldHeight, newHeight) {
      if (Math.abs(oldHeight - newHeight) < 0.5) return;
      section.blocks.forEach(function (block) {
        const topPx = (block.y / 100) * oldHeight;
        const heightPx = (block.h / 100) * oldHeight;
        block.y = (topPx / newHeight) * 100;
        block.h = (heightPx / newHeight) * 100;
        block.y = clamp(block.y, 0, 100 - block.h);
      });
    }

    function updateHeightInputMin() {
      return minCanvasHeightForBlocks(getCanvasPixelHeight());
    }

    function setCanvasHeight(value, silent) {
      const oldHeight = getCanvasPixelHeight();
      const minH = minCanvasHeightForBlocks(oldHeight);
      let newHeight = clamp(parseInt(String(value), 10) || 480, minH, 1200);

      preserveBlockPixelSizes(oldHeight, newHeight);

      section.min_height = newHeight;
      canvas.style.minHeight = newHeight + 'px';
      if (heightLabel) heightLabel.textContent = newHeight + 'px';
      if (Math.abs(oldHeight - newHeight) >= 0.5) renderBlocks();
      if (!silent && typeof api.onChange === 'function') api.onChange();
    }

    setCanvasHeight(section.min_height, true);

    notifyChange = function () {
      updateHeightInputMin();
      if (typeof api.onChange === 'function') api.onChange();
    };

    setupCanvasHeightDrag(canvasResize, canvas, setCanvasHeight, notifyChange);

    function applyCropPreviews(root) {
      if (typeof global.applyCropView === 'function') {
        root.querySelectorAll('.image-crop-view').forEach(global.applyCropView);
      } else if (global.initCropViews) {
        global.initCropViews();
      }
    }

    function applyBlockGeometry(node, block) {
      node.style.left = block.x + '%';
      node.style.top = block.y + '%';
      node.style.width = block.w + '%';
      node.style.height = block.h + '%';
    }

    function renderTextPreview(block) {
      const html = legacyTextBlockToHtml(block);
      return html || '<p class="layout-preview__placeholder">Empty text — click Edit</p>';
    }

    function renderImagePreview(block) {
      block.image = block.image || {};
      if (!block.image.file) {
        return '<div class="layout-preview__placeholder layout-preview__placeholder--image">No image — click Edit</div>';
      }
      const aspect = block.image.aspect_ratio || 4 / 3;
      return (
        '<div class="layout-preview__image image-crop-view" data-crop-x="' +
        (block.image.crop_x || 0) +
        '" data-crop-y="' +
        (block.image.crop_y || 0) +
        '" data-crop-zoom="' +
        (block.image.crop_zoom || 1) +
        '" data-aspect="' +
        aspect +
        '"><img src="' +
        api.escapeHtml(api.imageUrl(block.image.file)) +
        '" alt="' +
        api.escapeHtml(block.image.alt || '') +
        '"></div>'
      );
    }

    function openEditModal(block, index) {
      const modal = document.getElementById('layout-block-modal');
      const body = document.getElementById('layout-block-modal-body');
      const title = document.getElementById('layout-block-modal-title');
      if (!modal || !body) return;

      const draft = JSON.parse(JSON.stringify(block));

      if (block.type === 'image') {
        title.textContent = 'Edit image block';
        draft.image = draft.image || {};
        body.innerHTML =
          '<div class="admin-form layout-block-modal-form">' +
          '<input type="hidden" id="layout-block-file" value="' +
          api.escapeHtml(draft.image.file || '') +
          '">' +
          '<label>Image file<div class="image-field-row">' +
          '<input type="text" id="layout-block-file-display" value="' +
          api.escapeHtml(draft.image.file || '') +
          '" readonly></div></label>' +
          '<div class="layout-editor-block__actions">' +
          '<button type="button" class="admin-btn admin-btn--ghost" id="layout-block-pick">Choose image</button>' +
          '<button type="button" class="admin-btn admin-btn--ghost" id="layout-block-crop">Pan / zoom</button>' +
          '</div>' +
          '<label>Alt text<input type="text" id="layout-block-alt" value="' +
          api.escapeHtml(draft.image.alt || '') +
          '"></label>' +
          (draft.image.file
            ? '<img class="layout-block-modal-preview" id="layout-block-preview" src="' +
              api.escapeHtml(api.imageUrl(draft.image.file)) +
              '" alt="">'
            : '') +
          '</div>';
      } else {
        title.textContent = 'Edit text block';
        body.innerHTML = '<div class="admin-form layout-block-modal-form" id="layout-block-text-editor-root"></div>';
      }

      modal.hidden = false;

      let textEditor = null;
      if (block.type === 'text') {
        textEditor = mountRichTextEditor(
          document.getElementById('layout-block-text-editor-root'),
          legacyTextBlockToHtml(draft)
        );
      }

      function closeModal() {
        modal.hidden = true;
        body.innerHTML = '';
      }

      function updateImagePreview() {
        const preview = document.getElementById('layout-block-preview');
        if (!preview || !draft.image.file) return;
        preview.src = api.imageUrl(draft.image.file);
        preview.hidden = false;
      }

      if (block.type === 'image') {
        const fileInput = document.getElementById('layout-block-file');
        const fileDisplay = document.getElementById('layout-block-file-display');
        document.getElementById('layout-block-pick').addEventListener('click', function () {
          api.openMediaPicker(fileInput, function () {
            draft.image.file = fileInput.value;
            fileDisplay.value = fileInput.value;
            if (!document.getElementById('layout-block-preview') && draft.image.file) {
              const img = document.createElement('img');
              img.className = 'layout-block-modal-preview';
              img.id = 'layout-block-preview';
              img.src = api.imageUrl(draft.image.file);
              body.querySelector('.layout-block-modal-form').appendChild(img);
            } else {
              updateImagePreview();
            }
          });
        });
        document.getElementById('layout-block-crop').addEventListener('click', function () {
          if (!draft.image.file) {
            window.alert('Choose an image first.');
            return;
          }
          api.openCropModal(draft.image, draft.image.aspect_ratio || 4 / 3, ['square', 'landscape', 'wide'], function () {
            updateImagePreview();
          });
        });
        document.getElementById('layout-block-alt').addEventListener('input', function (event) {
          draft.image.alt = event.target.value;
        });
      }

      document.getElementById('layout-block-modal-save').onclick = function () {
        if (block.type === 'image') {
          draft.image.alt = document.getElementById('layout-block-alt').value;
          draft.image.file = document.getElementById('layout-block-file').value;
        } else if (textEditor) {
          draft.content = textEditor.getContent();
          delete draft.eyebrow;
          delete draft.heading;
          delete draft.paragraphs;
          delete draft.heading_size;
          delete draft.heading_weight;
          delete draft.text_size;
          delete draft.eyebrow_size;
        }
        Object.assign(block, draft);
        if (block.type === 'text') {
          delete block.eyebrow;
          delete block.heading;
          delete block.paragraphs;
          delete block.heading_size;
          delete block.heading_weight;
          delete block.text_size;
          delete block.eyebrow_size;
        }
        closeModal();
        renderBlocks();
        notifyChange();
      };

      document.getElementById('layout-block-modal-cancel').onclick = closeModal;
      modal.querySelector('[data-close-modal="layout-block-modal"]').onclick = closeModal;
    }

    function buildBlockNode(block, index) {
      const node = document.createElement('div');
      node.className = 'layout-editor-block layout-editor-block--' + block.type + ' layout-editor-block--preview';
      node.dataset.blockIndex = String(index);
      applyBlockGeometry(node, block);

      const chrome = document.createElement('div');
      chrome.className = 'layout-editor-block__chrome';
      chrome.innerHTML =
        '<span class="layout-editor-block__drag" title="Drag to move">⋮⋮</span>' +
        '<span class="layout-editor-block__label">' +
        (block.type === 'image' ? 'Image' : 'Text') +
        '</span>' +
        '<button type="button" class="layout-editor-block__edit" data-action="edit-block">Edit</button>' +
        '<button type="button" class="layout-editor-block__remove" data-action="remove-block" aria-label="Remove">×</button>';

      const preview = document.createElement('div');
      preview.className = 'layout-editor-block__preview';
      preview.innerHTML = block.type === 'image' ? renderImagePreview(block) : renderTextPreview(block);

      const resize = document.createElement('span');
      resize.className = 'layout-editor-block__resize';
      resize.title = 'Drag to resize';

      node.appendChild(chrome);
      node.appendChild(preview);
      node.appendChild(resize);

      chrome.querySelector('[data-action="edit-block"]').addEventListener('click', function (event) {
        event.stopPropagation();
        openEditModal(block, index);
      });

      chrome.querySelector('[data-action="remove-block"]').addEventListener('click', function (event) {
        event.stopPropagation();
        if (window.confirm('Remove this block from the layout?')) {
          section.blocks.splice(index, 1);
          renderBlocks();
          notifyChange();
        }
      });

      setupDrag(chrome.querySelector('.layout-editor-block__drag'), block, canvas, node, notifyChange);
      setupResize(resize, block, canvas, node, notifyChange);

      return node;
    }

    renderBlocks();
  }

  function setupCanvasHeightDrag(handle, canvas, setCanvasHeight, onDone) {
    handle.addEventListener('mousedown', function (event) {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = canvas.getBoundingClientRect().height;
      let moved = false;

      handle.classList.add('is-dragging');
      document.body.classList.add('layout-canvas-resizing');

      function onMove(ev) {
        moved = true;
        const nextHeight = Math.round(startHeight + (ev.clientY - startY));
        setCanvasHeight(nextHeight, true);
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        handle.classList.remove('is-dragging');
        document.body.classList.remove('layout-canvas-resizing');
        if (moved && typeof onDone === 'function') onDone();
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function setupDrag(handle, block, canvas, node, onDone) {
    handle.addEventListener('mousedown', function (event) {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const origX = block.x;
      const origY = block.y;
      let moved = false;

      function onMove(ev) {
        moved = true;
        const dx = ((ev.clientX - startX) / rect.width) * 100;
        const dy = ((ev.clientY - startY) / rect.height) * 100;
        block.x = clamp(origX + dx, 0, 100 - block.w);
        block.y = clamp(origY + dy, 0, 100 - block.h);
        node.style.left = block.x + '%';
        node.style.top = block.y + '%';
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (moved && typeof onDone === 'function') onDone();
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function setupResize(handle, block, canvas, node, onDone) {
    handle.addEventListener('mousedown', function (event) {
      event.preventDefault();
      event.stopPropagation();
      const rect = canvas.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const origW = block.w;
      const origH = block.h;
      let moved = false;

      function onMove(ev) {
        moved = true;
        const dw = ((ev.clientX - startX) / rect.width) * 100;
        const dh = ((ev.clientY - startY) / rect.height) * 100;
        block.w = clamp(origW + dw, 12, 100 - block.x);
        block.h = clamp(origH + dh, 12, 100 - block.y);
        node.style.width = block.w + '%';
        node.style.height = block.h + '%';
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (moved && typeof onDone === 'function') onDone();
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  global.HartupLayoutEditor = { mount: mountLayoutEditor };
})(window);
