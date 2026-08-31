<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';

if (is_file(base_path('config/config.php')) && is_configured()) {
    header('Location: /admin/login.php');
    exit;
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = sanitize_text($_POST['admin_username'] ?? 'admin', 60);
    $password = (string) ($_POST['admin_password'] ?? '');
    $passwordConfirm = (string) ($_POST['admin_password_confirm'] ?? '');

    $config = [
        'site_url' => sanitize_text($_POST['site_url'] ?? 'https://hartupconstruction.com.au', 200),
        'admin_username' => $username !== '' ? $username : 'admin',
        'admin_password_hash' => '',
        'admin_recovery_email' => sanitize_text($_POST['admin_recovery_email'] ?? 'office@hartupconstruction.com.au', 190),
        'mail_to' => sanitize_text($_POST['mail_to'] ?? 'office@hartupconstruction.com.au', 190),
        'mail_from' => sanitize_text($_POST['mail_from'] ?? 'noreply@hartupconstruction.com.au', 190),
        'mail_from_name' => sanitize_text($_POST['mail_from_name'] ?? 'Hartup Construction', 120),
        'smtp_host' => sanitize_text($_POST['smtp_host'] ?? 'email-smtp.ap-southeast-2.amazonaws.com', 200),
        'smtp_port' => (int) ($_POST['smtp_port'] ?? 587),
        'smtp_username' => sanitize_text($_POST['smtp_username'] ?? '', 200),
        'smtp_password' => (string) ($_POST['smtp_password'] ?? ''),
        'smtp_encryption' => sanitize_text($_POST['smtp_encryption'] ?? 'tls', 10),
        'turnstile_site_key' => sanitize_text($_POST['turnstile_site_key'] ?? '', 200),
        'turnstile_secret_key' => sanitize_text($_POST['turnstile_secret_key'] ?? '', 200),
        'admin_allowed_ips' => [],
    ];

    if (strlen($password) < 10) {
        $error = 'Admin password must be at least 10 characters.';
    } elseif ($password !== $passwordConfirm) {
        $error = 'Passwords do not match.';
    } elseif (!validate_email($config['admin_recovery_email'])) {
        $error = 'Enter a valid password recovery email address.';
    } elseif ($config['smtp_username'] === '' || $config['smtp_password'] === '') {
        $error = 'AWS SES SMTP username and password are required.';
    } elseif ($config['turnstile_site_key'] === '' || $config['turnstile_secret_key'] === '') {
        $error = 'Cloudflare Turnstile site key and secret key are required.';
    } else {
        $config['admin_password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        require_once dirname(__DIR__) . '/includes/auth.php';
        if (save_config($config)) {
            header('Location: /admin/login.php?setup=1');
            exit;
        }
        $error = 'Could not save configuration file. Check folder permissions for /config.';
    }
}

$pageTitle = 'Initial Setup';
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card admin-card--narrow">
  <h1>Website setup</h1>
  <p class="admin-lead">Configure admin login, AWS SES email, and Cloudflare Turnstile spam protection.</p>

  <?php if ($error !== ''): ?>
  <div class="admin-alert admin-alert--error"><?= h($error) ?></div>
  <?php endif; ?>

  <form method="post" class="admin-form">
    <h2>Admin login</h2>
    <label>Username
      <input type="text" name="admin_username" value="admin" required>
    </label>
    <label>Password (min 10 characters)
      <input type="password" name="admin_password" required autocomplete="new-password">
    </label>
    <label>Confirm password
      <input type="password" name="admin_password_confirm" required autocomplete="new-password">
    </label>
    <label>Password recovery email
      <input type="email" name="admin_recovery_email" value="office@hartupconstruction.com.au" required>
      <p class="admin-help">Used for “I forgot my password” on the login page. Must be able to receive mail from SES.</p>
    </label>

    <h2>Site</h2>
    <label>Site URL
      <input type="url" name="site_url" value="https://hartupconstruction.com.au" required>
      <p class="admin-help">Production: <code>https://hartupconstruction.com.au</code>. Local dev: <code>http://localhost:4321</code>.</p>
    </label>

    <h2>Email (AWS SES SMTP)</h2>
    <label>Send enquiries to
      <input type="email" name="mail_to" value="office@hartupconstruction.com.au" required>
    </label>
    <label>From email (must be verified in SES)
      <input type="email" name="mail_from" value="noreply@hartupconstruction.com.au" required>
    </label>
    <label>From name
      <input type="text" name="mail_from_name" value="Hartup Construction">
    </label>
    <label>SMTP host
      <input type="text" name="smtp_host" value="email-smtp.ap-southeast-2.amazonaws.com" required>
    </label>
    <label>SMTP port
      <input type="number" name="smtp_port" value="587" required>
    </label>
    <label>SMTP username
      <input type="text" name="smtp_username" required>
    </label>
    <label>SMTP password
      <input type="password" name="smtp_password" required autocomplete="new-password">
    </label>
    <label>Encryption
      <select name="smtp_encryption">
        <option value="tls" selected>TLS (port 587)</option>
        <option value="ssl">SSL (port 465)</option>
      </select>
    </label>

    <h2>Spam protection (Cloudflare Turnstile)</h2>
    <p class="admin-help">Create free keys at <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noopener">Cloudflare Turnstile</a>. Add your domain as an allowed hostname.</p>
    <label>Site key
      <input type="text" name="turnstile_site_key" required>
    </label>
    <label>Secret key
      <input type="text" name="turnstile_secret_key" required>
    </label>

    <button type="submit" class="admin-btn">Save &amp; continue to login</button>
  </form>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
