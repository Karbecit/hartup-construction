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

    $result = turnstile_siteverify($payload);
    if ($result === '') {
        return false;
    }

    $json = json_decode($result, true);
    return is_array($json) && !empty($json['success']);
}

function turnstile_siteverify(string $payload): string
{
    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        if ($curl !== false) {
            curl_setopt_array($curl, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            ]);
            $body = curl_exec($curl);
            curl_close($curl);
            if (is_string($body) && $body !== '') {
                return $body;
            }
        }
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $payload,
            'timeout' => 10,
        ],
    ]);

    $result = @file_get_contents($url, false, $context);
    return is_string($result) ? $result : '';
}
