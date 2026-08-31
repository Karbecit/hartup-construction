<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';
require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/mailer.php';

if (!is_file(base_path('config/config.php'))) {
    header('Location: /admin/setup.php');
    exit;
}

if (admin_logged_in()) {
    header('Location: /admin/');
    exit;
}

$error = '';
$success = '';
$csrfToken = csrf_token();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $error = 'Security token expired. Please try again.';
    } elseif (rate_limit_exceeded('admin_password_reset', 5, 3600)) {
        $error = 'Too many reset requests. Please wait an hour and try again.';
    } else {
        $email = sanitize_text($_POST['recovery_email'] ?? '', 190);
        if (!validate_email($email)) {
            $error = 'Enter the recovery email address from Settings.';
        } else {
            if (recovery_email_matches($email)) {
                try {
                    $token = create_admin_password_reset_token();
                    $resetUrl = admin_public_url('admin/reset-password.php?token=' . urlencode($token));
                    send_admin_password_reset_email($resetUrl);
                } catch (Throwable $exception) {
                    error_log('Admin password reset email failed: ' . $exception->getMessage());
                    $error = 'Could not send the reset email. Check SMTP settings, or reset locally if you are on this computer.';
                }
            }

            if ($error === '') {
                $success = 'If that email is the admin recovery address, a reset link has been sent. It expires in one hour.';
            }
        }
    }
}

$pageTitle = 'Forgot password';
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card admin-card--narrow">
  <h1>I forgot my password</h1>
  <p class="admin-lead">Enter the recovery email from Admin → Settings. We will send a link to choose a new password.</p>

  <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error"><?= h($error) ?></div><?php endif; ?>
  <?php if ($success !== ''): ?><div class="admin-alert admin-alert--success"><?= h($success) ?></div><?php endif; ?>

  <?php if ($success === ''): ?>
  <form method="post" class="admin-form">
    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
    <label>Recovery email
      <input type="email" name="recovery_email" required autocomplete="email">
    </label>
    <button type="submit" class="admin-btn">Send reset link</button>
  </form>
  <?php endif; ?>

  <?php if (is_local_request()): ?>
  <p class="admin-help">On this computer you can also <a href="/admin/reset-password.php">reset without email</a>.</p>
  <?php endif; ?>

  <p class="admin-help"><a href="/admin/login.php">Back to login</a></p>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
