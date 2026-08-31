<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';

require_admin();

$message = '';
$error = '';
$config = load_config();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $error = 'Security token expired. Please try again.';
    } else {
        $updates = [
            'site_url' => sanitize_text($_POST['site_url'] ?? '', 200),
            'admin_username' => sanitize_text($_POST['admin_username'] ?? 'admin', 60),
            'admin_recovery_email' => sanitize_text($_POST['admin_recovery_email'] ?? '', 190),
            'mail_to' => sanitize_text($_POST['mail_to'] ?? '', 190),
            'mail_from' => sanitize_text($_POST['mail_from'] ?? '', 190),
            'mail_from_name' => sanitize_text($_POST['mail_from_name'] ?? '', 120),
            'smtp_host' => sanitize_text($_POST['smtp_host'] ?? '', 200),
            'smtp_port' => (int) ($_POST['smtp_port'] ?? 587),
            'smtp_username' => sanitize_text($_POST['smtp_username'] ?? '', 200),
            'smtp_encryption' => sanitize_text($_POST['smtp_encryption'] ?? 'tls', 10),
            'turnstile_site_key' => sanitize_text($_POST['turnstile_site_key'] ?? '', 200),
            'turnstile_secret_key' => sanitize_text($_POST['turnstile_secret_key'] ?? '', 200),
        ];

        $newPassword = (string) ($_POST['admin_password'] ?? '');
        if ($newPassword !== '') {
            if (strlen($newPassword) < 10) {
                $error = 'New admin password must be at least 10 characters.';
            } else {
                $updates['admin_password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
            }
        }

        $smtpPassword = (string) ($_POST['smtp_password'] ?? '');
        if ($smtpPassword !== '') {
            $updates['smtp_password'] = $smtpPassword;
        }

        $turnstileSecret = (string) ($_POST['turnstile_secret_key'] ?? '');
        if ($turnstileSecret === '' && !empty($config['turnstile_secret_key'])) {
            $updates['turnstile_secret_key'] = $config['turnstile_secret_key'];
        }

        if ($error === '' && !validate_email((string) $updates['admin_recovery_email'])) {
            $error = 'Enter a valid password recovery email address.';
        }

        if ($error === '' && update_config($updates)) {
            $message = 'Settings saved successfully.';
            $config = load_config();
        } elseif ($error === '') {
            $error = 'Could not save settings. Check permissions on /config.';
        }
    }
}

$pageTitle = 'Settings';
$showNav = true;
$csrfToken = csrf_token();
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card">
  <h1>Settings</h1>
  <p class="admin-lead">Manage email delivery (AWS SES SMTP), spam protection, and admin login.</p>

  <?php if ($message !== ''): ?><div class="admin-alert admin-alert--success"><?= h($message) ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error"><?= h($error) ?></div><?php endif; ?>

  <form method="post" class="admin-form">
    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">

    <h2>Admin login</h2>
    <label>Username
      <input type="text" name="admin_username" value="<?= h($config['admin_username'] ?? 'admin') ?>" required>
    </label>
    <label>New password <span class="admin-help">(leave blank to keep current)</span>
      <input type="password" name="admin_password" autocomplete="new-password">
    </label>
    <label>Password recovery email
      <input type="email" name="admin_recovery_email" value="<?= h((string) ($config['admin_recovery_email'] ?? admin_recovery_email())) ?>" required>
      <p class="admin-help">Reset links from “I forgot my password” are sent here. Use an address verified in SES if the account is still in the sandbox.</p>
    </label>

    <h2>Site</h2>
    <label>Site URL
      <input type="url" name="site_url" value="<?= h($config['site_url'] ?? 'http://localhost:8090') ?>" required>
    </label>

    <h2>Email delivery (AWS SES SMTP)</h2>
    <p class="admin-help">Create SMTP credentials in AWS SES. The from address must be a verified identity. If the account is still in the SES sandbox, you can only send to verified recipient addresses — request production access so office and visitor emails both arrive.</p>
    <label>Send enquiries to
      <input type="email" name="mail_to" value="<?= h($config['mail_to'] ?? '') ?>" required>
    </label>
    <label>From email
      <input type="email" name="mail_from" value="<?= h($config['mail_from'] ?? '') ?>" required>
    </label>
    <label>From name
      <input type="text" name="mail_from_name" value="<?= h($config['mail_from_name'] ?? 'Hartup Construction') ?>">
    </label>
    <label>SMTP host
      <input type="text" name="smtp_host" value="<?= h($config['smtp_host'] ?? 'email-smtp.ap-southeast-2.amazonaws.com') ?>" required>
    </label>
    <label>SMTP port
      <input type="number" name="smtp_port" value="<?= h((string) ($config['smtp_port'] ?? 587)) ?>" required>
    </label>
    <label>SMTP username
      <input type="text" name="smtp_username" value="<?= h($config['smtp_username'] ?? '') ?>" required>
    </label>
    <label>SMTP password <span class="admin-help">(leave blank to keep current)</span>
      <input type="password" name="smtp_password" autocomplete="new-password">
    </label>
    <label>Encryption
      <select name="smtp_encryption">
        <option value="tls"<?= ($config['smtp_encryption'] ?? 'tls') === 'tls' ? ' selected' : '' ?>>TLS (port 587)</option>
        <option value="ssl"<?= ($config['smtp_encryption'] ?? '') === 'ssl' ? ' selected' : '' ?>>SSL (port 465)</option>
      </select>
    </label>

    <h2>Spam protection (Cloudflare Turnstile)</h2>
    <p class="admin-help"><a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noopener">Get Turnstile keys</a> — add your domain as an allowed hostname.</p>
    <label>Site key
      <input type="text" name="turnstile_site_key" value="<?= h($config['turnstile_site_key'] ?? '') ?>" required>
    </label>
    <label>Secret key <span class="admin-help">(leave blank to keep current)</span>
      <input type="password" name="turnstile_secret_key" autocomplete="off" placeholder="Enter only to change">
    </label>

    <button type="submit" class="admin-btn">Save settings</button>
  </form>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
