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
$enquiryEmail = admin_recovery_email();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $error = 'Security token expired. Please try again.';
    } elseif ($enquiryEmail === '') {
        $error = 'A Send enquiries to address has not been set. Ask your web contact to add one in Settings.';
    } elseif (rate_limit_exceeded('admin_password_reset', 5, 3600)) {
        $error = 'Too many reset requests. Please wait an hour and try again.';
    } else {
        try {
            $token = create_admin_password_reset_token();
            $resetUrl = admin_public_url('admin/reset-password.php?token=' . urlencode($token));
            send_admin_password_reset_email($resetUrl);
            $success = 'A reset link has been sent to ' . $enquiryEmail . '. It expires in one hour. Check that inbox (and junk mail).';
        } catch (Throwable $exception) {
            error_log('Admin password reset email failed: ' . $exception->getMessage());
            $error = 'Could not send the reset email. Check SMTP settings, or reset locally if you are on this computer.';
        }
    }
}

$pageTitle = 'Forgot password';
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card admin-card--narrow">
  <h1>Forgot password</h1>
  <?php if ($enquiryEmail !== ''): ?>
  <p class="admin-lead">A reset link will be sent to the same address used for website enquiries: <strong><?= h($enquiryEmail) ?></strong></p>
  <?php else: ?>
  <p class="admin-lead">A Send enquiries to address has not been set, so a reset email cannot be sent. Ask your web contact for help.</p>
  <?php endif; ?>

  <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error"><?= h($error) ?></div><?php endif; ?>
  <?php if ($success !== ''): ?><div class="admin-alert admin-alert--success"><?= h($success) ?></div><?php endif; ?>

  <?php if ($success === '' && $enquiryEmail !== ''): ?>
  <form method="post" class="admin-form">
    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
    <button type="submit" class="admin-btn">Send reset link</button>
  </form>
  <?php endif; ?>

  <?php if (is_local_request()): ?>
  <p class="admin-help">On this computer you can also <a href="/admin/reset-password.php">reset without email</a>.</p>
  <?php endif; ?>

  <p class="admin-help"><a href="/admin/login.php">Back to login</a></p>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
