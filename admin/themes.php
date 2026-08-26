<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/themes.php';

require_admin();

function themes_is_ajax(): bool
{
    return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && themes_is_ajax() && str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
    $payload = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        json_response(['success' => false, 'message' => 'Invalid request.'], 400);
    }

    if (!verify_csrf($payload['csrf_token'] ?? '')) {
        json_response(['success' => false, 'message' => 'Security token expired. Please reload the page.'], 403);
    }

    $action = (string) ($payload['action'] ?? '');

    if ($action === 'list') {
        json_response([
            'success' => true,
            'original' => original_theme(),
            'font_types' => theme_font_types(),
            'color_groups' => theme_color_groups(),
            'font_catalog' => theme_font_catalog(),
            'targets' => theme_targets(),
            'typography_fields' => theme_typography_fields(),
            'active_theme_id' => active_theme_id(),
            'saved_themes' => array_values(array_map('normalize_theme', load_themes_data()['themes'])),
        ]);
    }

    if ($action === 'save') {
        $id = sanitize_text((string) ($payload['id'] ?? ''), 32);
        $result = update_custom_theme($id, [
            'name' => $payload['name'] ?? '',
            'fonts' => is_array($payload['fonts'] ?? null) ? $payload['fonts'] : [],
            'colors' => is_array($payload['colors'] ?? null) ? $payload['colors'] : [],
            'typography' => is_array($payload['typography'] ?? null) ? $payload['typography'] : [],
        ]);
        json_response($result, $result['success'] ? 200 : 400);
    }

    if ($action === 'save_as') {
        $overwriteId = sanitize_text((string) ($payload['overwrite_id'] ?? ''), 32);
        $result = create_custom_theme([
            'name' => $payload['name'] ?? '',
            'fonts' => is_array($payload['fonts'] ?? null) ? $payload['fonts'] : [],
            'colors' => is_array($payload['colors'] ?? null) ? $payload['colors'] : [],
            'typography' => is_array($payload['typography'] ?? null) ? $payload['typography'] : [],
        ], $overwriteId !== '' ? $overwriteId : null);
        json_response($result, $result['success'] ? 200 : 400);
    }

    if ($action === 'delete') {
        $id = sanitize_text((string) ($payload['id'] ?? ''), 32);
        $result = delete_custom_theme($id);
        json_response($result, $result['success'] ? 200 : 400);
    }

    if ($action === 'apply') {
        $id = sanitize_text((string) ($payload['id'] ?? ''), 32);
        $result = apply_theme($id);
        json_response($result, $result['success'] ? 200 : 400);
    }

    json_response(['success' => false, 'message' => 'Unknown action.'], 400);
}

$pageTitle = 'Themes';
$showNav = true;
$themeDemoContent = theme_demo_content();
$csrfToken = csrf_token();
$extraScripts = [
    '/admin/assets/themes.js?v=' . (int) filemtime(__DIR__ . '/assets/themes.js'),
];
require __DIR__ . '/includes/header.php';
?>

<link rel="stylesheet" href="/admin/assets/themes.css?v=<?= (int) filemtime(__DIR__ . '/assets/themes.css') ?>">

<div class="admin-card themes-admin">
  <h1>Themes</h1>
  <p class="admin-lead">Click any part of the live preview to edit its fonts, colours, and typography. Save variations, preview changes instantly, and apply a theme to the public site. The <strong>Original</strong> theme is protected and always available as a fallback.</p>

  <div id="themes-status" class="admin-alert" hidden></div>

  <div class="themes-toolbar">
    <label class="themes-toolbar__field">
      <span>Load theme</span>
      <select id="theme-select">
        <option value="original">Original (protected)</option>
      </select>
    </label>
    <div class="themes-toolbar__actions">
      <button type="button" class="admin-btn admin-btn--secondary" id="theme-load-btn">Load</button>
      <button type="button" class="admin-btn admin-btn--secondary" id="theme-apply-btn">Apply to site</button>
      <button type="button" class="admin-btn admin-btn--secondary" id="theme-save-btn" hidden>Save</button>
      <button type="button" class="admin-btn" id="theme-save-as-btn">Save As</button>
      <button type="button" class="admin-btn admin-btn--danger" id="theme-delete-btn" hidden>Delete</button>
    </div>
  </div>

  <p class="admin-help themes-active-note">Active on site: <strong id="theme-active-label">Original</strong></p>

  <div class="themes-layout">
    <section class="themes-panel">
      <div id="theme-panel-empty" class="theme-panel-empty">
        <p><strong>Select something to edit</strong></p>
        <p class="admin-help">Click text, backgrounds, buttons, cards, the form, or footer in the preview on the right.</p>
      </div>
      <div id="theme-panel-editor" class="theme-panel-editor" hidden>
        <p class="theme-panel-editor__hint admin-help" id="theme-panel-hint"></p>
        <h2 id="theme-panel-title">Settings</h2>
        <div id="theme-context-controls" class="theme-context-controls"></div>
      </div>
    </section>

    <section class="themes-preview-wrap">
      <h2>Live preview</h2>
      <p class="admin-help">Click an element to select it. Changes apply instantly.</p>
      <div id="theme-preview" class="theme-preview" aria-live="polite">
        <div class="theme-preview__header" data-theme-target="header">
          <span class="theme-preview__logo" data-theme-target="logo"><?= h($themeDemoContent['siteName']) ?></span>
          <nav class="theme-preview__nav" data-theme-target="nav">
            <a href="#">What we do</a>
            <a href="#">About</a>
            <a href="#" class="theme-preview__cta" data-theme-target="nav-cta"><?= h($themeDemoContent['navCta']) ?></a>
          </nav>
        </div>
        <div class="theme-preview__hero" data-theme-target="hero-bg">
          <p class="theme-preview__eyebrow" data-theme-target="hero-eyebrow"><?= h($themeDemoContent['heroEyebrow']) ?></p>
          <h1 class="theme-preview__heading" data-theme-target="heading"><?= h($themeDemoContent['heroHeading']) ?></h1>
          <p class="theme-preview__lead" data-theme-target="lead"><?= h($themeDemoContent['heroLead']) ?></p>
          <div class="theme-preview__buttons">
            <span class="theme-preview__btn theme-preview__btn--primary" data-theme-target="btn-primary"><?= h($themeDemoContent['btnPrimary']) ?></span>
            <span class="theme-preview__btn theme-preview__btn--ghost" data-theme-target="btn-ghost"><?= h($themeDemoContent['btnGhost']) ?></span>
          </div>
        </div>
        <div class="theme-preview__section theme-preview__section--alt" data-theme-target="section-alt">
          <p class="theme-preview__eyebrow theme-preview__eyebrow--section" data-theme-target="section-eyebrow"><?= h($themeDemoContent['servicesEyebrow']) ?></p>
          <h2 class="theme-preview__subheading" data-theme-target="subheading"><?= h($themeDemoContent['servicesHeading']) ?></h2>
          <div class="theme-preview__cards">
            <article class="theme-preview__card" data-theme-target="card">
              <h3 data-theme-target="card-title"><?= h($themeDemoContent['cards'][0]['title']) ?></h3>
              <p data-theme-target="card-body"><?= h($themeDemoContent['cards'][0]['body']) ?></p>
            </article>
            <article class="theme-preview__card" data-theme-target="card">
              <h3 data-theme-target="card-title"><?= h($themeDemoContent['cards'][1]['title']) ?></h3>
              <p data-theme-target="card-body"><?= h($themeDemoContent['cards'][1]['body']) ?></p>
            </article>
          </div>
        </div>
        <div class="theme-preview__section">
          <h2 class="theme-preview__subheading" data-theme-target="subheading"><?= h($themeDemoContent['aboutHeading']) ?></h2>
          <p class="theme-preview__body" data-theme-target="body-text"><?= h($themeDemoContent['aboutBody']) ?></p>
        </div>
        <div class="theme-preview__contact">
          <h2 class="theme-preview__subheading" data-theme-target="subheading"><?= h($themeDemoContent['contactHeading']) ?></h2>
          <div class="theme-preview__form" data-theme-target="contact-form">Contact form preview</div>
        </div>
        <footer class="theme-preview__footer" data-theme-target="footer">
          <strong data-theme-target="footer-title"><?= h($themeDemoContent['footerTitle']) ?></strong>
          <span data-theme-target="footer-text"><?= h($themeDemoContent['footerText']) ?></span>
        </footer>
      </div>
    </section>
  </div>
</div>

<div class="admin-modal" id="theme-save-modal" hidden>
  <div class="admin-modal__backdrop" data-close-modal></div>
  <div class="admin-modal__panel admin-card">
    <h2>Save theme as</h2>
    <p class="admin-help">Creates a new saved theme. Existing themes are left unchanged unless you choose to overwrite a duplicate name.</p>
    <label>Theme name
      <input type="text" id="theme-save-name" maxlength="80" placeholder="e.g. Warm Autumn">
    </label>
    <div class="themes-modal-actions">
      <button type="button" class="admin-btn admin-btn--secondary" data-close-modal>Cancel</button>
      <button type="button" class="admin-btn" id="theme-save-confirm">Save As</button>
    </div>
  </div>
</div>

<script>
window.NanaLeeThemes = {
  csrfToken: <?= json_encode($csrfToken, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>,
  originalId: <?= json_encode(THEME_ORIGINAL_ID) ?>,
  demoContent: <?= json_encode($themeDemoContent, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>
};
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
