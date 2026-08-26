<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/auth.php';
require_once dirname(__DIR__) . '/includes/content.php';
require_once dirname(__DIR__) . '/includes/media.php';

require_admin();

function is_ajax_request(): bool
{
    return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest'
        || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
}

$slug = trim((string) ($_GET['slug'] ?? ''));
$content = load_content();
$pages = $content['pages'] ?? default_pages();

if ($slug === '' || !isset($pages[$slug])) {
    header('Location: /admin/pages.php');
    exit;
}

$page = $pages[$slug];
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    if (!verify_csrf($input['csrf_token'] ?? '')) {
        $error = 'Security token expired. Please refresh and try again.';
    } else {
        $action = (string) ($input['action'] ?? 'save_page');

        if ($action === 'save_page') {
            $page['title'] = sanitize_text($input['title'] ?? $page['title'], 120);
            $page['page_hero'] = is_array($input['page_hero'] ?? null) ? $input['page_hero'] : $page['page_hero'];
            $page['sections'] = parse_page_sections_from_post($input['sections'] ?? []);
            $content['pages'][$slug] = normalize_page($page);

            if ($slug === 'home' && is_array($input['hero'] ?? null)) {
                $content['hero']['tagline'] = sanitize_text($input['hero']['tagline'] ?? '', 200);
                $content['hero']['background_image'] = normalize_public_image_ref(
                    sanitize_text($input['hero']['background_image'] ?? '', 200)
                );
            }

            if (save_content($content)) {
                if (is_ajax_request()) {
                    json_response(['success' => true, 'message' => 'Page saved.']);
                }
                $message = 'Page saved successfully.';
                $page = $content['pages'][$slug];
            } else {
                $error = 'Could not save page.';
                if (is_ajax_request()) {
                    json_response(['success' => false, 'message' => $error], 500);
                }
            }
        }
    }

    if ($error !== '' && is_ajax_request()) {
        json_response(['success' => false, 'message' => $error], 400);
    }
}

$services = $content['services'] ?? default_services();
$mediaFiles = list_media_files();
$pageTitle = 'Edit Page — ' . ($page['title'] ?? $slug);
$showNav = true;
$csrfToken = csrf_token();

$editorConfig = [
    'mode' => 'page',
    'slug' => $slug,
    'csrfToken' => $csrfToken,
    'page' => $page,
    'services' => array_map(static fn($service) => [
        'slug' => $service['slug'],
        'title' => $service['title'],
        'nav_label' => $service['nav_label'],
        'href' => $service['href'],
    ], $services),
    'sectionTypes' => SECTION_TYPES,
    'mediaFiles' => $mediaFiles,
    'hero' => $content['hero'] ?? [],
    'tilePresets' => gallery_tile_presets(true),
];

require __DIR__ . '/includes/header.php';
require __DIR__ . '/includes/page-editor-shell.php';
require __DIR__ . '/includes/footer.php';
