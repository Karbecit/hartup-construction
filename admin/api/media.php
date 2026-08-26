<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/includes/auth.php';
require_once dirname(__DIR__, 2) . '/includes/media.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response([
        'success' => true,
        'files' => list_media_files(),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

if (!verify_csrf($_POST['csrf_token'] ?? '')) {
    json_response(['success' => false, 'message' => 'Security token expired.'], 403);
}

$uploadInput = $_FILES['image'] ?? [];
$filename = upload_media_file($uploadInput);
if ($filename === null) {
    $message = upload_media_error_message($uploadInput);
    if ($message === '' || $message === 'Upload failed.') {
        $message = 'Upload failed. Only JPG, PNG, WebP, and GIF images up to ' . ini_get('upload_max_filesize') . ' are supported.';
    }
    json_response(['success' => false, 'message' => $message], 422);
}

json_response([
    'success' => true,
    'file' => [
        'file' => $filename,
        'url' => image_public_path(['file' => $filename]),
        'name' => basename($filename),
    ],
    'files' => list_media_files(),
]);
