<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function verify_turnstile(string $token, ?string $remoteIp = null): bool
{
    $secret = (string) config('turnstile_secret_key', '');
    if ($secret === '' || $token === '') {
        return false;
    }

    $payload = http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $remoteIp ?? client_ip(),
    ]);

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $payload,
            'timeout' => 10,
        ],
    ]);

    $result = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
    if ($result === false) {
        return false;
    }

    $json = json_decode($result, true);
    return is_array($json) && !empty($json['success']);
}
