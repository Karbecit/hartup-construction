<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/bootstrap.php';

ensure_session();

json_response([
    'csrf_token' => csrf_token(),
    'turnstile_site_key' => (string) config('turnstile_site_key', ''),
    'contact_configured' => is_configured(),
]);
