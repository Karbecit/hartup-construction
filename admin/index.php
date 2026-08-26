<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/content.php';

require_admin();

$pageTitle = 'Dashboard';
$showNav = true;
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card">
  <h1>Dashboard</h1>
  <p class="admin-lead">Manage Hartup Construction website content, service galleries, and enquiry settings.</p>

  <div class="admin-grid">
    <a class="admin-tile" href="/admin/pages.php">
      <strong>Pages</strong>
      <span>Edit home, about &amp; contact page sections</span>
    </a>
    <a class="admin-tile" href="/admin/services.php">
      <strong>Services &amp; categories</strong>
      <span>Manage service pages, menu order &amp; galleries</span>
    </a>
    <a class="admin-tile" href="/admin/themes.php">
      <strong>Themes</strong>
      <span>Customise colours, fonts &amp; apply site themes</span>
    </a>
    <a class="admin-tile" href="/admin/settings.php">
      <strong>Settings</strong>
      <span>AWS SES email, Turnstile spam protection &amp; admin login</span>
    </a>
    <a class="admin-tile" href="/" target="_blank" rel="noopener">
      <strong>View website</strong>
      <span>Open the live site in a new tab</span>
    </a>
  </div>

  <div class="admin-note">
    <p><strong>Contact form email</strong> is sent via AWS SES to <code><?= h((string) config('mail_to')) ?></code>.</p>
    <p>Update SMTP and Turnstile keys anytime in <a href="/admin/settings.php">Settings</a>.</p>
  </div>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
