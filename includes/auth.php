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
    return file_put_contents($path, $php, LOCK_EX) !== false;
}

function update_config(array $updates, bool $merge = true): bool
{
    $current = $merge ? load_config() : [];
    $merged = array_replace($current, $updates);
    return save_config($merged);
}
