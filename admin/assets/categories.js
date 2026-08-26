(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function qs(el, selector) {
    return el ? el.querySelector(selector) : null;
  }

  function val(el, fallback) {
    return el && el.value !== undefined && el.value !== '' ? el.value : fallback;
  }

  function parseFloatVal(value, fallback) {
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num;
  }

  const adminConfig = window.NanaLeeAdmin || {};
  const TILE_PRESETS = adminConfig.tilePresets || {
    homepage: { id: 'homepage', label: 'Home page card', ratio: '16:9', aspect: 16 / 9, orientation: 'landscape', wide: false },
    portrait: { id: 'portrait', label: 'Portrait tile', ratio: '3:4', aspect: 3 / 4, orientation: 'portrait', wide: false },
    landscape: { id: 'landscape', label: 'Landscape tile', ratio: '16:9', aspect: 16 / 9, orientation: 'landscape', wide: false },
    wide: { id: 'wide', label: 'Wide tile', ratio: '2:1', aspect: 2, orientation: 'landscape', wide: true }
  };
  const GALLERY_PRESET_IDS = ['portrait', 'landscape', 'wide'];
  let saveTimer = null;
  let saveInFlight = false;
  let saveQueued = false;
  let saveAbortController = null;
  let galleryDirty = false;
  let cropEditor = null;
  let cropModalItem = null;

  ready(function () {
    initAddCategoryPanel();
    initCategoryTabSort();
    initCropModal();
    initUploadForm();
    initGalleryAdmin();
  });

  function cancelPendingGallerySave() {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveTimer = null;
    }
    saveQueued = false;
    if (saveAbortController) {
      saveAbortController.abort();
      saveAbortController = null;
    }
    saveInFlight = false;
  }

  function initCategoryTabSort() {
    const tabs = document.getElementById('category-tabs');
    const statusEl = document.getElementById('category-order-status');
    if (!tabs) return;

    let draggedTab = null;
    let dragFromHandle = false;
    let orderSaveTimer = null;

    tabs.querySelectorAll('.admin-tab--sortable').forEach(function (tab) {
      tab.setAttribute('draggable', 'false');
      const handle = tab.querySelector('.admin-tab__drag');
      if (!handle) return;
      handle.addEventListener('mousedown', function (event) {
        event.preventDefault();
        dragFromHandle = true;
        tab.setAttribute('draggable', 'true');
      });
    });

    tabs.addEventListener('dragstart', function (event) {
      const tab = event.target.closest('.admin-tab--sortable');
      if (!tab || !dragFromHandle) {
        event.preventDefault();
        return;
      }
      draggedTab = tab;
      tab.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
    });

    tabs.addEventListener('dragend', function () {
      dragFromHandle = false;
      if (draggedTab) {
        draggedTab.classList.remove('is-dragging');
        draggedTab.setAttribute('draggable', 'false');
        draggedTab = null;
      }
      tabs.querySelectorAll('.admin-tab--sortable').forEach(function (tab) {
        tab.classList.remove('is-drag-over');
      });
    });

    tabs.addEventListener('dragover', function (event) {
      event.preventDefault();
      const tab = event.target.closest('.admin-tab--sortable');
      if (!tab || !draggedTab || tab === draggedTab) return;
      tabs.querySelectorAll('.admin-tab--sortable').forEach(function (entry) {
        entry.classList.toggle('is-drag-over', entry === tab);
      });
      const rect = tab.getBoundingClientRect();
      const after = event.clientX > rect.left + rect.width / 2;
      if (after) tab.after(draggedTab);
      else tab.before(draggedTab);
      const addBtn = document.getElementById('add-category-toggle');
      if (addBtn) tabs.appendChild(addBtn);
    });

    tabs.addEventListener('drop', function (event) {
      event.preventDefault();
      queueCategoryOrderSave(statusEl);
    });

    function collectCategoryOrder() {
      return Array.from(tabs.querySelectorAll('.admin-tab--sortable')).map(function (tab) {
        return tab.getAttribute('data-category-slug') || '';
      }).filter(function (slug) {
        return slug !== '';
      });
    }

    function setOrderStatus(text, className) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = 'category-order-status' + (className ? ' ' + className : '');
      if (className === 'is-saved') {
        window.setTimeout(function () {
          if (statusEl.textContent === 'Order saved') {
            statusEl.textContent = '';
            statusEl.className = 'category-order-status';
          }
        }, 2000);
      }
    }

    function queueCategoryOrderSave(el) {
      if (orderSaveTimer) window.clearTimeout(orderSaveTimer);
      setOrderStatus('Saving order…', 'is-saving');
      orderSaveTimer = window.setTimeout(function () {
        saveCategoryOrder(el);
      }, 350);
    }

    function saveCategoryOrder(el) {
      fetch('/admin/categories.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          action: 'reorder_categories',
          csrf_token: adminConfig.csrfToken,
          order: collectCategoryOrder()
        })
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.success) {
            setOrderStatus('Order saved', 'is-saved');
          } else {
            setOrderStatus(result.data.message || 'Could not save order', 'is-error');
          }
        })
        .catch(function () {
          setOrderStatus('Could not save order', 'is-error');
        });
    }
  }

  function initUploadForm() {
    const form = document.getElementById('gallery-upload-form');
    const submitBtn = document.getElementById('gallery-upload-submit');
    if (!form || !submitBtn) return;

    form.addEventListener('submit', function () {
      cancelPendingGallerySave();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading…';
    });
  }

  function initAddCategoryPanel() {
    const toggle = document.getElementById('add-category-toggle');
    const panel = document.getElementById('add-category-panel');
    const cancel = document.getElementById('add-category-cancel');
    if (!toggle || !panel) return;

    function setOpen(open) {
      if (open) {
        panel.removeAttribute('hidden');
        panel.classList.add('is-open');
      } else {
        panel.setAttribute('hidden', 'hidden');
        panel.classList.remove('is-open');
      }
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.classList.toggle('is-active', open);
      if (open) {
        const input = panel.querySelector('input[name="new_title"]');
        if (input) input.focus();
      }
    }

    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      setOpen(panel.hasAttribute('hidden'));
    });

    if (cancel) {
      cancel.addEventListener('click', function (event) {
        event.preventDefault();
        setOpen(false);
      });
    }
  }

  function getPresetIdForItem(item) {
    if (item.classList.contains('is-homepage')) return 'homepage';
    const orientation = val(qs(item, '[data-field="orientation"]'), 'portrait');
    const wide = val(qs(item, '[data-field="wide"]'), '0') === '1';
    if (orientation === 'portrait') return 'portrait';
    if (wide) return 'wide';
    return 'landscape';
  }

  function getPreset(presetId) {
    return TILE_PRESETS[presetId] || TILE_PRESETS.landscape;
  }

  function getAspectForItem(item) {
    return getPreset(getPresetIdForItem(item)).aspect;
  }

  function aspectRatioCss(aspect) {
    if (Math.abs(aspect - (16 / 9)) < 0.01) return '16 / 9';
    if (Math.abs(aspect - 0.75) < 0.01) return '3 / 4';
    if (Math.abs(aspect - 2) < 0.01) return '2 / 1';
    return String(aspect);
  }

  function setPreviewAspect(previewEl, aspect) {
    if (!previewEl) return;
    previewEl.style.aspectRatio = aspectRatioCss(aspect);
  }

  function applyPresetToItem(item, presetId) {
    const preset = getPreset(presetId);
    const orientationField = qs(item, '[data-field="orientation"]');
    const wideField = qs(item, '[data-field="wide"]');
    const aspectRatio = qs(item, '[data-field="aspect_ratio"]');
    if (orientationField) orientationField.value = preset.orientation;
    if (wideField) wideField.value = preset.wide ? '1' : '0';
    if (aspectRatio) aspectRatio.value = String(preset.aspect);
  }

  function syncTilePresetRadios(item, presetId) {
    item.querySelectorAll('[data-tile-preset]').forEach(function (radio) {
      radio.checked = radio.value === presetId;
    });
  }

  function aspectLabel(aspect) {
    const preset = Object.keys(TILE_PRESETS).map(function (key) { return TILE_PRESETS[key]; }).find(function (entry) {
      return Math.abs(entry.aspect - aspect) < 0.01;
    });
    if (preset) return preset.ratio + ' · ' + preset.label;
    return aspect.toFixed(2) + ':1';
  }

  function readCropStateFromItem(item) {
    return {
      cropX: parseFloatVal(val(qs(item, '[data-field="crop_x"]'), '0'), 0),
      cropY: parseFloatVal(val(qs(item, '[data-field="crop_y"]'), '0'), 0),
      zoom: parseFloatVal(val(qs(item, '[data-field="crop_zoom"]'), '1'), 1),
      aspectRatio: parseFloatVal(val(qs(item, '[data-field="aspect_ratio"]'), String(getAspectForItem(item))), getAspectForItem(item))
    };
  }

  function writeCropStateToItem(item, state) {
    const cropX = qs(item, '[data-field="crop_x"]');
    const cropY = qs(item, '[data-field="crop_y"]');
    const cropZoom = qs(item, '[data-field="crop_zoom"]');
    const cropXMobile = qs(item, '[data-field="crop_x_mobile"]');
    const cropYMobile = qs(item, '[data-field="crop_y_mobile"]');
    const cropZoomMobile = qs(item, '[data-field="crop_zoom_mobile"]');
    const aspectRatio = qs(item, '[data-field="aspect_ratio"]');
    const croppedPixels = qs(item, '[data-field="cropped_area_pixels"]');
    if (cropX) cropX.value = String(state.cropX);
    if (cropY) cropY.value = String(state.cropY);
    if (cropZoom) cropZoom.value = String(state.zoom);
    if (cropXMobile) cropXMobile.value = String(state.cropX);
    if (cropYMobile) cropYMobile.value = String(state.cropY);
    if (cropZoomMobile) cropZoomMobile.value = String(state.zoom);
    if (aspectRatio) aspectRatio.value = String(state.aspectRatio);
    if (croppedPixels && state.croppedAreaPixels) {
      croppedPixels.value = JSON.stringify(state.croppedAreaPixels);
    }
  }

  function persistCropStateFromEditor() {
    if (!cropEditor || !cropModalItem) return;
    writeCropStateToItem(cropModalItem, cropEditor.getState());
  }

  function showCropModal(modal) {
    modal.removeAttribute('hidden');
    modal.classList.add('is-open');
    modal.style.display = 'flex';
    document.body.classList.add('crop-modal-open');
  }

  function hideCropModal(modal) {
    modal.setAttribute('hidden', 'hidden');
    modal.classList.remove('is-open');
    modal.style.display = 'none';
    document.body.classList.remove('crop-modal-open');
  }

  function initCropModal() {
    const modal = document.getElementById('crop-modal');
    if (!modal) return;

    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }

    const aspectEl = document.getElementById('crop-modal-aspect');
    const zoomInput = document.getElementById('crop-modal-zoom');
    const zoomVal = document.getElementById('crop-modal-zoom-val');
    const hint = document.getElementById('crop-modal-hint');
    const saveBtn = document.getElementById('crop-modal-save');
    const cancelBtn = document.getElementById('crop-modal-cancel');
    const resetBtn = document.getElementById('crop-modal-reset');
    const closeBtn = document.getElementById('crop-modal-close');
    const backdrop = document.getElementById('crop-modal-backdrop');
    const zoomIn = document.getElementById('crop-zoom-in');
    const zoomOut = document.getElementById('crop-zoom-out');
    const compareGrid = document.getElementById('crop-modal-compare-grid');
    const compareLabel = document.getElementById('crop-modal-compare-label');
    let editorInitialized = false;
    let activePresetId = 'landscape';

    function buildCompareTile(presetId, options) {
      options = options || {};
      const preset = getPreset(presetId);
      const isSelectable = !options.static && GALLERY_PRESET_IDS.indexOf(presetId) !== -1;
      const tile = document.createElement(isSelectable ? 'button' : 'div');
      if (isSelectable) {
        tile.type = 'button';
        tile.setAttribute('role', 'radio');
        tile.setAttribute('aria-checked', 'false');
        tile.addEventListener('click', function () {
          selectModalPreset(presetId, true);
        });
      }
      tile.className = 'crop-modal__compare-tile crop-modal__compare-tile--' + presetId;
      tile.setAttribute('data-preset-id', presetId);
      if (isSelectable) {
        tile.setAttribute('aria-label', preset.label + ', ' + preset.ratio);
      }
      tile.innerHTML =
        '<div class="crop-modal__compare-frame ice-preview-frame">' +
          '<img alt="" draggable="false">' +
        '</div>' +
        '<span class="crop-modal__compare-label">' + preset.label + ' · ' + preset.ratio + '</span>';
      return tile;
    }

    function buildGalleryCompareGrid() {
      if (!compareGrid) return;
      compareGrid.innerHTML = '';
      compareGrid.setAttribute('role', 'radiogroup');
      compareGrid.setAttribute('aria-label', 'Gallery tile size');
      compareGrid.appendChild(buildCompareTile('portrait'));
      compareGrid.appendChild(buildCompareTile('landscape'));
      compareGrid.appendChild(buildCompareTile('wide'));
    }

    function buildHomepageCompareGrid() {
      if (!compareGrid) return;
      compareGrid.innerHTML = '';
      compareGrid.removeAttribute('role');
      compareGrid.removeAttribute('aria-label');
      const tile = buildCompareTile('homepage', { static: true });
      tile.classList.add('is-selected');
      compareGrid.appendChild(tile);
      const note = document.createElement('p');
      note.className = 'admin-help crop-modal__compare-note';
      note.textContent = 'Home page cards always use a 16:9 layout in the What we do grid.';
      compareGrid.appendChild(note);
    }

    function updateCompareSelection(presetId) {
      activePresetId = presetId;
      if (!compareGrid) return;
      compareGrid.querySelectorAll('.crop-modal__compare-tile').forEach(function (tile) {
        const isActive = tile.getAttribute('data-preset-id') === presetId;
        tile.classList.toggle('is-selected', isActive);
        if (tile.getAttribute('role') === 'radio') {
          tile.setAttribute('aria-checked', isActive ? 'true' : 'false');
        }
      });
    }

    function renderComparePreviews() {
      if (!cropEditor || !compareGrid) return;
      compareGrid.querySelectorAll('.crop-modal__compare-tile').forEach(function (tile) {
        const presetId = tile.getAttribute('data-preset-id');
        const preset = getPreset(presetId);
        const frame = tile.querySelector('.crop-modal__compare-frame');
        if (frame && preset) cropEditor.renderPreviewAt(frame, preset.aspect);
      });
    }

    function setCompareMode(isHomepage, presetId) {
      if (compareLabel) {
        compareLabel.textContent = isHomepage ? 'Home page preview' : 'Choose tile size';
      }
      if (isHomepage) {
        buildHomepageCompareGrid();
      } else {
        buildGalleryCompareGrid();
        updateCompareSelection(presetId || activePresetId);
      }
      renderComparePreviews();
    }

    function setModalPresetControls(item) {
      if (item.classList.contains('is-homepage')) {
        activePresetId = 'homepage';
        return;
      }
      updateCompareSelection(getPresetIdForItem(item));
    }

    function selectModalPreset(presetId, resetCrop) {
      if (!cropModalItem || cropModalItem.classList.contains('is-homepage')) return;
      if (GALLERY_PRESET_IDS.indexOf(presetId) === -1) return;
      applyPresetToItem(cropModalItem, presetId);
      syncTilePresetRadios(cropModalItem, presetId);
      updateCompareSelection(presetId);

      const aspect = getPreset(presetId).aspect;
      if (aspectEl) aspectEl.textContent = 'Crop frame: ' + aspectLabel(aspect);

      if (!cropEditor) return;
      cropEditor.setAspect(aspect);
      if (resetCrop) cropEditor.reset();
      cropEditor.layout();
      renderComparePreviews();
    }

    function updateZoomUi(zoom) {
      if (zoomInput) zoomInput.value = String(zoom);
      if (zoomVal) zoomVal.textContent = Math.round(zoom * 100) + '%';
    }

    function closeCropModal() {
      hideCropModal(modal);
      cropModalItem = null;
    }

    function ensureCropEditor() {
      if (editorInitialized && cropEditor) return true;

      const editorRoot = document.getElementById('crop-editor-root');
      if (!window.ImageCropEditor) {
        window.alert('The image focus editor did not load. Please hard-refresh this page (Ctrl+F5) and try again.');
        return false;
      }
      if (!editorRoot) {
        window.alert('The focus editor panel is missing from this page. Please contact support or re-upload the site update.');
        return false;
      }

      cropEditor = window.ImageCropEditor.create(editorRoot, {
        minZoom: 1,
        maxZoom: 3,
        onChange: function (state) {
          if (zoomInput) zoomInput.value = String(state.zoom);
          if (zoomVal) zoomVal.textContent = Math.round(state.zoom * 100) + '%';
          renderComparePreviews();
        }
      });
      editorInitialized = true;
      return true;
    }

    function openCropModal(item) {
      if (!ensureCropEditor()) return;

      const thumb = qs(item, '.gallery-admin-item__thumb');
      const src = item.getAttribute('data-src') || (thumb ? thumb.getAttribute('src') : '');
      if (!src) return;

      const aspect = getAspectForItem(item);
      const isHomepage = item.classList.contains('is-homepage');
      const presetId = getPresetIdForItem(item);
      cropModalItem = item;

      if (hint) {
        hint.textContent = isHomepage
          ? 'Home page card crop. Drag the image or zoom — the frame matches the website layout.'
          : 'Gallery crop. Drag the image or zoom — the frame matches how this image appears on the category page.';
      }
      if (aspectEl) aspectEl.textContent = 'Crop frame: ' + aspectLabel(aspect);
      setModalPresetControls(item);
      setCompareMode(isHomepage, presetId);

      showCropModal(modal);
      cropEditor.setAspect(aspect);
      cropEditor.loadImage(src).then(function () {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            const saved = readCropStateFromItem(item);
            cropEditor.layout();
            cropEditor.setState(saved);
            updateZoomUi(saved.zoom);
            renderComparePreviews();
            const focusTarget = modal.querySelector('.ice-container');
            if (focusTarget) focusTarget.focus();
          });
        });
      }).catch(function () {
        window.alert('Could not load this image for editing. Please try again.');
        closeCropModal();
      });
    }

    if (zoomInput) {
      zoomInput.addEventListener('input', function () {
        if (!cropEditor) return;
        cropEditor.setZoom(parseFloatVal(zoomInput.value, 1));
        renderComparePreviews();
      });
    }
    if (zoomIn) zoomIn.addEventListener('click', function () {
      if (cropEditor) {
        cropEditor.nudgeZoom(0.1);
        renderComparePreviews();
      }
    });
    if (zoomOut) zoomOut.addEventListener('click', function () {
      if (cropEditor) {
        cropEditor.nudgeZoom(-0.1);
        renderComparePreviews();
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!cropEditor) return;
        cropEditor.reset();
        renderComparePreviews();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (!cropEditor || !cropModalItem) return;
        if (!cropModalItem.classList.contains('is-homepage')) {
          selectModalPreset(activePresetId, false);
        }
        persistCropStateFromEditor();
        galleryDirty = true;
        closeCropModal();
        queueGallerySave(document.getElementById('gallery-save-status'));
      });
    }

    if (cancelBtn) cancelBtn.addEventListener('click', closeCropModal);
    if (closeBtn) closeBtn.addEventListener('click', closeCropModal);
    if (backdrop) backdrop.addEventListener('click', closeCropModal);

    document.addEventListener('keydown', function (event) {
      if (!modal.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeCropModal();
    });

    modal.addEventListener('wheel', function (event) {
      if (!modal.classList.contains('is-open')) return;
      const editor = modal.querySelector('.ice-container');
      if (!editor || !editor.contains(event.target)) {
        event.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('resize', function () {
      if (!modal.classList.contains('is-open') || !cropEditor) return;
      cropEditor.layout();
      renderComparePreviews();
    });

    window.NanaLeeCrop = {
      open: openCropModal
    };
  }

  function syncHomepageUi(form) {
    const checked = form.querySelector('input[name="homepage_image"]:checked');
    const homepageFile = checked ? checked.value : '';
    form.querySelectorAll('.gallery-admin-item').forEach(function (item) {
      const fileField = qs(item, '[data-field="file"]');
      const file = fileField ? fileField.value : '';
      const isHome = homepageFile !== '' && file === homepageFile;
      item.classList.toggle('is-homepage', isHome);

      let badge = item.querySelector('.gallery-admin-item__badge');
      if (isHome && !badge) {
        badge = document.createElement('span');
        badge.className = 'gallery-admin-item__badge';
        badge.textContent = 'Homepage';
        const wrap = qs(item, '.gallery-admin-item__thumb-wrap');
        if (wrap) wrap.appendChild(badge);
      }
      if (badge) badge.hidden = !isHome;

      const aspectRatio = qs(item, '[data-field="aspect_ratio"]');
      if (aspectRatio) aspectRatio.value = String(getAspectForItem(item));
      if (isHome) {
        const orientation = qs(item, '[data-field="orientation"]');
        if (orientation) orientation.value = 'landscape';
      }
    });
  }

  function initGalleryAdmin() {
    const form = document.getElementById('gallery-form');
    const list = document.getElementById('gallery-admin-list');
    const status = document.getElementById('gallery-save-status');
    if (!form || !list) return;

    syncHomepageUi(form);

    form.addEventListener('input', function (event) {
      if (event.target.getAttribute('data-autosave') !== null) {
        if (event.target.name === 'homepage_image') syncHomepageUi(form);
        markGalleryDirty(status);
      }
    });

    form.addEventListener('change', function (event) {
      if (event.target.getAttribute('data-tile-preset') !== null) {
        const item = event.target.closest('.gallery-admin-item');
        if (item) {
          applyPresetToItem(item, event.target.value);
          markGalleryDirty(status);
        }
        return;
      }
      if (event.target.getAttribute('data-autosave') !== null) {
        if (event.target.name === 'homepage_image') syncHomepageUi(form);
        markGalleryDirty(status);
      }
    });

    form.addEventListener('click', function (event) {
      const focusBtn = event.target.closest('.gallery-admin-item__focus');
      if (focusBtn) {
        event.preventDefault();
        event.stopPropagation();
        if (window.NanaLeeCrop && typeof window.NanaLeeCrop.open === 'function') {
          window.NanaLeeCrop.open(focusBtn.closest('.gallery-admin-item'));
        } else {
          window.alert('Image focus editor is not available. Please hard-refresh this page (Ctrl+F5).');
        }
        return;
      }

      const removeBtn = event.target.closest('.gallery-admin-item__remove');
      if (!removeBtn) return;
      event.preventDefault();
      const item = removeBtn.closest('.gallery-admin-item');
      if (item && window.confirm('Remove this image from the gallery?')) {
        const wasHomepage = item.classList.contains('is-homepage');
        item.remove();
        reindexGalleryItems(list);
        if (wasHomepage) {
          const firstRadio = form.querySelector('input[name="homepage_image"]');
          if (firstRadio) firstRadio.checked = true;
        }
        syncHomepageUi(form);
        updateEmptyNote();
        markGalleryDirty(status);
        saveGallery(status);
      }
    });

    let draggedItem = null;
    let dragFromHandle = false;

    list.querySelectorAll('.gallery-admin-item').forEach(function (item) {
      item.setAttribute('draggable', 'false');
      const handle = item.querySelector('.gallery-admin-item__drag');
      if (!handle) return;
      handle.addEventListener('mousedown', function () {
        dragFromHandle = true;
        item.setAttribute('draggable', 'true');
      });
    });

    list.addEventListener('dragstart', function (event) {
      const item = event.target.closest('.gallery-admin-item');
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
      list.querySelectorAll('.gallery-admin-item').forEach(function (item) {
        item.classList.remove('is-drag-over');
      });
    });

    list.addEventListener('dragover', function (event) {
      event.preventDefault();
      const target = event.target.closest('.gallery-admin-item');
      if (!target || !draggedItem || target === draggedItem) return;
      list.querySelectorAll('.gallery-admin-item').forEach(function (item) {
        item.classList.toggle('is-drag-over', item === target);
      });
      const rect = target.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      if (after) target.after(draggedItem);
      else target.before(draggedItem);
    });

    list.addEventListener('drop', function (event) {
      event.preventDefault();
      reindexGalleryItems(list);
      markGalleryDirty(status);
    });
  }

  function markGalleryDirty(statusEl) {
    galleryDirty = true;
    queueGallerySave(statusEl);
  }

  function reindexGalleryItems(list) {
    list.querySelectorAll('.gallery-admin-item').forEach(function (item, index) {
      item.dataset.index = String(index);
      item.querySelectorAll('[name^="items["]').forEach(function (field) {
        const key = field.getAttribute('data-field') || field.name.split('][').pop().replace(']', '');
        field.name = 'items[' + index + '][' + key + ']';
      });
    });
  }

  function updateEmptyNote() {
    const list = document.getElementById('gallery-admin-list');
    const note = document.getElementById('gallery-empty-note');
    if (!list || !note) return;
    note.hidden = list.querySelectorAll('.gallery-admin-item').length > 0;
  }

  function queueGallerySave(statusEl) {
    if (!galleryDirty) return;
    if (saveTimer) window.clearTimeout(saveTimer);
    setGalleryStatus(statusEl, 'Saving…', 'is-saving');
    saveTimer = window.setTimeout(function () {
      saveGallery(statusEl);
    }, 500);
  }

  function collectGalleryItems() {
    const list = document.getElementById('gallery-admin-list');
    const form = document.getElementById('gallery-form');
    if (!list) return [];
    const checked = form ? form.querySelector('input[name="homepage_image"]:checked') : null;
    const homepageFile = checked ? checked.value : '';
    return Array.from(list.querySelectorAll('.gallery-admin-item')).map(function (item) {
      const fileField = qs(item, '[data-field="file"]') || item.querySelector('input[name$="[file]"]');
      const file = fileField ? fileField.value : '';
      const orientationField = qs(item, '[data-field="orientation"]');
      const orientation = orientationField ? orientationField.value : 'landscape';
      const visibleField = item.querySelector('[name$="[visible]"]');
      const wideField = qs(item, '[data-field="wide"]');
      return {
        file: file,
        alt: val(item.querySelector('[name$="[alt]"]'), ''),
        caption: val(item.querySelector('[name$="[caption]"]'), ''),
        visible: visibleField ? visibleField.checked : false,
        is_homepage: file !== '' && file === homepageFile,
        crop_x: val(qs(item, '[data-field="crop_x"]'), '0'),
        crop_y: val(qs(item, '[data-field="crop_y"]'), '0'),
        crop_zoom: val(qs(item, '[data-field="crop_zoom"]'), '1'),
        crop_x_mobile: val(qs(item, '[data-field="crop_x_mobile"]'), val(qs(item, '[data-field="crop_x"]'), '0')),
        crop_y_mobile: val(qs(item, '[data-field="crop_y_mobile"]'), val(qs(item, '[data-field="crop_y"]'), '0')),
        crop_zoom_mobile: val(qs(item, '[data-field="crop_zoom_mobile"]'), val(qs(item, '[data-field="crop_zoom"]'), '1')),
        aspect_ratio: val(qs(item, '[data-field="aspect_ratio"]'), String(getAspectForItem(item))),
        cropped_area_pixels: val(qs(item, '[data-field="cropped_area_pixels"]'), ''),
        orientation: orientation,
        wide: wideField ? wideField.value === '1' : false
      };
    }).filter(function (entry) {
      return entry.file !== '';
    });
  }

  function saveGallery(statusEl) {
    if (saveInFlight) {
      saveQueued = true;
      return;
    }
    saveInFlight = true;
    saveAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const form = document.getElementById('gallery-form');
    const checked = form ? form.querySelector('input[name="homepage_image"]:checked') : null;
    const homepageFile = checked ? checked.value : '';

    fetch('/admin/categories.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: saveAbortController ? saveAbortController.signal : undefined,
      body: JSON.stringify({
        action: 'save_gallery',
        csrf_token: adminConfig.csrfToken,
        category_slug: adminConfig.categorySlug,
        homepage_image: homepageFile,
        items: collectGalleryItems()
      })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.success) {
          galleryDirty = false;
          setGalleryStatus(statusEl, 'Saved', 'is-saved');
        } else {
          setGalleryStatus(statusEl, result.data.message || 'Save failed', 'is-error');
        }
      })
      .catch(function (error) {
        if (error && error.name === 'AbortError') return;
        setGalleryStatus(statusEl, 'Save failed — check connection', 'is-error');
      })
      .finally(function () {
        saveInFlight = false;
        saveAbortController = null;
        if (saveQueued) {
          saveQueued = false;
          queueGallerySave(statusEl);
        }
      });
  }

  function setGalleryStatus(el, text, className) {
    if (!el) return;
    el.textContent = text;
    el.className = 'gallery-save-status ' + className;
    if (className === 'is-saved') {
      window.setTimeout(function () {
        if (el.textContent === 'Saved') {
          el.textContent = '';
          el.className = 'gallery-save-status';
        }
      }, 2000);
    }
  }
})();
