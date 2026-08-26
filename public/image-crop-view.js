(function () {
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

  function denormalizeCrop(normalized, mediaSize, cropSize, zoom) {
    const max = getMaxOffsets(mediaSize, cropSize, zoom);
    return {
      x: clamp(normalized.x * max.x, -max.x, max.x),
      y: clamp(normalized.y * max.y, -max.y, max.y)
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

  function parseFloatAttr(el, name, fallback) {
    const value = parseFloat(el.getAttribute(name));
    return isNaN(value) ? fallback : value;
  }

  function getCropValues(container) {
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    if (mobile) {
      return {
        x: parseFloatAttr(container, 'data-crop-x-mobile', parseFloatAttr(container, 'data-crop-x', 0)),
        y: parseFloatAttr(container, 'data-crop-y-mobile', parseFloatAttr(container, 'data-crop-y', 0)),
        zoom: parseFloatAttr(container, 'data-crop-zoom-mobile', parseFloatAttr(container, 'data-crop-zoom', 1))
      };
    }
    return {
      x: parseFloatAttr(container, 'data-crop-x', 0),
      y: parseFloatAttr(container, 'data-crop-y', 0),
      zoom: parseFloatAttr(container, 'data-crop-zoom', 1)
    };
  }

  function getCropSize(container) {
    const width = container.clientWidth;
    if (width < 1) return null;

    const aspect = parseFloatAttr(container, 'data-aspect', 0);
    if (aspect > 0) {
      return {
        width: width,
        height: width / aspect
      };
    }

    const height = container.clientHeight;
    if (height < 1) return null;
    return { width: width, height: height };
  }

  function applyCropView(container) {
    const img = container.querySelector('img');
    if (!img) return;

    function render() {
      if (!img.naturalWidth) return;
      const mediaSize = { width: img.naturalWidth, height: img.naturalHeight };
      const cropSize = getCropSize(container);
      if (!cropSize) return;

      const values = getCropValues(container);
      const zoom = clamp(values.zoom, 1, 3);
      const crop = denormalizeCrop({ x: values.x, y: values.y }, mediaSize, cropSize, zoom);
      const pos = getMediaPosition(crop, mediaSize, cropSize, zoom);

      img.style.width = pos.width + 'px';
      img.style.height = pos.height + 'px';
      img.style.left = pos.left + 'px';
      img.style.top = pos.top + 'px';
    }

    if (img.complete && img.naturalWidth) {
      render();
    } else {
      img.addEventListener('load', render, { once: true });
    }
  }

  function initCropViews() {
    document.querySelectorAll('.image-crop-view').forEach(applyCropView);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCropViews);
  } else {
    initCropViews();
  }

  window.addEventListener('resize', initCropViews);
  window.applyCropView = applyCropView;
  window.addEventListener('orientationchange', initCropViews);

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(function (entries) {
      entries.forEach(function (entry) {
        applyCropView(entry.target);
      });
    });
    document.querySelectorAll('.image-crop-view').forEach(function (el) {
      observer.observe(el);
    });
  }
})();
