<?php

declare(strict_types=1);

require_once __DIR__ . '/categories.php';
require_once __DIR__ . '/sections.php';

function media_mime_type(string $path, ?string $hintFilename = null): string
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

    if (function_exists('getimagesize')) {
        $info = @getimagesize($path);
        if (is_array($info) && !empty($info['mime']) && str_starts_with((string) $info['mime'], 'image/')) {
            return (string) $info['mime'];
        }
    }

    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    if ($ext === '' && $hintFilename !== null) {
        $ext = strtolower(pathinfo($hintFilename, PATHINFO_EXTENSION));
    }

    return match ($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        default => '',
    };
}

function media_storage_dir(): string
{
    return gallery_storage_dir();
}

function media_relative_path(string $absolutePath): string
{
    $root = realpath(media_storage_dir()) ?: media_storage_dir();
    $path = realpath($absolutePath) ?: $absolutePath;
    $root = str_replace('\\', '/', $root);
    $path = str_replace('\\', '/', $path);

    if (str_starts_with($path, $root)) {
        return ltrim(substr($path, strlen($root)), '/');
    }

    return basename($path);
}

function list_media_files(): array
{
    $dir = media_storage_dir();
    if (!is_dir($dir)) {
        return [];
    }

    $files = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $fileInfo) {
        if (!$fileInfo->isFile()) {
            continue;
        }
        $mime = media_mime_type($fileInfo->getPathname());
        if (!str_starts_with($mime, 'image/')) {
            continue;
        }
        $relative = media_relative_path($fileInfo->getPathname());
        $files[] = [
            'file' => str_replace('\\', '/', $relative),
            'url' => image_public_path(['file' => $relative]),
            'name' => basename($relative),
            'size' => $fileInfo->getSize(),
            'modified' => $fileInfo->getMTime(),
        ];
    }

    usort($files, static fn($a, $b) => ($b['modified'] ?? 0) <=> ($a['modified'] ?? 0));

    return $files;
}

function upload_media_error_message(array $file): string
{
    $uploadError = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);

    return match ($uploadError) {
        UPLOAD_ERR_OK => '',
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'File is too large. Maximum upload size is ' . ini_get('upload_max_filesize') . '.',
        UPLOAD_ERR_PARTIAL => 'Upload was interrupted. Please try again.',
        UPLOAD_ERR_NO_FILE => 'No file was selected.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server is missing a temporary upload folder.',
        UPLOAD_ERR_CANT_WRITE => 'Server could not write the uploaded file.',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by a server extension.',
        default => 'Upload failed.',
    };
}

function upload_media_file(array $file): ?string
{
    $uploadError = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($uploadError !== UPLOAD_ERR_OK) {
        return null;
    }

    $tmp = (string) ($file['tmp_name'] ?? '');
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        return null;
    }

    $original = basename((string) ($file['name'] ?? 'upload.jpg'));
    $mime = media_mime_type($tmp, $original);
    if (!str_starts_with($mime, 'image/')) {
        return null;
    }
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
        $ext = 'jpg';
    }

    $base = preg_replace('/[^a-zA-Z0-9_-]+/', '_', pathinfo($original, PATHINFO_FILENAME)) ?: 'upload';
    $filename = $base . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
    $targetDir = media_storage_dir();

    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $target = $targetDir . DIRECTORY_SEPARATOR . $filename;
    if (!move_uploaded_file($tmp, $target)) {
        return null;
    }

    return $filename;
}
