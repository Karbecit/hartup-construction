<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once dirname(__DIR__) . '/includes/auth.php';

$ip = client_ip();
$allowedIps = ['127.0.0.1', '::1'];
if (!in_array($ip, $allowedIps, true)) {
    http_response_code(403);
    echo 'Password reset is only available on localhost.';
    exit;
}

if (admin_logged_in()) {
    header('Location: /admin/settings.php');
    exit;
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string) ($_POST['admin_password'] ?? '');
    $passwordConfirm = (string) ($_POST['admin_password_confirm'] ?? '');

    if (strlen($password) < 10) {
        $error = 'Password must be at least 10 characters.';
    } elseif ($password !== $passwordConfirm) {
        $error = 'Passwords do not match.';
    } elseif (update_config([
        'admin_password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ])) {
        $success = 'Password updated. You can log in now.';
    } else {
        $error = 'Could not save the new password.';
    }
}

$config = load_config();
$pageTitle = 'Reset admin password';
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card admin-card--narrow">
  <h1>Reset admin password</h1>
  <p class="admin-lead">Local development only. Username: <strong><?= h((string) ($config['admin_username'] ?? 'admin')) ?></strong></p>

  <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error"><?= h($error) ?></div><?php endif; ?>
  <?php if ($success !== ''): ?><div class="admin-alert admin-alert--success"><?= h($success) ?></div><?php endif; ?>

  <form method="post" class="admin-form">
    <label>New password (min 10 characters)
      <input type="password" name="admin_password" required autocomplete="new-password">
    </label>
    <label>Confirm password
      <input type="password" name="admin_password_confirm" required autocomplete="new-password">
    </label>
    <button type="submit" class="admin-btn">Set new password</button>
  </form>

  <p class="admin-help"><a href="/admin/login.php">Back to login</a></p>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
