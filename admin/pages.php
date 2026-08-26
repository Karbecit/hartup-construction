<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/content.php';

require_admin();

$pageTitle = 'Pages';
$showNav = true;
$content = load_content();
$pages = $content['pages'] ?? default_pages();

require __DIR__ . '/includes/header.php';
?>

<div class="admin-card">
  <h1>Pages</h1>
  <p class="admin-lead">Edit general site pages — home, about, and contact. Add sections, images, and text blocks for each page.</p>

  <div class="admin-grid">
    <?php foreach ($pages as $page): ?>
      <a class="admin-tile" href="/admin/page-edit.php?slug=<?= h(rawurlencode($page['slug'])) ?>">
        <strong><?= h($page['title']) ?></strong>
        <span><?= count($page['sections'] ?? []) ?> section(s) · <?= h($page['path']) ?></span>
      </a>
    <?php endforeach; ?>
  </div>

  <div class="admin-note">
    <p>After saving changes, run <code>npm run build</code> and re-upload <code>dist/</code> to publish updates on the public site.</p>
  </div>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
