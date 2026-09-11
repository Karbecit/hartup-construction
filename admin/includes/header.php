<?php

declare(strict_types=1);

$pageTitle = $pageTitle ?? 'Admin';

if (!isset($activeNav)) {
    $script = basename($_SERVER['SCRIPT_NAME'] ?? '', '.php');
    $activeNav = match ($script) {
        'index' => 'dashboard',
        'pages' => 'pages',
        'page-edit' => 'pages',
        'services' => 'services',
        'service-edit' => 'services',
        'content' => 'pages',
        'categories' => 'services',
        'themes' => 'themes',
        'settings' => 'settings',
        default => '',
    };
}

$adminNavClass = static function (string $key) use ($activeNav): string {
    $classes = ['admin-nav-link'];
    if ($key === $activeNav) {
        $classes[] = 'admin-nav-link--active';
    }

    return implode(' ', $classes);
};
?>
<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= h($pageTitle) ?> · Hartup Construction Admin</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/admin/assets/admin.css?v=<?= (int) filemtime(__DIR__ . '/../assets/admin.css') ?>">
</head>
<body class="admin-body">
<?php if (!empty($showNav)): ?>
<header class="admin-topbar">
  <div class="admin-topbar__inner">
    <a href="/admin/" class="admin-brand">Hartup Admin</a>
    <nav class="admin-nav" aria-label="Admin">
      <div class="admin-nav-primary">
        <a href="/admin/" class="<?= h($adminNavClass('dashboard')) ?>">Dashboard</a>
        <a href="/admin/pages.php" class="<?= h($adminNavClass('pages')) ?>">Pages</a>
        <a href="/admin/services.php" class="<?= h($adminNavClass('services')) ?>">Services</a>
        <a href="/admin/themes.php" class="<?= h($adminNavClass('themes')) ?>">Themes</a>
        <a href="/admin/settings.php" class="<?= h($adminNavClass('settings')) ?>">Settings</a>
      </div>
      <div class="admin-nav-exits">
        <a href="/admin/help.php" class="admin-nav-exit">Help</a>
        <a href="<?= h((string) config('site_url', 'http://localhost:4321')) ?>" class="admin-nav-exit" target="_blank" rel="noopener">View site</a>
        <a href="/admin/logout.php" class="admin-nav-exit">Log out</a>
      </div>
    </nav>
  </div>
</header>
<?php endif; ?>
<main class="admin-main">
