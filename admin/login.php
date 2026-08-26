<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once dirname(__DIR__) . '/includes/auth.php';

if (!is_file(base_path('config/config.php'))) {
    header('Location: /admin/setup.php');
    exit;
}

if (admin_logged_in()) {
    header('Location: /admin/');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (rate_limit_exceeded('admin_login', 10, 900)) {
        $error = 'Too many login attempts. Please wait 15 minutes.';
    } else {
        $username = sanitize_text($_POST['username'] ?? '', 60);
        $password = (string) ($_POST['password'] ?? '');
        if (attempt_admin_login($username, $password)) {
            header('Location: /admin/');
            exit;
        }
        $error = 'Invalid username or password.';
    }
}

$pageTitle = 'Admin Login';
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card admin-card--narrow">
  <h1>Admin login</h1>
  <?php if (!empty($_GET['setup'])): ?>
  <div class="admin-alert admin-alert--success">Setup complete. Sign in with your new admin password.</div>
  <?php endif; ?>
  <?php if ($error !== ''): ?>
  <div class="admin-alert admin-alert--error"><?= h($error) ?></div>
  <?php endif; ?>
  <form method="post" class="admin-form">
    <label>Username
      <input type="text" name="username" autocomplete="username" required>
    </label>
    <label>Password
      <input type="password" name="password" autocomplete="current-password" required>
    </label>
    <button type="submit" class="admin-btn">Sign in</button>
  </form>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
