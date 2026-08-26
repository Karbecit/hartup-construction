<?php

declare(strict_types=1);

require_once __DIR__ . '/categories.php';

const SECTION_TYPES = [
    'image_text' => 'Image & text',
    'text' => 'Text only',
    'image' => 'Image only (full width)',
    'service_tiles' => 'Services / category tiles',
    'layout' => 'Custom layout (drag & resize)',
];

const IMAGE_SCALE_OPTIONS = [0.6, 0.75, 0.85, 1.0, 1.15, 1.3];
const HEADING_SIZE_OPTIONS = ['sm', 'md', 'lg', 'xl'];
const HEADING_WEIGHT_OPTIONS = ['normal', 'semibold', 'bold'];
const TEXT_SIZE_OPTIONS = ['sm', 'normal', 'lg', 'lead'];

function new_section_id(): string
{
    return 'sec_' . bin2hex(random_bytes(4));
}

function default_image_field(string $file = '', string $alt = ''): array
{
    return normalize_image_field([
        'file' => $file,
        'alt' => $alt,
        'aspect_ratio' => 4 / 3,
    ]);
}

function normalize_image_field(array $item): array
{
    $normalized = normalize_gallery_item(array_merge([
        'file' => '',
        'alt' => '',
        'visible' => true,
        'aspect_ratio' => 4 / 3,
    ], $item));

    return [
        'file' => (string) ($normalized['file'] ?? ''),
        'alt' => (string) ($normalized['alt'] ?? ''),
        'crop_x' => (float) ($normalized['crop_x'] ?? 0),
        'crop_y' => (float) ($normalized['crop_y'] ?? 0),
        'crop_zoom' => (float) ($normalized['crop_zoom'] ?? 1),
        'crop_x_mobile' => (float) ($normalized['crop_x_mobile'] ?? 0),
        'crop_y_mobile' => (float) ($normalized['crop_y_mobile'] ?? 0),
        'crop_zoom_mobile' => (float) ($normalized['crop_zoom_mobile'] ?? 1),
        'aspect_ratio' => (float) ($normalized['aspect_ratio'] ?? 4 / 3),
        'cropped_area_pixels' => (string) ($normalized['cropped_area_pixels'] ?? ''),
    ];
}

function normalize_image_scale($value): float
{
    $scale = (float) $value;
    if ($scale <= 0) {
        return 1.0;
    }

    $allowed = IMAGE_SCALE_OPTIONS;
    $closest = $allowed[0];
    $bestDiff = abs($scale - $closest);
    foreach ($allowed as $option) {
        $diff = abs($scale - $option);
        if ($diff < $bestDiff) {
            $bestDiff = $diff;
            $closest = $option;
        }
    }

    return $closest;
}

function normalize_heading_size(string $value): string
{
    return in_array($value, HEADING_SIZE_OPTIONS, true) ? $value : 'lg';
}

function normalize_heading_weight(string $value): string
{
    return in_array($value, HEADING_WEIGHT_OPTIONS, true) ? $value : 'semibold';
}

function normalize_text_size(string $value): string
{
    return in_array($value, TEXT_SIZE_OPTIONS, true) ? $value : 'normal';
}

function normalize_text_styles(array $section): array
{
    return [
        'heading_size' => normalize_heading_size((string) ($section['heading_size'] ?? 'lg')),
        'heading_weight' => normalize_heading_weight((string) ($section['heading_weight'] ?? 'semibold')),
        'text_size' => normalize_text_size((string) ($section['text_size'] ?? 'normal')),
        'eyebrow_size' => normalize_text_size((string) ($section['eyebrow_size'] ?? 'sm')),
    ];
}

function sanitize_layout_text_html(string $html): string
{
    $html = trim($html);
    if ($html === '') {
        return '';
    }

    $html = preg_replace('/<(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*>.*?<\/\1>/is', '', $html) ?? $html;
    $html = preg_replace('/<(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*\/?>/i', '', $html) ?? $html;
    $html = preg_replace('/\son\w+\s*=\s*("|\').*?\1/i', '', $html) ?? $html;
    $html = preg_replace('/\son\w+\s*=\s*[^\s>]+/i', '', $html) ?? $html;

    return trim($html);
}

function layout_text_block_to_content(array $block): string
{
    $content = trim((string) ($block['content'] ?? ''));
    if ($content !== '') {
        return sanitize_layout_text_html($content);
    }

    $parts = [];
    $eyebrow = trim((string) ($block['eyebrow'] ?? ''));
    if ($eyebrow !== '') {
        $size = normalize_text_size((string) ($block['eyebrow_size'] ?? 'sm'));
        $parts[] = '<span class="cms-eyebrow cms-text--' . $size . '">' . htmlspecialchars($eyebrow, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</span>';
    }

    $heading = trim((string) ($block['heading'] ?? ''));
    if ($heading !== '') {
        $headingSize = normalize_heading_size((string) ($block['heading_size'] ?? 'lg'));
        $headingWeight = normalize_heading_weight((string) ($block['heading_weight'] ?? 'semibold'));
        $parts[] = '<h2 class="cms-heading cms-heading--' . $headingSize . ' cms-weight--' . $headingWeight . '">' . htmlspecialchars($heading, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</h2>';
    }

    $textSize = normalize_text_size((string) ($block['text_size'] ?? 'normal'));
    foreach (normalize_string_list(is_array($block['paragraphs'] ?? null) ? $block['paragraphs'] : []) as $paragraph) {
        $parts[] = '<p class="cms-body cms-text--' . $textSize . '">' . htmlspecialchars($paragraph, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>';
    }

    return implode('', $parts);
}

function normalize_layout_block(array $block): array
{
    $type = (string) ($block['type'] ?? 'text');
    if (!in_array($type, ['image', 'text'], true)) {
        $type = 'text';
    }

    $base = [
        'id' => (string) ($block['id'] ?? ('blk_' . bin2hex(random_bytes(4)))),
        'type' => $type,
        'x' => max(0, min(100, (float) ($block['x'] ?? 0))),
        'y' => max(0, min(100, (float) ($block['y'] ?? 0))),
        'w' => max(8, min(100, (float) ($block['w'] ?? 40))),
        'h' => max(8, min(100, (float) ($block['h'] ?? 30))),
    ];

    if ($type === 'image') {
        return array_merge($base, [
            'image' => normalize_image_field(is_array($block['image'] ?? null) ? $block['image'] : []),
        ]);
    }

    return array_merge($base, [
        'content' => layout_text_block_to_content($block),
    ]);
}

function normalize_layout_blocks(array $blocks): array
{
    $normalized = [];
    foreach ($blocks as $block) {
        if (!is_array($block)) {
            continue;
        }
        $normalized[] = normalize_layout_block($block);
    }

    return $normalized;
}

function normalize_string_list(array $items): array
{
    return array_values(array_filter(array_map(
        static fn($item) => trim((string) $item),
        $items
    ), static fn($item) => $item !== ''));
}

function normalize_section(array $section): array
{
    $type = (string) ($section['type'] ?? 'text');
    if (!array_key_exists($type, SECTION_TYPES)) {
        $type = 'text';
    }

    $base = [
        'id' => (string) ($section['id'] ?? new_section_id()),
        'type' => $type,
        'enabled' => !array_key_exists('enabled', $section) || !empty($section['enabled']),
        'background' => in_array($section['background'] ?? 'default', ['default', 'elevated'], true)
            ? ($section['background'] ?? 'default')
            : 'default',
    ];

    return match ($type) {
        'image_text' => array_merge($base, normalize_text_styles($section), [
            'eyebrow' => trim((string) ($section['eyebrow'] ?? '')),
            'heading' => trim((string) ($section['heading'] ?? '')),
            'paragraphs' => normalize_string_list(is_array($section['paragraphs'] ?? null) ? $section['paragraphs'] : []),
            'bullets' => normalize_string_list(is_array($section['bullets'] ?? null) ? $section['bullets'] : []),
            'image_position' => ($section['image_position'] ?? 'right') === 'left' ? 'left' : 'right',
            'image_scale' => normalize_image_scale($section['image_scale'] ?? 1),
            'image' => normalize_image_field(is_array($section['image'] ?? null) ? $section['image'] : []),
        ]),
        'text' => array_merge($base, normalize_text_styles($section), [
            'eyebrow' => trim((string) ($section['eyebrow'] ?? '')),
            'heading' => trim((string) ($section['heading'] ?? '')),
            'paragraphs' => normalize_string_list(is_array($section['paragraphs'] ?? null) ? $section['paragraphs'] : []),
            'bullets' => normalize_string_list(is_array($section['bullets'] ?? null) ? $section['bullets'] : []),
        ]),
        'image' => array_merge($base, [
            'image' => normalize_image_field(is_array($section['image'] ?? null) ? $section['image'] : []),
            'image_scale' => normalize_image_scale($section['image_scale'] ?? 1),
            'caption' => trim((string) ($section['caption'] ?? '')),
        ]),
        'service_tiles' => array_merge($base, [
            'tiles' => normalize_service_tiles(is_array($section['tiles'] ?? null) ? $section['tiles'] : []),
        ]),
        'layout' => array_merge($base, [
            'min_height' => max(280, min(1200, (int) ($section['min_height'] ?? 480))),
            'blocks' => normalize_layout_blocks(is_array($section['blocks'] ?? null) ? $section['blocks'] : []),
        ]),
        default => array_merge($base, [
            'heading' => trim((string) ($section['heading'] ?? '')),
            'paragraphs' => normalize_string_list(is_array($section['paragraphs'] ?? null) ? $section['paragraphs'] : []),
        ]),
    };
}

function normalize_service_tiles(array $tiles): array
{
    $normalized = [];
    foreach ($tiles as $tile) {
        if (!is_array($tile)) {
            continue;
        }
        $normalized[] = [
            'service_slug' => trim((string) ($tile['service_slug'] ?? '')),
            'label' => trim((string) ($tile['label'] ?? '')),
            'image' => normalize_image_field(is_array($tile['image'] ?? null) ? $tile['image'] : []),
        ];
    }

    return $normalized;
}

function normalize_sections(array $sections): array
{
    $normalized = [];
    foreach ($sections as $section) {
        if (!is_array($section)) {
            continue;
        }
        $normalized[] = normalize_section($section);
    }

    return $normalized;
}

function merge_sections(array $defaults, array $saved): array
{
    $defaultById = [];
    foreach ($defaults as $section) {
        $defaultById[$section['id']] = $section;
    }

    $merged = [];
    foreach ($saved as $section) {
        if (!is_array($section)) {
            continue;
        }
        $id = (string) ($section['id'] ?? '');
        $base = $defaultById[$id] ?? [];
        $merged[] = normalize_section(array_replace_recursive($base, $section));
        unset($defaultById[$id]);
    }

    return $merged;
}

function default_section_for_type(string $type): array
{
    return match ($type) {
        'image_text' => normalize_section([
            'type' => 'image_text',
            'heading' => 'New section heading',
            'paragraphs' => ['Add your content here.'],
            'image_position' => 'right',
            'image' => default_image_field('tiny-home.png', 'Project photo'),
        ]),
        'text' => normalize_section([
            'type' => 'text',
            'heading' => 'New text section',
            'paragraphs' => ['Add your content here.'],
        ]),
        'image' => normalize_section([
            'type' => 'image',
            'image' => default_image_field('tiny-home.png', 'Full width image'),
        ]),
        'service_tiles' => normalize_section([
            'type' => 'service_tiles',
            'tiles' => [],
        ]),
        'layout' => normalize_section([
            'type' => 'layout',
            'min_height' => 480,
            'blocks' => [],
        ]),
        default => normalize_section(['type' => 'text', 'heading' => 'New section']),
    };
}

function image_crop_data_attrs(array $image, float $defaultAspect = 4 / 3): string
{
    return image_crop_attrs(normalize_image_field($image), false, $defaultAspect);
}

function image_public_path(array $image): string
{
    $file = trim((string) ($image['file'] ?? ''));
    if ($file === '') {
        return '';
    }

    $file = normalize_public_image_ref($file);
    $parts = explode('/', str_replace('\\', '/', $file));
    $encoded = implode('/', array_map('rawurlencode', $parts));

    return '/' . ltrim($encoded, '/');
}

function normalize_public_image_ref(string $file): string
{
    $file = trim(str_replace('\\', '/', $file));
    $file = ltrim($file, '/');
    if ($file === '') {
        return '';
    }

    if (str_starts_with($file, 'images/')) {
        return $file;
    }

    return 'images/' . $file;
}
