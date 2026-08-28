<?php

declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/includes/auth.php';
require_once dirname(__DIR__, 2) . '/includes/media.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

if (!verify_csrf($_POST['csrf_token'] ?? '')) {
    json_response(['success' => false, 'message' => 'Security token expired.'], 403);
}

$uploadInput = $_FILES['pdf'] ?? [];
$filename = upload_pdf_file($uploadInput);
if ($filename === null) {
    $message = upload_media_error_message($uploadInput);
    if ($message === '' || $message === 'Upload failed.') {
        $message = 'Upload failed. Only PDF files up to ' . ini_get('upload_max_filesize') . ' are supported.';
    }
    json_response(['success' => false, 'message' => $message], 422);
}

json_response([
    'success' => true,
    'file' => [
        'file' => $filename,
        'url' => document_public_path($filename),
        'name' => basename($filename),
    ],
]);
