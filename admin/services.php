<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/content.php';

require_admin();

function services_is_ajax(): bool
{
    return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest';
}

$content = load_content();
$services = $content['services'] ?? default_services();
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    if (!verify_csrf($input['csrf_token'] ?? '')) {
        $error = 'Security token expired.';
    } else {
        $action = (string) ($input['action'] ?? '');

        if ($action === 'save_menu_order') {
            $order = is_array($input['order'] ?? null) ? $input['order'] : [];
            $menuOrder = parse_services_menu_order($order);
            foreach ($content['services'] as &$service) {
                $slug = $service['slug'] ?? '';
                if ($slug !== '' && array_key_exists($slug, $menuOrder)) {
                    $service['menu_order'] = $menuOrder[$slug];
                }
            }
            unset($service);
            usort($content['services'], static fn($a, $b) => ($a['menu_order'] ?? 0) <=> ($b['menu_order'] ?? 0));
            save_content($content) ? json_response(['success' => true]) : json_response(['success' => false], 500);
        }

        if ($action === 'add_service') {
            $title = sanitize_text($input['title'] ?? 'New Service', 120);
            $slug = strtolower(trim((string) preg_replace('/[^a-z0-9]+/i', '-', $title), '-'));
            if ($slug === '') {
                $slug = 'service';
            }
            $existing = array_column($content['services'], 'slug');
            $baseSlug = $slug !== '' ? $slug : 'service';
            $counter = 1;
            while (in_array($slug, $existing, true)) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            $content['services'][] = normalize_service([
                'slug' => $slug,
                'title' => $title,
                'nav_label' => $title,
                'href' => '/' . $slug,
                'in_menu' => false,
                'menu_order' => (count($content['services']) + 1) * 10,
                'visible' => true,
                'sections' => [],
            ]);
            save_content($content);
            header('Location: /admin/service-edit.php?slug=' . rawurlencode($slug));
            exit;
        }
    }
}

$pageTitle = 'Services & Categories';
$showNav = true;
$csrfToken = csrf_token();
$menuServices = array_values(array_filter($services, static fn($s) => !empty($s['in_menu']) && ($s['parent_slug'] ?? '') === ''));
usort($menuServices, static fn($a, $b) => ($a['menu_order'] ?? 0) <=> ($b['menu_order'] ?? 0));

require __DIR__ . '/includes/header.php';
?>

<div class="admin-card">
  <h1>Services & Categories</h1>
  <p class="admin-lead">Manage service pages, menu order, and page sections. Drag menu items to reorder left/right.</p>
  <?php if ($message !== ''): ?><div class="admin-alert admin-alert--success"><?= h($message) ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error"><?= h($error) ?></div><?php endif; ?>

  <div class="admin-card admin-card--nested">
    <h2>Main menu order</h2>
    <p class="admin-help">Only top-level items shown here. Sub-items (e.g. bedroom pages under New Builds) inherit their parent.</p>
    <ul id="menu-sort-list" class="menu-sort-list">
      <?php foreach ($menuServices as $service): ?>
        <li class="menu-sort-item" draggable="true" data-slug="<?= h($service['slug']) ?>">
          <span class="menu-sort-item__handle" aria-hidden="true">⋮⋮</span>
          <span class="menu-sort-item__label"><?= h($service['nav_label'] ?: $service['title']) ?></span>
          <span class="menu-sort-item__path"><?= h($service['href']) ?></span>
        </li>
      <?php endforeach; ?>
    </ul>
    <p class="admin-help" id="menu-order-status"></p>
  </div>

  <div class="admin-card admin-card--nested">
    <h2>Add service / category</h2>
    <form method="post" class="admin-form admin-form--inline" id="add-service-form">
      <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
      <input type="hidden" name="action" value="add_service">
      <label>Title<input type="text" name="title" required placeholder="e.g. Decks & Pergolas"></label>
      <button type="submit" class="admin-btn">Add</button>
    </form>
  </div>

  <div class="admin-grid">
    <?php foreach ($services as $service): ?>
      <a class="admin-tile" href="/admin/service-edit.php?slug=<?= h(rawurlencode($service['slug'])) ?>">
        <strong><?= h($service['title']) ?></strong>
        <span>
          <?= count($service['sections'] ?? []) ?> section(s)
          <?= !empty($service['in_menu']) ? ' · In menu' : '' ?>
          <?= !empty($service['parent_slug']) ? ' · Under ' . h($service['parent_slug']) : '' ?>
        </span>
      </a>
    <?php endforeach; ?>
  </div>
</div>

<script>
  window.HartupServicesAdmin = {
    csrfToken: <?= json_encode($csrfToken) ?>
  };
</script>
<script src="/admin/assets/services-admin.js?v=<?= (int) @filemtime(__DIR__ . '/assets/services-admin.js') ?>"></script>

<?php require __DIR__ . '/includes/footer.php'; ?>
