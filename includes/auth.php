<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function admin_logged_in(): bool
{
    ensure_session();
    return !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function require_admin(): void
{
    if (!admin_logged_in()) {
        header('Location: /admin/login.php');
        exit;
    }

    $allowed = config('admin_allowed_ips', []);
    if (is_array($allowed) && $allowed !== []) {
        $ip = client_ip();
        if (!in_array($ip, $allowed, true)) {
            http_response_code(403);
            echo 'Access denied from this IP address.';
            exit;
        }
    }
}

function attempt_admin_login(string $username, string $password): bool
{
    $expectedUser = (string) config('admin_username', 'admin');
    $hash = (string) config('admin_password_hash', '');

    if ($hash === '' || !hash_equals($expectedUser, $username)) {
        return false;
    }

    if (!password_verify($password, $hash)) {
        return false;
    }

    ensure_session();
    session_regenerate_id(true);
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_username'] = $username;
    return true;
}

function admin_logout(): void
{
    ensure_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function save_config(array $values): bool
{
    $path = base_path('config/config.php');
    $export = var_export($values, true);
    $php = "<?php\nreturn {$export};\n";
    $ok = file_put_contents($path, $php, LOCK_EX) !== false;
    if ($ok) {
        load_config(true);
    }

    return $ok;
}

function password_reset_storage_path(): string
{
    return base_path('data/admin_password_reset.json');
}

function create_admin_password_reset_token(): string
{
    $token = bin2hex(random_bytes(32));
    $dir = base_path('data');
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    file_put_contents(password_reset_storage_path(), json_encode([
        'hash' => hash('sha256', $token),
        'expires' => time() + 3600,
    ]), LOCK_EX);

    return $token;
}

function verify_admin_password_reset_token(string $token): bool
{
    if ($token === '' || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        return false;
    }

    $file = password_reset_storage_path();
    if (!is_file($file)) {
        return false;
    }

    $data = json_decode((string) file_get_contents($file), true);
    if (!is_array($data) || empty($data['hash']) || empty($data['expires'])) {
        return false;
    }

    if ((int) $data['expires'] < time()) {
        return false;
    }

    return hash_equals((string) $data['hash'], hash('sha256', $token));
}

function consume_admin_password_reset_token(string $token): bool
{
    if (!verify_admin_password_reset_token($token)) {
        return false;
    }

    @unlink(password_reset_storage_path());
    return true;
}

function update_config(array $updates, bool $merge = true): bool
{
    $current = $merge ? load_config() : [];
    $merged = array_replace($current, $updates);
    return save_config($merged);
}
