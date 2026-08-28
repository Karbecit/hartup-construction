(function (global) {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function parseAngle(value) {
    const match = String(value == null ? '' : value)
      .trim()
      .match(/^(-?\d+(?:\.\d+)?)\s*(deg)?$/i);
    if (!match) return 0;
    return parseFloat(match[1]);
  }

  function formatAngle(deg) {
    const n = Math.round((Number(deg) || 0) * 100) / 100;
    return n + 'deg';
  }

  function wrapAngle(deg) {
    let n = Number(deg) || 0;
    while (n > 360) n -= 360;
    while (n < -360) n += 360;
    return Math.round(n * 100) / 100;
  }

  const RICH_TEXT_ALLOWED_TAGS = new Set(['SPAN', 'H2', 'H3', 'P', 'BR', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'DIV', 'SUP', 'SUB']);
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
        if (el.tagName === 'B' || el.tagName === 'I') {
          const replacement = doc.createElement(el.tagName === 'B' ? 'strong' : 'em');
          while (el.firstChild) replacement.appendChild(el.firstChild);
          el.replaceWith(replacement);
          cleanNode(replacement);
          return;
        }
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
        try {
          editor.focus();
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(savedRange);
          return true;
        } catch (err) {
          savedRange = null;
          return false;
        }
      },
    };
  }

  function createEditorHistory(editor) {
    const undo = [];
    const redo = [];
    let current = editor.innerHTML;
    let typingTimer = null;
    let ignoreInput = false;

    function pushUndo(html) {
      if (html === (undo.length ? undo[undo.length - 1] : null)) return;
      undo.push(html);
      if (undo.length > 80) undo.shift();
      redo.length = 0;
    }

    return {
      beforeChange: function () {
        if (typingTimer) {
          clearTimeout(typingTimer);
          typingTimer = null;
        }
        ignoreInput = true;
        pushUndo(current);
        current = editor.innerHTML;
      },
      afterChange: function () {
        current = editor.innerHTML;
        ignoreInput = false;
      },
      recordTyping: function () {
        if (ignoreInput) return;
        const html = editor.innerHTML;
        if (html === current) return;
        if (!typingTimer) pushUndo(current);
        current = html;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(function () {
          typingTimer = null;
        }, 400);
      },
      undo: function () {
        if (typingTimer) {
          clearTimeout(typingTimer);
          typingTimer = null;
        }
        if (!undo.length) return false;
        ignoreInput = true;
        redo.push(editor.innerHTML);
        current = undo.pop();
        editor.innerHTML = current;
        ignoreInput = false;
        return true;
      },
      redo: function () {
        if (typingTimer) {
          clearTimeout(typingTimer);
          typingTimer = null;
        }
        if (!redo.length) return false;
        ignoreInput = true;
        undo.push(editor.innerHTML);
        current = redo.pop();
        editor.innerHTML = current;
        ignoreInput = false;
        return true;
      },
    };
  }

  function placeCursorIn(el, atStart) {
    if (!el) return;
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(!!atStart);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCursorAtEditorEnd(editor) {
    let el = editor.lastElementChild;
    if (!el) return;
    if (el.tagName === 'UL' || el.tagName === 'OL') el = el.lastElementChild || el;
    placeCursorIn(el);
  }

  function stripClasses(el, classes) {
    classes.forEach(function (cls) {
      el.classList.remove(cls);
    });
  }

  function textSizeFromBlock(el) {
    const match = TEXT_SIZE_CLASSES.find(function (cls) {
      return el.classList && el.classList.contains(cls);
    });
    return match ? match.replace('cms-text--', '') : 'normal';
  }

  function getListItemTextSize(li) {
    return textSizeFromBlock(li);
  }

  function createListItem(textSize) {
    const li = document.createElement('li');
    li.className = 'cms-body cms-text--' + (textSize || 'normal');
    li.innerHTML = '<br>';
    return li;
  }

  function isEmptyBlock(el) {
    if (!el) return true;
    return !String(el.textContent || '')
      .replace(/\u00a0/g, ' ')
      .trim();
  }

  function unwrapInnerBlocks(el) {
    if (!el) return;
    const nested = el.querySelectorAll('h2, h3, p, ul, ol, div, span.cms-eyebrow, span.cms-heading, span.cms-body');
    nested.forEach(function (inner) {
      if (inner === el || !inner.parentNode) return;
      while (inner.firstChild) {
        inner.parentNode.insertBefore(inner.firstChild, inner);
      }
      inner.remove();
    });
  }

  function cleanupEmptyLists(editor) {
    editor.querySelectorAll('ul, ol').forEach(function (list) {
      if (!list.children.length) list.remove();
    });
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

  function rangeIntersectsNode(range, node) {
    try {
      const nodeRange = document.createRange();
      nodeRange.selectNode(node);
      return (
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 &&
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
      );
    } catch (err) {
      return false;
    }
  }

  function getBlocksInSelection(editor) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return [];
    const range = sel.getRangeAt(0);
    const blocks = [];

    Array.prototype.forEach.call(editor.children, function (child) {
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        Array.prototype.forEach.call(child.children, function (li) {
          if (li.tagName === 'LI' && rangeIntersectsNode(range, li)) blocks.push(li);
        });
        return;
      }
      if (rangeIntersectsNode(range, child)) blocks.push(child);
    });

    if (!blocks.length) {
      const fallback = getEditableBlock(range.startContainer, editor);
      if (fallback && fallback.tagName !== 'UL' && fallback.tagName !== 'OL') blocks.push(fallback);
    }
    return blocks;
  }

  function replaceListItemWithBlock(li, factory) {
    const list = li.parentElement;
    const html = li.innerHTML;
    const newEl = factory();
    newEl.innerHTML = isEmptyBlock(li) ? '<br>' : html;
    unwrapInnerBlocks(newEl);

    if (!list || (list.tagName !== 'UL' && list.tagName !== 'OL')) {
      li.replaceWith(newEl);
      return newEl;
    }

    const prev = li.previousElementSibling;
    let next = li.nextElementSibling;
    li.remove();

    if (!list.children.length) {
      list.replaceWith(newEl);
      return newEl;
    }
    if (!prev) {
      list.before(newEl);
      return newEl;
    }
    if (!next) {
      list.after(newEl);
      return newEl;
    }

    const rest = document.createElement(list.tagName);
    rest.className = list.className;
    while (next) {
      const following = next.nextElementSibling;
      rest.appendChild(next);
      next = following;
    }
    list.after(newEl);
    newEl.after(rest);
    return newEl;
  }

  function applyStyleConfigToElement(el, config) {
    unwrapInnerBlocks(el);

    if (el.tagName === 'LI') {
      return replaceListItemWithBlock(el, function () {
        const node = document.createElement(config.tag);
        node.className = config.classes;
        return node;
      });
    }

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
      stripClasses(el, HEADING_SIZE_CLASSES);
      el.classList.add('cms-body', config.sizeClass);
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

  function applyRichTextStyle(editor, config, selectionStore, history) {
    if (history) history.beforeChange();
    selectionStore.restore();
    editor.focus();

    let blocks = getBlocksInSelection(editor);
    if (!blocks.length) {
      const el = document.createElement(config.tag);
      el.className = config.classes;
      el.innerHTML = '<br>';
      editor.appendChild(el);
      placeCursorIn(el);
      if (history) history.afterChange();
      selectionStore.save();
      return;
    }

    let last = null;
    blocks.forEach(function (block) {
      last = applyStyleConfigToElement(block, config);
    });
    cleanupEmptyLists(editor);
    if (last) placeCursorIn(last);
    if (history) history.afterChange();
    selectionStore.save();
  }

  function applyRichTextWeight(editor, weight, selectionStore, history) {
    selectionStore.restore();
    editor.focus();
    const blocks = getBlocksInSelection(editor);
    if (!blocks.length) return;

    if (history) history.beforeChange();
    blocks.forEach(function (block) {
      stripClasses(block, WEIGHT_CLASSES);
      block.classList.add('cms-weight--' + weight);
    });
    if (history) history.afterChange();
    selectionStore.save();
  }

  function insertBulletList(editor, selectionStore, history) {
    if (history) history.beforeChange();
    selectionStore.restore();
    editor.focus();

    const blocks = getBlocksInSelection(editor);
    if (!blocks.length) {
      const ul = document.createElement('ul');
      ul.className = 'cms-styled-text__list';
      ul.appendChild(createListItem('normal'));
      editor.appendChild(ul);
      placeCursorIn(ul.querySelector('li'), true);
      if (history) history.afterChange();
      selectionStore.save();
      return;
    }

    if (
      blocks.every(function (block) {
        return block.tagName === 'LI';
      })
    ) {
      let last = null;
      blocks.slice().forEach(function (li) {
        const size = getListItemTextSize(li);
        last = replaceListItemWithBlock(li, function () {
          const p = document.createElement('p');
          p.className = 'cms-body cms-text--' + size;
          return p;
        });
      });
      cleanupEmptyLists(editor);
      if (last) placeCursorIn(last);
      if (history) history.afterChange();
      selectionStore.save();
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'cms-styled-text__list';
    blocks.forEach(function (block) {
      const li =
        block.tagName === 'LI'
          ? block.cloneNode(true)
          : createListItem(textSizeFromBlock(block));
      if (block.tagName !== 'LI') {
        li.innerHTML = isEmptyBlock(block) ? '<br>' : block.innerHTML;
        unwrapInnerBlocks(li);
      }
      ul.appendChild(li);
    });
    const first = blocks[0];
    if (first.tagName === 'LI') {
      const list = first.closest('ul, ol');
      if (list) list.after(ul);
      else first.replaceWith(ul);
    } else {
      first.replaceWith(ul);
    }
    blocks.forEach(function (block) {
      if (block.parentElement) block.remove();
    });
    cleanupEmptyLists(editor);
    placeCursorIn(ul.querySelector('li'));
    if (history) history.afterChange();
    selectionStore.save();
  }

  function closestTag(node, editor, tagName) {
    while (node && node !== editor) {
      if (node.nodeType === 1 && node.tagName === tagName) return node;
      node = node.parentElement;
    }
    return null;
  }

  function unwrapElement(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    el.remove();
  }

  function toggleSuperscript(editor, selectionStore, history) {
    if (history) history.beforeChange();
    selectionStore.restore();
    editor.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const existing = closestTag(range.commonAncestorContainer, editor, 'SUP');
    if (existing) {
      unwrapElement(existing);
      if (history) history.afterChange();
      selectionStore.save();
      return;
    }

    if (range.collapsed) {
      const sup = document.createElement('sup');
      sup.textContent = '2';
      range.insertNode(sup);
      placeCursorIn(sup);
      sel.collapseToEnd();
      if (history) history.afterChange();
      selectionStore.save();
      return;
    }

    const sup = document.createElement('sup');
    try {
      range.surroundContents(sup);
    } catch (err) {
      const text = range.toString();
      range.deleteContents();
      sup.textContent = text;
      range.insertNode(sup);
    }
    placeCursorIn(sup);
    sel.collapseToEnd();
    if (history) history.afterChange();
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
      '<select class="rich-text-toolbar__select" data-rich-action="weight" title="Text weight">' +
      '<option value="">Weight…</option>' +
      '<option value="normal">Normal</option>' +
      '<option value="semibold">Semi-bold</option>' +
      '<option value="bold">Bold</option>' +
      '</select>' +
      '<button type="button" class="admin-btn admin-btn--ghost admin-btn--xs" data-rich-action="bullets" title="Turn the current line into a tick list, or back into a paragraph">✓ Bullets</button>' +
      '<button type="button" class="admin-btn admin-btn--ghost admin-btn--xs" data-rich-action="superscript" title="Superscript — select a 2 for squared">x²</button>' +
      '</div>' +
      '<div class="rich-text-editor cms-styled-text" contenteditable="true" spellcheck="true"></div>' +
      '</div>' +
      '<p class="admin-help rich-text-editor__hint">Click in a line, then pick a style to replace it. ✓ Bullets toggles a tick list on or off. Press Enter for another bullet, or Enter on an empty bullet to start a normal paragraph. Ctrl+Z undoes the last change.</p>';

    const editor = container.querySelector('.rich-text-editor');
    const selectionStore = createSelectionStore(editor);
    editor.innerHTML = initialHtml || defaultTextBlockContent();
    Array.prototype.forEach.call(editor.children, unwrapInnerBlocks);
    const history = createEditorHistory(editor);

    editor.addEventListener('keyup', function () {
      selectionStore.save();
    });
    editor.addEventListener('mouseup', function () {
      selectionStore.save();
    });
    editor.addEventListener('input', function () {
      history.recordTyping();
    });
    editor.addEventListener('keydown', function (event) {
      const key = event.key;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && !event.altKey && key.toLowerCase() === 'z') {
        event.preventDefault();
        const restored = event.shiftKey ? history.redo() : history.undo();
        if (restored) placeCursorAtEditorEnd(editor);
        selectionStore.save();
        return;
      }
      if (modifier && !event.altKey && key.toLowerCase() === 'y') {
        event.preventDefault();
        if (history.redo()) placeCursorAtEditorEnd(editor);
        selectionStore.save();
        return;
      }
      if (key !== 'Enter' || event.shiftKey) return;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const block = getEditableBlock(sel.anchorNode, editor);
      if (!block || block.tagName !== 'LI') return;
      event.preventDefault();
      history.beforeChange();
      if (isEmptyBlock(block)) {
        const p = replaceListItemWithBlock(block, function () {
          const para = document.createElement('p');
          para.className = 'cms-body cms-text--normal';
          return para;
        });
        cleanupEmptyLists(editor);
        placeCursorIn(p, true);
      } else {
        const newLi = createListItem(getListItemTextSize(block));
        block.after(newLi);
        placeCursorIn(newLi, true);
      }
      history.afterChange();
      selectionStore.save();
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
      applyRichTextStyle(editor, RICH_TEXT_STYLES.eyebrow, selectionStore, history);
    });

    container.querySelector('[data-rich-action="heading"]').addEventListener('change', function (event) {
      const key = event.target.value;
      if (key && RICH_TEXT_STYLES[key]) applyRichTextStyle(editor, RICH_TEXT_STYLES[key], selectionStore, history);
      event.target.value = '';
    });

    container.querySelector('[data-rich-action="body"]').addEventListener('change', function (event) {
      const key = event.target.value;
      if (key && RICH_TEXT_STYLES[key]) applyRichTextStyle(editor, RICH_TEXT_STYLES[key], selectionStore, history);
      event.target.value = '';
    });

    container.querySelector('[data-rich-action="weight"]').addEventListener('change', function (event) {
      if (event.target.value) applyRichTextWeight(editor, event.target.value, selectionStore, history);
      event.target.value = '';
    });

    container.querySelector('[data-rich-action="bullets"]').addEventListener('click', function () {
      insertBulletList(editor, selectionStore, history);
    });

    container.querySelector('[data-rich-action="superscript"]').addEventListener('click', function () {
      toggleSuperscript(editor, selectionStore, history);
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
      '<p class="admin-help layout-editor-toolbar__hint">Drag to move, corner to resize, top handle to rotate. Click the cog for exact size and angle. Click <strong>Edit</strong> to change content.</p>';

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

    const settingsIcon =
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.04 7.04 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.8 8.48a.5.5 0 0 0 .12.64L4.95 10.7c-.04.31-.06.63-.06.94s.02.63.06.94L2.92 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.7.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.27.11.56.02.7-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>';

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
        rotate: 0,
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
        rotate: 0,
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
        const heightPx = block.height_px || ((block.h / 100) * canvasHeight);
        const topPx = (block.y / 100) * canvasHeight;
        maxBottom = Math.max(maxBottom, topPx + heightPx);
      });
      return Math.max(280, Math.ceil(maxBottom));
    }

    function preserveBlockPixelSizes(oldHeight, newHeight) {
      if (Math.abs(oldHeight - newHeight) < 0.5) return;
      section.blocks.forEach(function (block) {
        const topPx = (block.y / 100) * oldHeight;
        const heightPx = block.height_px || ((block.h / 100) * oldHeight);
        block.y = (topPx / newHeight) * 100;
        block.h = (heightPx / newHeight) * 100;
        if (block.height_px) block.h = (block.height_px / newHeight) * 100;
        block.y = clamp(block.y, 0, Math.max(0, 100 - block.h));
      });
    }

    function hasExactWidth(block) {
      return Number(block.width_px) > 0;
    }

    function hasExactHeight(block) {
      return Number(block.height_px) > 0;
    }

    function canvasSize() {
      const rect = canvas.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height || section.min_height || 0,
      };
    }

    function blockPixelSize(block) {
      const size = canvasSize();
      const width = hasExactWidth(block)
        ? block.width_px
        : size.width > 0
          ? Math.max(20, Math.round((block.w / 100) * size.width))
          : '';
      const height = hasExactHeight(block)
        ? block.height_px
        : size.height > 0
          ? Math.max(20, Math.round((block.h / 100) * size.height))
          : '';
      return { width: width, height: height };
    }

    function setBlockSizePx(block, widthPx, heightPx) {
      const size = canvasSize();
      if (size.width < 40 || size.height < 40) return;
      if (widthPx != null) {
        block.width_px = Math.max(20, Math.round(widthPx));
        block.w = (block.width_px / size.width) * 100;
      }
      if (heightPx != null) {
        block.height_px = Math.max(20, Math.round(heightPx));
        block.h = (block.height_px / size.height) * 100;
      }
    }

    function applyBlockGeometry(node, block) {
      node.style.left = block.x + '%';
      node.style.top = block.y + '%';
      node.style.width = hasExactWidth(block) ? block.width_px + 'px' : block.w + '%';
      node.style.height = hasExactHeight(block) ? block.height_px + 'px' : block.h + '%';
      const visual = node.querySelector('.layout-editor-block__visual');
      if (visual) {
        const rotate = wrapAngle(block.rotate || 0);
        visual.style.transform = rotate ? 'rotate(' + rotate + 'deg)' : '';
      }
      if (typeof global.applyCropView === 'function') {
        node.querySelectorAll('.image-crop-view').forEach(global.applyCropView);
      }
      const px = blockPixelSize(block);
      const widthInput = node.querySelector('[data-extra="width-px"]');
      const heightInput = node.querySelector('[data-extra="height-px"]');
      const angleInput = node.querySelector('[data-extra="angle"]');
      if (widthInput && document.activeElement !== widthInput) widthInput.value = px.width === '' ? '' : String(px.width);
      if (heightInput && document.activeElement !== heightInput) heightInput.value = px.height === '' ? '' : String(px.height);
      if (angleInput && document.activeElement !== angleInput) angleInput.value = formatAngle(block.rotate || 0);
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

    function renderTextPreview(block) {
      const html = legacyTextBlockToHtml(block);
      return html || '<p class="layout-preview__placeholder">Empty text — click Edit</p>';
    }

    function renderImagePreview(block) {
      block.image = block.image || {};
      if (!block.image.file) {
        return '<div class="layout-preview__placeholder layout-preview__placeholder--image">No image — click Edit</div>';
      }
      return (
        '<div class="layout-preview__image image-crop-view" data-crop-x="' +
        (block.image.crop_x || 0) +
        '" data-crop-y="' +
        (block.image.crop_y || 0) +
        '" data-crop-zoom="' +
        (block.image.crop_zoom || 1) +
        '" data-aspect="0"><img src="' +
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
        body.innerHTML = '';
        const form = document.createElement('div');
        form.className = 'admin-form layout-block-modal-form';
        if (typeof api.buildImageFields === 'function') {
          form.appendChild(
            api.buildImageFields('image', draft.image, draft.image.aspect_ratio || 4 / 3, {
              presetIds: ['square', 'landscape', 'wide'],
              onChange: function () {},
            })
          );
        }
        body.appendChild(form);
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

      document.getElementById('layout-block-modal-save').onclick = function () {
        if (block.type === 'text' && textEditor) {
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

    function extraSettingsHtml(block) {
      const px = blockPixelSize(block);
      return (
        '<div class="layout-editor-block__extras" hidden>' +
        '<p class="layout-editor-block__extras-title">Size &amp; angle</p>' +
        '<label class="layout-editor-block__extras-field"><span>W</span>' +
        '<input type="number" min="20" max="4000" step="1" data-extra="width-px" value="' +
        (px.width === '' ? '' : px.width) +
        '"><span>px</span></label>' +
        '<label class="layout-editor-block__extras-field"><span>H</span>' +
        '<input type="number" min="20" max="4000" step="1" data-extra="height-px" value="' +
        (px.height === '' ? '' : px.height) +
        '"><span>px</span></label>' +
        '<label class="layout-editor-block__extras-field"><span>Angle</span>' +
        '<input type="text" data-extra="angle" spellcheck="false" value="' +
        api.escapeHtml(formatAngle(block.rotate || 0)) +
        '"></label>' +
        '<p class="layout-editor-block__extras-hint">0° upright · −45° anti-clockwise</p>' +
        '</div>'
      );
    }

    function closeAllSettings(exceptNode) {
      canvas.querySelectorAll('.layout-editor-block').forEach(function (blockNode) {
        if (exceptNode && blockNode === exceptNode) return;
        const panel = blockNode.querySelector('.layout-editor-block__extras');
        const button = blockNode.querySelector('[data-action="toggle-settings"]');
        if (panel) {
          panel.hidden = true;
          panel.classList.remove('is-open');
        }
        if (button) button.setAttribute('aria-expanded', 'false');
      });
    }

    function bindExtraSettings(node, block) {
      const widthInput = node.querySelector('[data-extra="width-px"]');
      const heightInput = node.querySelector('[data-extra="height-px"]');
      const angleInput = node.querySelector('[data-extra="angle"]');

      function commitSize() {
        const widthVal = widthInput ? parseInt(widthInput.value, 10) : NaN;
        const heightVal = heightInput ? parseInt(heightInput.value, 10) : NaN;
        setBlockSizePx(
          block,
          Number.isFinite(widthVal) ? widthVal : null,
          Number.isFinite(heightVal) ? heightVal : null
        );
        applyBlockGeometry(node, block);
        notifyChange();
      }

      function commitAngle() {
        if (!angleInput) return;
        block.rotate = wrapAngle(parseAngle(angleInput.value));
        angleInput.value = formatAngle(block.rotate);
        applyBlockGeometry(node, block);
        notifyChange();
      }

      if (widthInput) {
        widthInput.addEventListener('change', commitSize);
        widthInput.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitSize();
            widthInput.blur();
          }
        });
      }
      if (heightInput) {
        heightInput.addEventListener('change', commitSize);
        heightInput.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitSize();
            heightInput.blur();
          }
        });
      }
      if (angleInput) {
        angleInput.addEventListener('change', commitAngle);
        angleInput.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitAngle();
            angleInput.blur();
          }
        });
      }

      const extrasPanel = node.querySelector('.layout-editor-block__extras');
      if (extrasPanel) {
        extrasPanel.addEventListener('mousedown', function (event) {
          event.stopPropagation();
        });
      }
    }

    function buildBlockNode(block, index) {
      const node = document.createElement('div');
      node.className = 'layout-editor-block layout-editor-block--' + block.type + ' layout-editor-block--preview';
      node.dataset.blockIndex = String(index);

      const rotateHandle = document.createElement('button');
      rotateHandle.type = 'button';
      rotateHandle.className = 'layout-editor-block__rotate';
      rotateHandle.title = 'Drag to rotate';
      rotateHandle.setAttribute('aria-label', 'Rotate');

      const chrome = document.createElement('div');
      chrome.className = 'layout-editor-block__chrome';
      chrome.innerHTML =
        '<span class="layout-editor-block__drag" title="Drag to move">⋮⋮</span>' +
        '<span class="layout-editor-block__label">' +
        (block.type === 'image' ? 'Image' : 'Text') +
        '</span>' +
        '<button type="button" class="layout-editor-block__edit" data-action="edit-block">Edit</button>' +
        '<button type="button" class="layout-editor-block__settings" data-action="toggle-settings" aria-label="Size and angle" aria-expanded="false" title="Size and angle">' +
        settingsIcon +
        '</button>' +
        '<button type="button" class="layout-editor-block__remove" data-action="remove-block" aria-label="Remove">×</button>';

      const extras = document.createElement('div');
      extras.innerHTML = extraSettingsHtml(block);

      const visual = document.createElement('div');
      visual.className = 'layout-editor-block__visual';

      const preview = document.createElement('div');
      preview.className =
        'layout-editor-block__preview' + (block.type === 'image' ? ' layout-editor-block__preview--image' : '');
      preview.innerHTML = block.type === 'image' ? renderImagePreview(block) : renderTextPreview(block);
      visual.appendChild(preview);

      const resize = document.createElement('span');
      resize.className = 'layout-editor-block__resize';
      resize.title = 'Drag to resize';

      node.appendChild(rotateHandle);
      node.appendChild(chrome);
      if (extras.firstElementChild) node.appendChild(extras.firstElementChild);
      node.appendChild(visual);
      node.appendChild(resize);

      applyBlockGeometry(node, block);
      bindExtraSettings(node, block);

      chrome.querySelector('[data-action="edit-block"]').addEventListener('click', function (event) {
        event.stopPropagation();
        closeAllSettings();
        openEditModal(block, index);
      });

      chrome.querySelector('[data-action="toggle-settings"]').addEventListener('click', function (event) {
        event.stopPropagation();
        const extrasPanel = node.querySelector('.layout-editor-block__extras');
        if (!extrasPanel) return;
        const willOpen = extrasPanel.hidden;
        closeAllSettings(willOpen ? node : null);
        extrasPanel.hidden = !willOpen;
        extrasPanel.classList.toggle('is-open', willOpen);
        this.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (willOpen) applyBlockGeometry(node, block);
      });

      chrome.querySelector('[data-action="remove-block"]').addEventListener('click', function (event) {
        event.stopPropagation();
        if (window.confirm('Remove this block from the layout?')) {
          section.blocks.splice(index, 1);
          renderBlocks();
          notifyChange();
        }
      });

      setupDrag(chrome.querySelector('.layout-editor-block__drag'), block, canvas, node, applyBlockGeometry, notifyChange);
      setupResize(resize, block, canvas, node, setBlockSizePx, applyBlockGeometry, notifyChange);
      setupRotate(rotateHandle, block, node, applyBlockGeometry, notifyChange);

      return node;
    }

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () {
        section.blocks.forEach(function (block, index) {
          const node = canvas.querySelector('[data-block-index="' + index + '"]');
          if (node) applyBlockGeometry(node, block);
        });
      }).observe(canvas);
    }

    canvasWrap.addEventListener('mousedown', function (event) {
      if (event.target.closest('.layout-editor-block__extras') || event.target.closest('[data-action="toggle-settings"]')) {
        return;
      }
      closeAllSettings();
    });

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

  function setupDrag(handle, block, canvas, node, applyGeometry, onDone) {
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
        const widthPct = Number(block.width_px) > 0 ? (block.width_px / rect.width) * 100 : block.w;
        const heightPct = Number(block.height_px) > 0 ? (block.height_px / rect.height) * 100 : block.h;
        block.x = clamp(origX + dx, 0, Math.max(0, 100 - widthPct));
        block.y = clamp(origY + dy, 0, Math.max(0, 100 - heightPct));
        applyGeometry(node, block);
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

  function setupResize(handle, block, canvas, node, setSizePx, applyGeometry, onDone) {
    handle.addEventListener('mousedown', function (event) {
      event.preventDefault();
      event.stopPropagation();
      const rect = canvas.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const origW = Number(block.width_px) > 0 ? block.width_px : Math.round((block.w / 100) * rect.width);
      const origH = Number(block.height_px) > 0 ? block.height_px : Math.round((block.h / 100) * rect.height);
      let moved = false;

      function onMove(ev) {
        moved = true;
        setSizePx(block, origW + (ev.clientX - startX), origH + (ev.clientY - startY));
        applyGeometry(node, block);
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

  function setupRotate(handle, block, node, applyGeometry, onDone) {
    handle.addEventListener('mousedown', function (event) {
      event.preventDefault();
      event.stopPropagation();
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const origRotate = wrapAngle(block.rotate || 0);
      const startPointer = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI + 90;
      let moved = false;

      handle.classList.add('is-dragging');
      document.body.classList.add('layout-rotating');

      function onMove(ev) {
        moved = true;
        const pointer = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
        block.rotate = wrapAngle(origRotate + (pointer - startPointer));
        applyGeometry(node, block);
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        handle.classList.remove('is-dragging');
        document.body.classList.remove('layout-rotating');
        if (moved && typeof onDone === 'function') onDone();
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  global.HartupLayoutEditor = { mount: mountLayoutEditor };
})(window);
