(function (global) {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getCoverScale(mediaSize, cropSize) {
    return Math.max(cropSize.width / mediaSize.width, cropSize.height / mediaSize.height);
  }

  function getMediaDimensions(mediaSize, cropSize, zoom) {
    const baseScale = getCoverScale(mediaSize, cropSize);
    return {
      width: mediaSize.width * baseScale * zoom,
      height: mediaSize.height * baseScale * zoom
    };
  }

  function getMaxOffsets(mediaSize, cropSize, zoom) {
    const dims = getMediaDimensions(mediaSize, cropSize, zoom);
    return {
      x: Math.max(0, (dims.width - cropSize.width) / 2),
      y: Math.max(0, (dims.height - cropSize.height) / 2)
    };
  }

  function restrictPosition(position, mediaSize, cropSize, zoom) {
    const max = getMaxOffsets(mediaSize, cropSize, zoom);
    return {
      x: clamp(position.x, -max.x, max.x),
      y: clamp(position.y, -max.y, max.y)
    };
  }

  function getMediaPosition(crop, mediaSize, cropSize, zoom) {
    const dims = getMediaDimensions(mediaSize, cropSize, zoom);
    return {
      left: cropSize.width / 2 - dims.width / 2 + crop.x,
      top: cropSize.height / 2 - dims.height / 2 + crop.y,
      width: dims.width,
      height: dims.height
    };
  }

  function computeCroppedAreaPixels(crop, mediaSize, cropSize, zoom) {
    const baseScale = getCoverScale(mediaSize, cropSize);
    const scale = baseScale * zoom;
    const dims = getMediaDimensions(mediaSize, cropSize, zoom);
    const mediaLeft = cropSize.width / 2 - dims.width / 2 + crop.x;
    const mediaTop = cropSize.height / 2 - dims.height / 2 + crop.y;
    const x = clamp((0 - mediaLeft) / scale, 0, mediaSize.width);
    const y = clamp((0 - mediaTop) / scale, 0, mediaSize.height);
    const width = clamp(cropSize.width / scale, 0, mediaSize.width - x);
    const height = clamp(cropSize.height / scale, 0, mediaSize.height - y);
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  function normalizeCrop(crop, mediaSize, cropSize, zoom) {
    const max = getMaxOffsets(mediaSize, cropSize, zoom);
    return {
      x: max.x > 0 ? crop.x / max.x : 0,
      y: max.y > 0 ? crop.y / max.y : 0,
      zoom: zoom
    };
  }

  function denormalizeCrop(normalized, mediaSize, cropSize, zoom) {
    const max = getMaxOffsets(mediaSize, cropSize, zoom);
    return restrictPosition({
      x: normalized.x * max.x,
      y: normalized.y * max.y
    }, mediaSize, cropSize, zoom);
  }

  function legacyToCrop(focusX, focusY, focusZoom) {
    return {
      x: clamp(((focusX - 50) / 50) * 0.85, -1, 1),
      y: clamp(((focusY - 50) / 50) * 0.85, -1, 1),
      zoom: clamp((focusZoom || 100) / 100, 1, 3)
    };
  }

  function ImageCropEditor(root, options) {
    this.root = root;
    this.options = options || {};
    this.aspect = this.options.aspect || this.options.aspectRatio || 16 / 9;
    this.minZoom = this.options.minZoom || 1;
    this.maxZoom = this.options.maxZoom || 3;
    this.mediaSize = { width: 0, height: 0 };
    this.cropSize = { width: 0, height: 0 };
    this.stageSize = { width: 0, height: 0 };
    this.crop = { x: 0, y: 0 };
    this.zoom = 1;
    this.dragging = false;
    this.dragStart = null;
    this.pinchStart = null;
    this.ready = false;
    this.boundResize = this.layout.bind(this);
    this.boundMove = this.onPointerMove.bind(this);
    this.boundUp = this.onPointerUp.bind(this);
    this.boundWheel = this.onWheel.bind(this);
    this.boundDown = this.onPointerDown.bind(this);

    this.build();
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('orientationchange', this.boundResize);
  }

  ImageCropEditor.prototype.build = function () {
    this.root.innerHTML =
      '<div class="ice-stage">' +
        '<div class="ice-container" tabindex="0" aria-label="Drag image to reposition">' +
          '<img class="ice-media" alt="" draggable="false">' +
        '</div>' +
        '<div class="ice-shades" aria-hidden="true">' +
          '<div class="ice-shade ice-shade--top"></div>' +
          '<div class="ice-shade ice-shade--right"></div>' +
          '<div class="ice-shade ice-shade--bottom"></div>' +
          '<div class="ice-shade ice-shade--left"></div>' +
        '</div>' +
        '<div class="ice-crop-window" aria-hidden="true"></div>' +
      '</div>';

    this.stageEl = this.root.querySelector('.ice-stage');
    this.containerEl = this.root.querySelector('.ice-container');
    this.cropAreaEl = this.root.querySelector('.ice-crop-window');
    this.shadeEls = {
      top: this.root.querySelector('.ice-shade--top'),
      right: this.root.querySelector('.ice-shade--right'),
      bottom: this.root.querySelector('.ice-shade--bottom'),
      left: this.root.querySelector('.ice-shade--left')
    };
    this.mediaEl = this.root.querySelector('.ice-media');
    this.image = this.mediaEl;

    this.containerEl.addEventListener('mousedown', this.boundDown);
    this.containerEl.addEventListener('touchstart', this.boundDown, { passive: false });
    this.containerEl.addEventListener('wheel', this.boundWheel, { passive: false });
    window.addEventListener('mousemove', this.boundMove);
    window.addEventListener('mouseup', this.boundUp);
    window.addEventListener('touchmove', this.boundMove, { passive: false });
    window.addEventListener('touchend', this.boundUp);
    window.addEventListener('touchcancel', this.boundUp);
  };

  ImageCropEditor.prototype.destroy = function () {
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('orientationchange', this.boundResize);
    window.removeEventListener('mousemove', this.boundMove);
    window.removeEventListener('mouseup', this.boundUp);
    window.removeEventListener('touchmove', this.boundMove);
    window.removeEventListener('touchend', this.boundUp);
    window.removeEventListener('touchcancel', this.boundUp);
    if (this.containerEl) {
      this.containerEl.removeEventListener('mousedown', this.boundDown);
      this.containerEl.removeEventListener('touchstart', this.boundDown);
      this.containerEl.removeEventListener('wheel', this.boundWheel);
    }
  };

  ImageCropEditor.prototype.getStageLimits = function () {
    const wrap = this.root.closest('.crop-modal__editor-wrap');
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      if (rect.width > 20 && rect.height > 20) {
        return {
          width: Math.floor(rect.width),
          height: Math.floor(rect.height)
        };
      }
    }

    return {
      width: Math.min(520, Math.floor(window.innerWidth * 0.46)),
      height: Math.min(340, Math.floor(window.innerHeight * 0.34))
    };
  };

  ImageCropEditor.prototype.updateShades = function (cropLeft, cropTop, cropWidth, cropHeight) {
    const stageW = this.stageSize.width;
    const stageH = this.stageSize.height;
    const cropRight = cropLeft + cropWidth;
    const cropBottom = cropTop + cropHeight;

    this.shadeEls.top.style.cssText =
      'top:0;left:0;width:100%;height:' + cropTop + 'px;';
    this.shadeEls.bottom.style.cssText =
      'top:' + cropBottom + 'px;left:0;width:100%;height:' + Math.max(0, stageH - cropBottom) + 'px;';
    this.shadeEls.left.style.cssText =
      'top:' + cropTop + 'px;left:0;width:' + cropLeft + 'px;height:' + cropHeight + 'px;';
    this.shadeEls.right.style.cssText =
      'top:' + cropTop + 'px;left:' + cropRight + 'px;width:' + Math.max(0, stageW - cropRight) + 'px;height:' + cropHeight + 'px;';
  };

  ImageCropEditor.prototype.setAspect = function (aspect) {
    this.aspect = aspect;
    this.layout();
  };

  ImageCropEditor.prototype.loadImage = function (src, state) {
    const self = this;
    this.ready = false;
    this.mediaEl.style.opacity = '0';
    return new Promise(function (resolve, reject) {
      self.image.onload = function () {
        self.mediaSize = {
          width: self.image.naturalWidth,
          height: self.image.naturalHeight
        };
        self.layout();
        if (state) {
          self.setState(state);
        }
        self.ready = true;
        self.mediaEl.style.opacity = '1';
        resolve();
      };
      self.image.onerror = reject;
      self.image.src = src;
    });
  };

  ImageCropEditor.prototype.layout = function () {
    if (!this.containerEl || !this.mediaSize.width) return;

    const limits = this.getStageLimits();
    const stageWidth = Math.max(240, limits.width);
    const stageHeight = Math.max(180, limits.height);

    let cropWidth = stageWidth;
    let cropHeight = cropWidth / this.aspect;
    if (cropHeight > stageHeight) {
      cropHeight = stageHeight;
      cropWidth = cropHeight * this.aspect;
    }

    const cropLeft = (stageWidth - cropWidth) / 2;
    const cropTop = (stageHeight - cropHeight) / 2;

    this.stageSize = { width: stageWidth, height: stageHeight };
    this.cropSize = { width: cropWidth, height: cropHeight };

    this.stageEl.style.width = stageWidth + 'px';
    this.stageEl.style.height = stageHeight + 'px';
    this.root.style.width = stageWidth + 'px';
    this.root.style.height = stageHeight + 'px';
    this.root.style.maxWidth = '100%';
    this.root.style.maxHeight = '100%';

    this.cropAreaEl.style.width = cropWidth + 'px';
    this.cropAreaEl.style.height = cropHeight + 'px';
    this.cropAreaEl.style.left = cropLeft + 'px';
    this.cropAreaEl.style.top = cropTop + 'px';

    this.updateShades(cropLeft, cropTop, cropWidth, cropHeight);
    this.crop = restrictPosition(this.crop, this.mediaSize, this.cropSize, this.zoom);
    this.render();
  };

  ImageCropEditor.prototype.render = function () {
    if (!this.mediaSize.width || !this.cropSize.width) return;
    const cropLeft = (this.stageSize.width - this.cropSize.width) / 2;
    const cropTop = (this.stageSize.height - this.cropSize.height) / 2;
    const pos = getMediaPosition(this.crop, this.mediaSize, this.cropSize, this.zoom);

    this.mediaEl.style.width = pos.width + 'px';
    this.mediaEl.style.height = pos.height + 'px';
    this.mediaEl.style.left = (cropLeft + pos.left) + 'px';
    this.mediaEl.style.top = (cropTop + pos.top) + 'px';

    if (typeof this.options.onChange === 'function') {
      this.options.onChange(this.getState());
    }
  };

  ImageCropEditor.prototype.getState = function () {
    const normalized = normalizeCrop(this.crop, this.mediaSize, this.cropSize, this.zoom);
    return {
      cropX: normalized.x,
      cropY: normalized.y,
      zoom: this.zoom,
      aspectRatio: this.aspect,
      croppedAreaPixels: computeCroppedAreaPixels(this.crop, this.mediaSize, this.cropSize, this.zoom),
      pixelCrop: { x: this.crop.x, y: this.crop.y }
    };
  };

  ImageCropEditor.prototype.setState = function (state) {
    if (!state) return;
    this.zoom = clamp(state.zoom || 1, this.minZoom, this.maxZoom);
    if (this.mediaSize.width && this.cropSize.width) {
      if (typeof state.cropX === 'number' && typeof state.cropY === 'number') {
        this.crop = denormalizeCrop({ x: state.cropX, y: state.cropY }, this.mediaSize, this.cropSize, this.zoom);
      } else if (state.pixelCrop) {
        this.crop = restrictPosition(state.pixelCrop, this.mediaSize, this.cropSize, this.zoom);
      } else if (typeof state.focusX === 'number') {
        const legacy = legacyToCrop(state.focusX, state.focusY, state.focusZoom);
        this.crop = denormalizeCrop({ x: legacy.x, y: legacy.y }, this.mediaSize, this.cropSize, legacy.zoom);
        this.zoom = legacy.zoom;
      }
    }
    this.render();
  };

  ImageCropEditor.prototype.reset = function () {
    this.crop = { x: 0, y: 0 };
    this.zoom = 1;
    this.render();
  };

  ImageCropEditor.prototype.setZoom = function (zoom) {
    const prev = this.getState();
    this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
    this.crop = denormalizeCrop({ x: prev.cropX, y: prev.cropY }, this.mediaSize, this.cropSize, this.zoom);
    this.render();
  };

  ImageCropEditor.prototype.nudgeZoom = function (delta) {
    this.setZoom(this.zoom + delta);
  };

  ImageCropEditor.prototype.renderPreviewAt = function (previewRoot, aspect) {
    if (!previewRoot || !this.mediaSize.width) return;
    const img = previewRoot.querySelector('img');
    if (!img) return;

    const previewAspect = aspect || this.aspect;
    const rect = previewRoot.getBoundingClientRect();
    const maxWidth = Math.max(1, rect.width);
    const maxHeight = Math.max(1, rect.height || maxWidth / previewAspect);
    let cropWidth = maxWidth;
    let cropHeight = cropWidth / previewAspect;
    if (cropHeight > maxHeight) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * previewAspect;
    }

    const previewCrop = {
      width: cropWidth,
      height: cropHeight
    };
    const offsetX = (rect.width - cropWidth) / 2;
    const offsetY = (rect.height - cropHeight) / 2;
    const pos = getMediaPosition(this.crop, this.mediaSize, previewCrop, this.zoom);
    img.src = this.image.src;
    img.style.width = pos.width + 'px';
    img.style.height = pos.height + 'px';
    img.style.left = (offsetX + pos.left) + 'px';
    img.style.top = (offsetY + pos.top) + 'px';
  };

  ImageCropEditor.prototype.renderPreview = function (previewRoot) {
    this.renderPreviewAt(previewRoot, this.aspect);
  };

  ImageCropEditor.prototype.onPointerDown = function (event) {
    if (event.type === 'touchstart' && event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.pinchStart = {
        distance: Math.sqrt(dx * dx + dy * dy),
        zoom: this.zoom
      };
      this.dragging = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const point = event.touches ? event.touches[0] : event;
    this.dragging = true;
    this.dragStart = {
      x: point.clientX,
      y: point.clientY,
      crop: { x: this.crop.x, y: this.crop.y }
    };
    this.containerEl.classList.add('is-dragging');
    event.preventDefault();
    event.stopPropagation();
  };

  ImageCropEditor.prototype.onPointerMove = function (event) {
    if (event.type === 'touchmove' && event.touches.length === 2 && this.pinchStart) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / this.pinchStart.distance;
      this.setZoom(this.pinchStart.zoom * scale);
      event.preventDefault();
      return;
    }

    if (!this.dragging || !this.dragStart) return;
    const point = event.touches ? event.touches[0] : event;
    const next = {
      x: this.dragStart.crop.x + (point.clientX - this.dragStart.x),
      y: this.dragStart.crop.y + (point.clientY - this.dragStart.y)
    };
    this.crop = restrictPosition(next, this.mediaSize, this.cropSize, this.zoom);
    this.render();
    event.preventDefault();
  };

  ImageCropEditor.prototype.onPointerUp = function () {
    this.dragging = false;
    this.dragStart = null;
    this.pinchStart = null;
    if (this.containerEl) this.containerEl.classList.remove('is-dragging');
  };

  ImageCropEditor.prototype.onWheel = function (event) {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY < 0 ? 0.06 : -0.06;
    this.setZoom(this.zoom + delta);
  };

  global.ImageCropEditor = {
    create: function (root, options) {
      return new ImageCropEditor(root, options);
    },
    legacyToCrop: legacyToCrop,
    getMediaPosition: getMediaPosition,
    getMediaDimensions: getMediaDimensions,
    denormalizeCrop: denormalizeCrop,
    normalizeCrop: normalizeCrop
  };
})(window);
