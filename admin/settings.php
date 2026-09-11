<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';

require_admin();

$message = '';
$error = '';
$savedSection = sanitize_text((string) ($_GET['saved'] ?? ''), 40);
$config = load_config();

$sectionLabels = [
    'login' => 'Admin login',
    'site' => 'Site',
    'enquiries' => 'Website enquiries',
    'smtp' => 'Email delivery',
    'spam' => 'Spam protection',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf_token'] ?? '')) {
        $error = 'Security token expired. Please try again.';
    } else {
        $section = sanitize_text($_POST['section'] ?? '', 40);
        $updates = [];

        if ($section === 'login') {
            $updates['admin_username'] = sanitize_text($_POST['admin_username'] ?? 'admin', 60);
            $newPassword = (string) ($_POST['admin_password'] ?? '');
            if ($newPassword !== '') {
                if (strlen($newPassword) < 10) {
                    $error = 'New admin password must be at least 10 characters.';
                } else {
                    $updates['admin_password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
                }
            }
        } elseif ($section === 'site') {
            $siteUrl = sanitize_text($_POST['site_url'] ?? '', 200);
            if ($siteUrl === '') {
                $error = 'Enter the site URL.';
            } else {
                $updates['site_url'] = $siteUrl;
            }
        } elseif ($section === 'enquiries') {
            $mailTo = sanitize_text($_POST['mail_to'] ?? '', 190);
            $fromName = sanitize_text($_POST['mail_from_name'] ?? '', 120);
            if (!validate_email($mailTo)) {
                $error = 'Enter a valid Send enquiries to email address.';
            } else {
                $updates['mail_to'] = $mailTo;
                $updates['mail_from_name'] = $fromName;
            }
        } elseif ($section === 'smtp') {
            $from = sanitize_text($_POST['mail_from'] ?? '', 190);
            $host = sanitize_text($_POST['smtp_host'] ?? '', 200);
            $port = (int) ($_POST['smtp_port'] ?? 587);
            $username = sanitize_text($_POST['smtp_username'] ?? '', 200);
            $encryption = sanitize_text($_POST['smtp_encryption'] ?? 'tls', 10);
            if (!validate_email($from)) {
                $error = 'Enter a valid From email address.';
            } elseif ($host === '' || $username === '') {
                $error = 'SMTP host and username are required.';
            } else {
                $updates['mail_from'] = $from;
                $updates['smtp_host'] = $host;
                $updates['smtp_port'] = $port > 0 ? $port : 587;
                $updates['smtp_username'] = $username;
                $updates['smtp_encryption'] = $encryption === 'ssl' ? 'ssl' : 'tls';
                $smtpPassword = (string) ($_POST['smtp_password'] ?? '');
                if ($smtpPassword !== '') {
                    $updates['smtp_password'] = $smtpPassword;
                }
            }
        } elseif ($section === 'spam') {
            $siteKey = sanitize_text($_POST['turnstile_site_key'] ?? '', 200);
            if ($siteKey === '') {
                $error = 'Turnstile site key is required.';
            } else {
                $updates['turnstile_site_key'] = $siteKey;
                $turnstileSecret = (string) ($_POST['turnstile_secret_key'] ?? '');
                if ($turnstileSecret !== '') {
                    $updates['turnstile_secret_key'] = $turnstileSecret;
                }
            }
        } else {
            $error = 'Unknown settings section.';
        }

        if ($error === '' && $updates !== [] && update_config($updates)) {
            header('Location: /admin/settings.php?saved=' . rawurlencode($section) . '#settings-' . rawurlencode($section));
            exit;
        }

        if ($error === '' && $updates !== []) {
            $error = 'Could not save settings. Check permissions on /config.';
        } elseif ($error === '' && $updates === []) {
            $message = ($sectionLabels[$section] ?? 'Settings') . ' — nothing to save.';
        }
    }
}

if ($savedSection !== '' && isset($sectionLabels[$savedSection])) {
    $message = $sectionLabels[$savedSection] . ' saved.';
}

$pageTitle = 'Settings';
$showNav = true;
$csrfToken = csrf_token();
require __DIR__ . '/includes/header.php';
?>

<div class="admin-card">
  <h1>Settings</h1>
  <p class="admin-lead">Change login, the enquiry inbox, and (if needed) technical email and spam settings. Each section has its own Save button.</p>

  <?php if ($message !== ''): ?><div class="admin-alert admin-alert--success"><?= h($message) ?></div><?php endif; ?>
  <?php if ($error !== ''): ?><div class="admin-alert admin-alert--error"><?= h($error) ?></div><?php endif; ?>

  <form method="post" class="admin-form settings-section" id="settings-login">
    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
    <input type="hidden" name="section" value="login">
    <h2>Admin login</h2>
    <label>Username
      <input type="text" name="admin_username" value="<?= h($config['admin_username'] ?? 'admin') ?>" required>
    </label>
    <label>New password <span class="admin-help">(leave blank to keep current)</span>
      <input type="password" name="admin_password" autocomplete="new-password">
    </label>
    <p class="admin-help">Forgot-password emails go to the <strong>Send enquiries to</strong> address below.</p>
    <button type="submit" class="admin-btn">Save login</button>
  </form>

  <form method="post" class="admin-form settings-section" id="settings-site">
    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
    <input type="hidden" name="section" value="site">
    <h2>Site</h2>
    <label>Site URL
      <input type="url" name="site_url" value="<?= h($config['site_url'] ?? 'http://localhost:8090') ?>" required>
    </label>
    <button type="submit" class="admin-btn">Save site</button>
  </form>

  <form method="post" class="admin-form settings-section" id="settings-enquiries">
    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
    <input type="hidden" name="section" value="enquiries">
    <h2>Website enquiries</h2>
    <p class="admin-help">Contact form messages and admin password-reset links are sent here.</p>
    <label>Send enquiries to
      <input type="email" name="mail_to" value="<?= h($config['mail_to'] ?? '') ?>" required>
    </label>
    <label>From name
      <input type="text" name="mail_from_name" value="<?= h($config['mail_from_name'] ?? 'Hartup Construction') ?>">
    </label>
    <button type="submit" class="admin-btn">Save enquiries</button>
  </form>

  <form method="post" class="admin-form settings-section settings-section--locked" id="settings-smtp" data-lock-section>
    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
    <input type="hidden" name="section" value="smtp">
    <div class="settings-section__head">
      <h2>Email delivery (SMTP)</h2>
      <button type="button" class="admin-btn admin-btn--secondary" data-unlock-section>Enable editing</button>
    </div>
    <p class="admin-warning">Do not change these settings unless you are sure what you are doing. The wrong values will stop enquiry emails and password resets.</p>
    <fieldset class="settings-lock" disabled>
      <label>From email
        <input type="email" name="mail_from" value="<?= h($config['mail_from'] ?? '') ?>" required>
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
      <button type="submit" class="admin-btn">Save email delivery</button>
    </fieldset>
  </form>

  <form method="post" class="admin-form settings-section settings-section--locked" id="settings-spam" data-lock-section>
    <input type="hidden" name="csrf_token" value="<?= h($csrfToken) ?>">
    <input type="hidden" name="section" value="spam">
    <div class="settings-section__head">
      <h2>Spam protection</h2>
      <button type="button" class="admin-btn admin-btn--secondary" data-unlock-section>Enable editing</button>
    </div>
    <p class="admin-warning">Do not change these settings unless you are sure what you are doing. The wrong keys will block the contact form.</p>
    <fieldset class="settings-lock" disabled>
      <p class="admin-help"><a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noopener">Cloudflare Turnstile</a> — add your domain as an allowed hostname.</p>
      <label>Site key
        <input type="text" name="turnstile_site_key" value="<?= h($config['turnstile_site_key'] ?? '') ?>" required>
      </label>
      <label>Secret key <span class="admin-help">(leave blank to keep current)</span>
        <input type="password" name="turnstile_secret_key" autocomplete="off" placeholder="Enter only to change">
      </label>
      <button type="submit" class="admin-btn">Save spam protection</button>
    </fieldset>
  </form>
</div>

<script>
(function () {
  document.querySelectorAll('[data-lock-section]').forEach(function (section) {
    var button = section.querySelector('[data-unlock-section]');
    var lock = section.querySelector('.settings-lock');
    if (!button || !lock) return;
    button.addEventListener('click', function () {
      lock.disabled = false;
      section.classList.add('is-unlocked');
      button.hidden = true;
    });
  });
})();
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
