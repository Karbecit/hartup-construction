<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/content.php';
require_once dirname(__DIR__) . '/includes/media.php';

require_admin();

function service_edit_is_ajax(): bool
{
    return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest'
        || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
}

$slug = trim((string) ($_GET['slug'] ?? ''));
$content = load_content();
$services = $content['services'] ?? default_services();
$serviceIndex = null;
$service = null;

foreach ($services as $index => $entry) {
    if (($entry['slug'] ?? '') === $slug) {
        $serviceIndex = $index;
        $service = $entry;
        break;
    }
}

if ($service === null) {
    header('Location: /admin/services.php');
    exit;
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    if (!verify_csrf($input['csrf_token'] ?? '')) {
        $error = 'Security token expired.';
    } else {
        $service['title'] = sanitize_text($input['title'] ?? $service['title'], 120);
        $service['nav_label'] = sanitize_text($input['nav_label'] ?? $service['nav_label'], 120);
        $service['href'] = sanitize_text($input['href'] ?? $service['href'], 200);
        $service['tag'] = sanitize_text($input['tag'] ?? $service['tag'], 160);
        $service['description'] = sanitize_text($input['description'] ?? $service['description'], 600);
        $service['in_menu'] = !empty($input['in_menu']);
        $service['visible'] = !empty($input['visible']);
        $service['parent_slug'] = sanitize_text($input['parent_slug'] ?? '', 120);
        $service['sections'] = parse_page_sections_from_post($input['sections'] ?? []);
        $content['services'][$serviceIndex] = normalize_service($service);

        if (save_content($content)) {
            if (service_edit_is_ajax()) {
                json_response(['success' => true, 'message' => 'Service saved.']);
            }
            $message = 'Service saved successfully.';
            $service = $content['services'][$serviceIndex];
        } else {
            $error = 'Could not save service.';
            if (service_edit_is_ajax()) {
                json_response(['success' => false, 'message' => $error], 500);
            }
        }
    }

    if ($error !== '' && service_edit_is_ajax()) {
        json_response(['success' => false, 'message' => $error], 400);
    }
}

$mediaFiles = list_media_files();
$pageTitle = 'Edit Service — ' . ($service['title'] ?? $slug);
$showNav = true;
$csrfToken = csrf_token();

$editorConfig = [
    'mode' => 'service',
    'slug' => $slug,
    'csrfToken' => $csrfToken,
    'page' => $service,
    'allServices' => array_map(static fn($s) => [
        'slug' => $s['slug'],
        'title' => $s['title'],
        'nav_label' => $s['nav_label'],
    ], $services),
    'services' => array_map(static fn($s) => [
        'slug' => $s['slug'],
        'title' => $s['title'],
        'nav_label' => $s['nav_label'],
        'href' => $s['href'],
    ], $services),
    'sectionTypes' => SECTION_TYPES,
    'mediaFiles' => $mediaFiles,
    'tilePresets' => gallery_tile_presets(true),
];

require __DIR__ . '/includes/header.php';
require __DIR__ . '/includes/page-editor-shell.php';
require __DIR__ . '/includes/footer.php';
