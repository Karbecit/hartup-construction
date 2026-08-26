<?php

declare(strict_types=1);

/** @var array $editorConfig */
/** @var string $message */
/** @var string $error */
/** @var string $csrfToken */
?>

<div class="admin-card page-editor" id="page-editor" data-mode="<?= h($editorConfig['mode']) ?>">
  <div class="page-editor__header">
    <div>
      <a href="<?= h($editorConfig['mode'] === 'service' ? '/admin/services.php' : '/admin/pages.php') ?>" class="admin-back-link">← Back</a>
      <h1>Edit <?= h($editorConfig['mode'] === 'service' ? 'Service' : 'Page') ?>: <?= h($editorConfig['page']['title'] ?? $editorConfig['slug']) ?></h1>
    </div>
    <div class="page-editor__actions">
      <span class="page-editor__status" id="editor-save-status" aria-live="polite"></span>
      <button type="button" class="admin-btn" id="editor-save-btn" disabled>Save changes</button>
    </div>
  </div>

  <?php if ($message !== ''): ?><div class="admin-alert admin-alert--success"><?= h($message) ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error"><?= h($error) ?></div><?php endif; ?>

  <div class="page-editor__meta admin-form">
    <?php if ($editorConfig['mode'] === 'page' && ($editorConfig['slug'] ?? '') === 'home'): ?>
      <h2>Homepage hero</h2>
      <label>Tagline<input type="text" id="hero-tagline" value="<?= h($editorConfig['hero']['tagline'] ?? '') ?>"></label>
      <label>Background image
        <div class="image-field-row">
          <input type="text" id="hero-background-image" value="<?= h($editorConfig['hero']['background_image'] ?? '') ?>">
          <button type="button" class="admin-btn admin-btn--ghost image-picker-btn" data-target="#hero-background-image">Choose image</button>
        </div>
      </label>
    <?php elseif ($editorConfig['mode'] === 'page'): ?>
      <h2>Page header</h2>
      <label>Eyebrow<input type="text" id="page-hero-eyebrow" value="<?= h($editorConfig['page']['page_hero']['eyebrow'] ?? '') ?>"></label>
      <label>Heading<input type="text" id="page-hero-heading" value="<?= h($editorConfig['page']['page_hero']['heading'] ?? '') ?>"></label>
      <label>Lead<textarea id="page-hero-lead" rows="2"><?= h($editorConfig['page']['page_hero']['lead'] ?? '') ?></textarea></label>
    <?php elseif ($editorConfig['mode'] === 'service'): ?>
      <h2>Service details</h2>
      <label>Title<input type="text" id="service-title" value="<?= h($editorConfig['page']['title'] ?? '') ?>"></label>
      <label>Nav label<input type="text" id="service-nav-label" value="<?= h($editorConfig['page']['nav_label'] ?? '') ?>"></label>
      <label>URL path<input type="text" id="service-href" value="<?= h($editorConfig['page']['href'] ?? '') ?>"></label>
      <label>Tagline<input type="text" id="service-tag" value="<?= h($editorConfig['page']['tag'] ?? '') ?>"></label>
      <label>Description<textarea id="service-description" rows="2"><?= h($editorConfig['page']['description'] ?? '') ?></textarea></label>
      <label class="admin-checkbox"><input type="checkbox" id="service-in-menu" <?= !empty($editorConfig['page']['in_menu']) ? 'checked' : '' ?>> Show in main menu</label>
      <label class="admin-checkbox"><input type="checkbox" id="service-visible" <?= !empty($editorConfig['page']['visible']) ? 'checked' : '' ?>> Page visible on site</label>
      <label>Menu parent
        <select id="service-parent-slug">
          <option value="">Top level (no parent)</option>
          <?php foreach (($editorConfig['allServices'] ?? []) as $serviceOption): ?>
            <?php if (($serviceOption['slug'] ?? '') === ($editorConfig['slug'] ?? '')) continue; ?>
            <option value="<?= h($serviceOption['slug']) ?>" <?= ($editorConfig['page']['parent_slug'] ?? '') === ($serviceOption['slug'] ?? '') ? 'selected' : '' ?>>
              <?= h($serviceOption['nav_label'] ?: $serviceOption['title']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      </label>
    <?php endif; ?>
  </div>

  <div class="page-editor__sections">
    <div class="page-editor__sections-header">
      <h2>Sections</h2>
      <div class="page-editor__add">
        <select id="add-section-type">
          <?php foreach (($editorConfig['sectionTypes'] ?? SECTION_TYPES) as $type => $label): ?>
            <option value="<?= h($type) ?>"><?= h($label) ?></option>
          <?php endforeach; ?>
        </select>
        <button type="button" class="admin-btn admin-btn--ghost" id="add-section-btn">Add section</button>
      </div>
    </div>
    <p class="admin-help">Drag sections by the ⋮⋮ handle to reorder. Click ▸/▾ to collapse sections. Use <strong>Pan / zoom</strong> on images to choose square or landscape display shape.</p>
    <div id="sections-root" class="sections-root"></div>
  </div>
</div>

<div class="admin-modal" id="layout-block-modal" hidden>
  <div class="admin-modal__dialog admin-modal__dialog--wide">
    <div class="admin-modal__header">
      <h2 id="layout-block-modal-title">Edit block</h2>
      <button type="button" class="admin-modal__close" data-close-modal="layout-block-modal">×</button>
    </div>
    <div class="admin-modal__body" id="layout-block-modal-body"></div>
    <div class="admin-modal__footer">
      <button type="button" class="admin-btn admin-btn--ghost" id="layout-block-modal-cancel">Cancel</button>
      <button type="button" class="admin-btn" id="layout-block-modal-save">Save block</button>
    </div>
  </div>
</div>

<div class="admin-modal" id="media-modal" hidden>
  <div class="admin-modal__dialog admin-modal__dialog--wide">
    <div class="admin-modal__header">
      <h2>Choose image</h2>
      <button type="button" class="admin-modal__close" data-close-modal="media-modal">×</button>
    </div>
    <div class="admin-modal__body">
      <form id="media-upload-form" class="admin-form admin-form--inline" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
        <input type="file" name="image" accept="image/*" required>
        <button type="submit" class="admin-btn admin-btn--ghost">Upload new image</button>
      </form>
      <div id="media-grid" class="media-grid"></div>
    </div>
  </div>
</div>

<div class="crop-modal" id="crop-modal" hidden>
  <div class="crop-modal__backdrop" id="crop-modal-backdrop"></div>
  <div class="crop-modal__dialog">
    <div class="crop-modal__header">
      <div>
        <h3>Adjust image crop</h3>
        <p class="admin-help crop-modal__hint" id="crop-modal-hint">Drag the image or use zoom. Pick a display shape on the right.</p>
      </div>
      <button type="button" class="crop-modal__close" id="crop-modal-close" aria-label="Close">&times;</button>
    </div>
    <div class="crop-modal__body">
      <div class="crop-modal__main">
        <div class="crop-modal__editor-wrap">
          <div id="crop-editor-root" class="crop-modal__editor crop-editor-root"></div>
        </div>
        <div class="crop-modal__toolbar">
          <p class="crop-modal__aspect" id="crop-modal-aspect">Crop frame: 4:3</p>
          <div class="crop-modal__zoom">
            <span class="crop-modal__zoom-label">Zoom</span>
            <button type="button" class="crop-modal__zoom-btn" id="crop-zoom-out" aria-label="Zoom out">−</button>
            <input type="range" id="crop-modal-zoom" min="1" max="3" step="0.01" value="1">
            <button type="button" class="crop-modal__zoom-btn" id="crop-zoom-in" aria-label="Zoom in">+</button>
            <span id="crop-modal-zoom-val">100%</span>
          </div>
          <div class="crop-modal__actions">
            <button type="button" class="admin-btn admin-btn--ghost" id="crop-modal-reset">Reset position</button>
          </div>
        </div>
      </div>
      <aside class="crop-modal__sidebar">
        <p class="admin-help" id="crop-modal-compare-label">Choose display shape</p>
        <div class="crop-modal__compare">
          <div class="crop-modal__compare-grid" id="crop-modal-compare-grid" role="radiogroup" aria-label="Display shape"></div>
        </div>
      </aside>
    </div>
    <div class="crop-modal__footer-actions">
      <button type="button" class="admin-btn admin-btn--ghost" id="crop-modal-cancel">Cancel</button>
      <button type="button" class="admin-btn" id="crop-modal-save">Apply crop</button>
    </div>
  </div>
</div>

<script>
  window.HartupPageEditor = <?= json_encode($editorConfig, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;
</script>
<script src="/admin/assets/image-crop-editor.js?v=<?= (int) @filemtime(__DIR__ . '/../assets/image-crop-editor.js') ?>"></script>
<script src="/image-crop-view.js?v=<?= (int) @filemtime(__DIR__ . '/../../public/image-crop-view.js') ?>"></script>
<script src="/admin/assets/layout-editor.js?v=<?= (int) @filemtime(__DIR__ . '/../assets/layout-editor.js') ?>"></script>
<script src="/admin/assets/pages-editor.js?v=<?= (int) @filemtime(__DIR__ . '/../assets/pages-editor.js') ?>"></script>
