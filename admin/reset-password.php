<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once dirname(__DIR__) . '/includes/auth.php';

if (admin_logged_in()) {
    header('Location: /admin/settings.php');
    exit;
}

$token = preg_replace('/[^a-f0-9]/', '', (string) ($_GET['token'] ?? $_POST['token'] ?? '')) ?? '';
$localBypass = $token === '' && is_local_request();
$tokenValid = $token !== '' && verify_admin_password_reset_token($token);

if ($token === '' && !$localBypass) {
    header('Location: /admin/forgot-password.php');
    exit;
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = (string) ($_POST['admin_password'] ?? '');
    $passwordConfirm = (string) ($_POST['admin_password_confirm'] ?? '');

    if (!$localBypass && !verify_admin_password_reset_token($token)) {
        $error = 'This reset link is invalid or has expired. Request a new one.';
        $tokenValid = false;
    } elseif (strlen($password) < 10) {
        $error = 'Password must be at least 10 characters.';
    } elseif ($password !== $passwordConfirm) {
        $error = 'Passwords do not match.';
    } elseif (update_config([
        'admin_password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ])) {
        if ($token !== '') {
            consume_admin_password_reset_token($token);
        }
        $success = 'Password updated. You can log in now.';
        $tokenValid = false;
        $localBypass = false;
    } else {
        $error = 'Could not save the new password.';
    }
}

$config = load_config();
$pageTitle = 'Reset admin password';
$canReset = $success === '' && ($tokenValid || $localBypass);
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card admin-card--narrow">
  <h1>Reset admin password</h1>
  <?php if ($localBypass && $success === ''): ?>
  <p class="admin-lead">Local development only. Username: <strong><?= h((string) ($config['admin_username'] ?? 'admin')) ?></strong></p>
  <?php elseif ($canReset): ?>
  <p class="admin-lead">Choose a new password for <strong><?= h((string) ($config['admin_username'] ?? 'admin')) ?></strong>.</p>
  <?php endif; ?>

  <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error"><?= h($error) ?></div><?php endif; ?>
  <?php if ($success !== ''): ?><div class="admin-alert admin-alert--success"><?= h($success) ?></div><?php endif; ?>

  <?php if ($token !== '' && !$tokenValid && $success === '' && $error === ''): ?>
  <div class="admin-alert admin-alert--error">This reset link is invalid or has expired.</div>
  <?php endif; ?>

  <?php if ($canReset): ?>
  <form method="post" class="admin-form">
    <?php if ($token !== ''): ?>
    <input type="hidden" name="token" value="<?= h($token) ?>">
    <?php endif; ?>
    <label>New password (min 10 characters)
      <input type="password" name="admin_password" required autocomplete="new-password">
    </label>
    <label>Confirm password
      <input type="password" name="admin_password_confirm" required autocomplete="new-password">
    </label>
    <button type="submit" class="admin-btn">Set new password</button>
  </form>
  <?php endif; ?>

  <p class="admin-help">
    <a href="/admin/login.php">Back to login</a>
    <?php if ($success === ''): ?>
    · <a href="/admin/forgot-password.php">Request a new link</a>
    <?php endif; ?>
  </p>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
