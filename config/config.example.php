<?php
/**
 * Copy this file to config.php and fill in your values.
 * Never commit config.php to version control.
 */
return [
    'site_url' => 'https://hartupconstruction.com.au',

    // Admin login (use setup.php on first visit to generate the password hash)
    'admin_username' => 'admin',
    'admin_password_hash' => '',
    'admin_recovery_email' => 'office@hartupconstruction.com.au',

    // Where enquiry emails are delivered
    'mail_to' => 'office@hartupconstruction.com.au',
    'mail_from' => 'noreply@hartupconstruction.com.au',
    'mail_from_name' => 'Hartup Construction',

    // SMTP — AWS SES, SendGrid, or your host's SMTP
    'smtp_host' => 'email-smtp.ap-southeast-2.amazonaws.com',
    'smtp_port' => 587,
    'smtp_username' => '',
    'smtp_password' => '',
    'smtp_encryption' => 'tls',

    // Cloudflare Turnstile — https://dash.cloudflare.com/?to=/:account/turnstile
    'turnstile_site_key' => '',
    'turnstile_secret_key' => '',

    // Optional: restrict admin to specific IPs (empty array = allow all)
    'admin_allowed_ips' => [],
];
