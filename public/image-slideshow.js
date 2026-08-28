(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function parseHoldMs(root) {
    const seconds = parseFloat(root.getAttribute('data-hold-seconds'));
    if (isNaN(seconds) || seconds <= 0) return 5000;
    return Math.max(500, Math.min(60000, seconds * 1000));
  }

  function parseTransitionMs(root) {
    const raw = parseFloat(root.getAttribute('data-transition-ms') || '');
    if (isNaN(raw) || raw <= 0) return 800;
    const ms = raw <= 10 ? raw * 1000 : raw;
    return Math.max(150, Math.min(10000, Math.round(ms)));
  }

  function keyframesFor(type) {
    switch (type) {
      case 'slide':
        return {
          in: [
            { opacity: 1, transform: 'translateX(100%)' },
            { opacity: 1, transform: 'translateX(0)' },
          ],
          out: [
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 1, transform: 'translateX(-100%)' },
          ],
        };
      case 'slide-up':
        return {
          in: [
            { opacity: 1, transform: 'translateY(100%)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          out: [
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 1, transform: 'translateY(-100%)' },
          ],
        };
      case 'zoom':
        return {
          in: [
            { opacity: 0, transform: 'scale(1.18)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          out: [
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.92)' },
          ],
        };
      case 'wipe':
        return {
          in: [
            { opacity: 1, clipPath: 'inset(0 0 0 100%)' },
            { opacity: 1, clipPath: 'inset(0 0 0 0)' },
          ],
          out: [
            { opacity: 1, clipPath: 'inset(0 0 0 0)' },
            { opacity: 1, clipPath: 'inset(0 100% 0 0)' },
          ],
        };
      default:
        return {
          in: [{ opacity: 0 }, { opacity: 1 }],
          out: [{ opacity: 1 }, { opacity: 0 }],
        };
    }
  }

  function cancelAnims(el) {
    if (!el.getAnimations) return;
    el.getAnimations().forEach(function (anim) {
      anim.cancel();
    });
  }

  function playSwap(leaving, incoming, type, duration) {
    const frames = keyframesFor(type);
    const timing = {
      duration: duration,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    };

    cancelAnims(leaving);
    cancelAnims(incoming);

    incoming.classList.add('is-active');
    leaving.classList.add('is-leaving');
    leaving.classList.remove('is-active');

    if (typeof incoming.animate !== 'function') {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, duration);
      });
    }

    incoming.animate(frames.in, timing);
    const leaveAnim = leaving.animate(frames.out, timing);
    const done = leaveAnim && leaveAnim.finished
      ? leaveAnim.finished.catch(function () {})
      : new Promise(function (resolve) {
          window.setTimeout(resolve, duration);
        });

    return done.then(function () {
      leaving.classList.remove('is-leaving');
      cancelAnims(leaving);
    });
  }

  function initSlideshow(root) {
    if (root.dataset.slideshowReady === '1') return;
    const slides = Array.prototype.slice.call(root.querySelectorAll('.cms-slideshow__slide'));
    if (slides.length < 2) return;
    root.dataset.slideshowReady = '1';

    const duration = parseTransitionMs(root);
    const hold = parseHoldMs(root);
    const type = root.getAttribute('data-transition') || 'fade';
    root.style.setProperty('--slide-duration', duration + 'ms');
    root.classList.add('cms-slideshow--js');

    slides.forEach(function (slide, index) {
      slide.classList.toggle('is-active', index === 0);
      slide.classList.remove('is-leaving', 'is-reset');
      cancelAnims(slide);
    });

    if (prefersReducedMotion()) return;

    let index = 0;
    let timer = 0;
    let visible = true;
    let hoverPaused = false;
    let pageHidden = document.hidden;
    let running = false;

    function isPaused() {
      return hoverPaused || pageHidden || !visible;
    }

    function clearTimer() {
      if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
    }

    function wait(ms) {
      return new Promise(function (resolve) {
        timer = window.setTimeout(function () {
          timer = 0;
          resolve();
        }, ms);
      });
    }

    function goNext() {
      const from = index;
      index = (index + 1) % slides.length;
      return playSwap(slides[from], slides[index], type, duration);
    }

    function loop() {
      if (running) return;
      running = true;

      wait(hold)
        .then(function () {
          if (isPaused()) {
            running = false;
            return;
          }
          return goNext();
        })
        .then(function () {
          running = false;
          if (!isPaused()) loop();
        });
    }

    root.addEventListener('mouseenter', function () {
      hoverPaused = true;
      clearTimer();
      running = false;
    });
    root.addEventListener('mouseleave', function () {
      hoverPaused = false;
      loop();
    });

    document.addEventListener('visibilitychange', function () {
      pageHidden = document.hidden;
      if (pageHidden) {
        clearTimer();
        running = false;
      } else {
        loop();
      }
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          visible = entries.some(function (entry) {
            return entry.isIntersecting;
          });
          if (visible) loop();
          else {
            clearTimer();
            running = false;
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(root);
    } else {
      loop();
    }
  }

  function initSlideshows(root) {
    (root || document).querySelectorAll('[data-slideshow]').forEach(initSlideshow);
  }

  window.initCmsSlideshows = initSlideshows;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initSlideshows(document);
    });
  } else {
    initSlideshows(document);
  }
})();
