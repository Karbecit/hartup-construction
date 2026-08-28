<?php

declare(strict_types=1);

/**
 * Router for the PHP built-in CMS dev server.
 * Serves /images/* from public/images/ so admin previews match production.
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

if (str_starts_with($uri, '/images/')) {
    $relative = substr($uri, strlen('/images/'));
    $relative = str_replace(['..', '\\'], '', $relative);
    $file = __DIR__ . '/public/images/' . $relative;

    if ($relative !== '' && is_file($file)) {
        serve_static_file($file);
    }

    http_response_code(404);
    echo 'Image not found.';
    return true;
}

$publicRoot = realpath(__DIR__ . '/public') ?: (__DIR__ . '/public');
$publicFile = $publicRoot . str_replace('/', DIRECTORY_SEPARATOR, $uri);

if ($uri !== '/' && is_file($publicFile)) {
    serve_static_file($publicFile);
    return true;
}

if (is_file(__DIR__ . $uri)) {
    return false;
}

return false;

function serve_static_file(string $file): void
{
    $mime = media_mime_type_for_router($file);

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . (string) filesize($file));
    readfile($file);
    exit;
}

function media_mime_type_for_router(string $path): string
{
    if (function_exists('mime_content_type')) {
        $mime = mime_content_type($path);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($path);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

    return match ($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'pdf' => 'application/pdf',
        default => 'application/octet-stream',
    };
}
