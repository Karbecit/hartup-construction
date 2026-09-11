<?php

declare(strict_types=1);

function base_path(string $path = ''): string
{
    return dirname(__DIR__) . ($path !== '' ? DIRECTORY_SEPARATOR . ltrim($path, '/\\') : '');
}

function load_config(bool $reload = false): array
{
    static $config = null;
    if ($reload) {
        $config = null;
    }
    if ($config !== null) {
        return $config;
    }

    $configFile = base_path('config/config.php');
    if (!is_file($configFile)) {
        return [];
    }

    $loaded = require $configFile;
    $config = is_array($loaded) ? $loaded : [];
    return $config;
}

function config(string $key, mixed $default = null): mixed
{
    $config = load_config();
    return $config[$key] ?? $default;
}

function site_url(string $path = ''): string
{
    $base = rtrim((string) config('site_url', 'http://localhost:8090'), '/');
    if ($path === '') {
        return $base;
    }

    return $base . '/' . ltrim(str_replace('\\', '/', $path), '/');
}

function is_configured(): bool
{
    return config('admin_password_hash') !== ''
        && config('admin_password_hash') !== null
        && config('smtp_username') !== ''
        && config('turnstile_secret_key') !== '';
}

function h(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function ensure_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        session_start();
    }
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function is_local_request(): bool
{
    return in_array(client_ip(), ['127.0.0.1', '::1'], true);
}

function admin_public_url(string $path = ''): string
{
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    if ($host !== '') {
        $forwarded = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
        $https = $forwarded === 'https'
            || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        $base = ($https ? 'https' : 'http') . '://' . $host;

        return $path === '' ? $base : $base . '/' . ltrim(str_replace('\\', '/', $path), '/');
    }

    return site_url($path);
}

function admin_recovery_email(): string
{
    $email = strtolower(trim((string) config('mail_to', '')));
    return validate_email($email) ? $email : '';
}

function rate_limit_exceeded(string $bucket, int $maxAttempts, int $windowSeconds, bool $record = true): bool
{
    $dir = base_path('data/rate_limits');
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $key = hash('sha256', $bucket . '|' . client_ip());
    $file = $dir . DIRECTORY_SEPARATOR . $key . '.json';
    $now = time();
    $data = ['attempts' => [],];

    if (is_file($file)) {
        $decoded = json_decode((string) file_get_contents($file), true);
        if (is_array($decoded) && isset($decoded['attempts']) && is_array($decoded['attempts'])) {
            $data = $decoded;
        }
    }

    $data['attempts'] = array_values(array_filter(
        $data['attempts'],
        static fn($timestamp) => is_int($timestamp) && ($now - $timestamp) < $windowSeconds
    ));

    if (count($data['attempts']) >= $maxAttempts) {
        return true;
    }

    if ($record) {
        $data['attempts'][] = $now;
        file_put_contents($file, json_encode($data), LOCK_EX);
    }

    return false;
}

function csrf_token(): string
{
    ensure_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(?string $token): bool
{
    ensure_session();
    return is_string($token)
        && !empty($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}

function sanitize_text(string $value, int $maxLength): string
{
    $value = trim(strip_tags($value));
    if (strlen($value) > $maxLength) {
        $value = substr($value, 0, $maxLength);
    }
    return $value;
}

function validate_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function sanitize_phone(string $value, int $maxLength = 40): string
{
    $value = trim(strip_tags($value));
    $value = preg_replace('/[^\d+\s().-]/', '', $value) ?? '';
    $value = preg_replace('/\s+/', ' ', $value) ?? '';
    $value = trim($value);
    if (strlen($value) > $maxLength) {
        $value = substr($value, 0, $maxLength);
    }
    return $value;
}
