<?php

declare(strict_types=1);

function category_url(string $slug): string
{
    return $slug !== '' ? '/' . rawurlencode($slug) : '/';
}

function gallery_storage_dir(): string
{
    return base_path('public/images');
}

function default_categories(): array
{
    return [
        [
            'slug' => 'new-builds',
            'title' => 'New Builds',
            'nav_label' => 'New Builds',
            'tag' => 'Tiny homes & new construction',
            'description' => 'Custom new builds and tiny homes designed for modern living across Adelaide and surrounding regions.',
            'page_intro' => 'Explore our range of one, two, and three bedroom tiny home designs — quality construction with flexible layouts.',
            'features' => ['One to three bedroom options', 'Quality materials & finishes', 'Dedicated project manager'],
            'featured' => true,
            'badge' => 'Popular',
            'preview_image' => 'tiny-home.png',
            'preview_focus_x' => 50,
            'preview_focus_y' => 50,
            'visible' => true,
            'gallery' => [],
        ],
        [
            'slug' => 'upgrades',
            'title' => 'Upgrades',
            'nav_label' => 'Upgrades',
            'tag' => 'Kitchens & bathrooms',
            'description' => 'Kitchen, bathroom, and interior upgrades that add value and liveability to your home.',
            'page_intro' => 'From full kitchen renovations to bathroom refreshes — we deliver upgrades on time and on budget.',
            'features' => ['Kitchen renovations', 'Bathroom upgrades', 'Interior improvements'],
            'featured' => false,
            'badge' => '',
            'preview_image' => 'kitchen1.png',
            'preview_focus_x' => 50,
            'preview_focus_y' => 50,
            'visible' => true,
            'gallery' => [],
        ],
        [
            'slug' => 'restorations',
            'title' => 'Restorations',
            'nav_label' => 'Restorations',
            'tag' => 'Heritage & character homes',
            'description' => 'Sensitive restoration work that preserves character while improving function and durability.',
            'page_intro' => 'We restore heritage and character homes with care — balancing authenticity with modern standards.',
            'features' => ['Heritage-sensitive work', 'Structural repairs', 'Period-appropriate finishes'],
            'featured' => false,
            'badge' => '',
            'preview_image' => 'kitchen-restore.png',
            'preview_focus_x' => 50,
            'preview_focus_y' => 50,
            'visible' => true,
            'gallery' => [],
        ],
        [
            'slug' => 'one-bedroom',
            'title' => 'One Bedroom',
            'nav_label' => 'One Bedroom',
            'tag' => 'Compact tiny home',
            'description' => 'Efficient one bedroom tiny home designs for compact sites and simplified living.',
            'page_intro' => 'Smart one bedroom layouts with quality finishes — ideal for granny flats, downsizers, and investment properties.',
            'features' => ['Compact footprint', 'Quality finishes', 'Flexible site options'],
            'featured' => false,
            'badge' => '',
            'preview_image' => 'one-bedroom/exterior-alt.png',
            'preview_focus_x' => 50,
            'preview_focus_y' => 50,
            'visible' => true,
            'gallery' => [],
        ],
        [
            'slug' => 'two-bedroom',
            'title' => 'Two Bedroom',
            'nav_label' => 'Two Bedroom',
            'tag' => 'Family-friendly tiny home',
            'description' => 'Two bedroom tiny home designs with flexible living spaces for couples and small families.',
            'page_intro' => 'Spacious two bedroom layouts with contemporary finishes and practical floor plans.',
            'features' => ['Two bedrooms', 'Open living', 'Outdoor connection'],
            'featured' => false,
            'badge' => '',
            'preview_image' => 'two-bedroom/exterior.png',
            'preview_focus_x' => 50,
            'preview_focus_y' => 50,
            'visible' => true,
            'gallery' => [],
        ],
        [
            'slug' => 'three-bedroom',
            'title' => 'Three Bedroom',
            'nav_label' => 'Three Bedroom',
            'tag' => 'Premium tiny home',
            'description' => 'Our most spacious tiny home — three bedrooms for families who need room without a full-scale build.',
            'page_intro' => 'Premium three bedroom designs with generous living zones and quality architectural detail.',
            'features' => ['Three bedrooms', 'Premium finishes', 'Family-sized living'],
            'featured' => false,
            'badge' => '',
            'preview_image' => 'three-bedroom/exterior.png',
            'preview_focus_x' => 50,
            'preview_focus_y' => 50,
            'visible' => true,
            'gallery' => [],
        ],
    ];
}

function category_image_assignments(): array
{
    return [
        'new-builds' => ['tiny-home.png', 'two-bedroom/exterior.png', 'three-bedroom/exterior.png'],
        'upgrades' => ['kitchen1.png', 'bathroom1.png', 'bathroom3.png'],
        'restorations' => ['kitchen-restore.png', 'tiny-home.png'],
        'one-bedroom' => ['one-bedroom/exterior-alt.png', 'one-bedroom/interior.png'],
        'two-bedroom' => ['two-bedroom/exterior.png', 'two-bedroom/interior.png'],
        'three-bedroom' => ['three-bedroom/exterior.png', 'three-bedroom/interior.png'],
    ];
}

function gallery_item_from_file(string $file, array $captions, array $wideFiles): array
{
    $caption = $captions[$file] ?? ucwords(str_replace(['_', '-'], ' ', pathinfo($file, PATHINFO_FILENAME)));
    $wide = in_array($file, $wideFiles, true);
    return normalize_gallery_item([
        'file' => $file,
        'alt' => $caption,
        'caption' => $caption,
        'wide' => $wide,
        'visible' => true,
    ]);
}

function gallery_crop_aspect(array $item, bool $isHomepage = false): float
{
    $preset = gallery_tile_preset_for_item($item, $isHomepage);
    return (float) $preset['aspect'];
}

function gallery_tile_presets(bool $includeHomepage = true): array
{
    $presets = [
        'portrait' => [
            'id' => 'portrait',
            'label' => 'Portrait tile',
            'ratio' => '3:4',
            'description' => 'Standard gallery tile',
            'aspect' => 3 / 4,
            'orientation' => 'portrait',
            'wide' => false,
        ],
        'landscape' => [
            'id' => 'landscape',
            'label' => 'Landscape tile',
            'ratio' => '16:9',
            'description' => 'Standard gallery tile',
            'aspect' => 16 / 9,
            'orientation' => 'landscape',
            'wide' => false,
        ],
        'wide' => [
            'id' => 'wide',
            'label' => 'Wide tile',
            'ratio' => '2:1',
            'description' => 'Double-width gallery tile',
            'aspect' => 2 / 1,
            'orientation' => 'landscape',
            'wide' => true,
        ],
    ];

    if ($includeHomepage) {
        $presets = ['homepage' => [
            'id' => 'homepage',
            'label' => 'Home page card',
            'ratio' => '16:9',
            'description' => 'What we do grid preview',
            'aspect' => 16 / 9,
            'orientation' => 'landscape',
            'wide' => false,
            'homepage_only' => true,
        ]] + $presets;
    }

    return $presets;
}

function gallery_tile_preset_id(array $item, bool $isHomepage = false): string
{
    if ($isHomepage || !empty($item['is_homepage'])) {
        return 'homepage';
    }
    if (($item['orientation'] ?? '') === 'portrait') {
        return 'portrait';
    }
    if (!empty($item['wide'])) {
        return 'wide';
    }
    return 'landscape';
}

function gallery_tile_preset_for_item(array $item, bool $isHomepage = false): array
{
    $presets = gallery_tile_presets(true);
    $id = gallery_tile_preset_id($item, $isHomepage);
    return $presets[$id] ?? $presets['landscape'];
}

function normalize_crop_zoom(mixed $value, float $default = 1.0): float
{
    if ($value === '' || $value === null) {
        return $default;
    }
    $zoom = (float) $value;
    if ($zoom > 10) {
        $zoom = $zoom / 100;
    }
    return round(max(1.0, min(3.0, $zoom)), 3);
}

function normalize_crop_offset(mixed $value, float $default = 0.0): float
{
    if ($value === '' || $value === null) {
        return $default;
    }
    return round(max(-1.0, min(1.0, (float) $value)), 4);
}

function migrate_legacy_crop(array $item): array
{
    if (array_key_exists('crop_x', $item) || array_key_exists('crop_y', $item)) {
        return $item;
    }
    $focusX = (int) ($item['focus_x'] ?? 50);
    $focusY = (int) ($item['focus_y'] ?? 50);
    $focusZoom = (int) ($item['focus_zoom'] ?? 100);
    $item['crop_x'] = round((($focusX - 50) / 50) * 0.85, 4);
    $item['crop_y'] = round((($focusY - 50) / 50) * 0.85, 4);
    $item['crop_zoom'] = normalize_crop_zoom($focusZoom);
    return $item;
}

function normalize_gallery_item(array $item): array
{
    $item = migrate_legacy_crop($item);
    $orientation = $item['orientation'] ?? '';
    if (!in_array($orientation, ['landscape', 'portrait'], true)) {
        $orientation = !empty($item['wide']) ? 'landscape' : 'portrait';
    }

    $visible = !array_key_exists('visible', $item) || !empty($item['visible']);
    if (array_key_exists('show_in_gallery', $item) && empty($item['show_in_gallery'])) {
        $visible = false;
    }

    $isHomepage = !empty($item['is_homepage']);
    $aspect = gallery_crop_aspect($item, $isHomepage);
    $cropX = normalize_crop_offset($item['crop_x'] ?? 0);
    $cropY = normalize_crop_offset($item['crop_y'] ?? 0);
    $cropZoom = normalize_crop_zoom($item['crop_zoom'] ?? 1);

    return [
        'file' => basename((string) ($item['file'] ?? '')),
        'alt' => (string) ($item['alt'] ?? ''),
        'caption' => (string) ($item['caption'] ?? ''),
        'wide' => !empty($item['wide']),
        'visible' => $visible,
        'is_homepage' => $isHomepage,
        'crop_x' => $cropX,
        'crop_y' => $cropY,
        'crop_zoom' => $cropZoom,
        'crop_x_mobile' => normalize_crop_offset($item['crop_x_mobile'] ?? $cropX),
        'crop_y_mobile' => normalize_crop_offset($item['crop_y_mobile'] ?? $cropY),
        'crop_zoom_mobile' => normalize_crop_zoom($item['crop_zoom_mobile'] ?? $cropZoom),
        'aspect_ratio' => round((float) ($item['aspect_ratio'] ?? $aspect), 4),
        'cropped_area_pixels' => is_string($item['cropped_area_pixels'] ?? null)
            ? $item['cropped_area_pixels']
            : (is_array($item['cropped_area_pixels'] ?? null) ? json_encode($item['cropped_area_pixels']) : ''),
        'focus_x' => (int) round(50 + $cropX * 50),
        'focus_y' => (int) round(50 + $cropY * 50),
        'focus_zoom' => (int) round($cropZoom * 100),
        'orientation' => $isHomepage ? 'landscape' : $orientation,
    ];
}

function sync_category_preview(array &$category): void
{
    $homepage = null;
    foreach ($category['gallery'] ?? [] as $item) {
        if (!empty($item['is_homepage'])) {
            $homepage = $item;
            break;
        }
    }

    if ($homepage !== null) {
        $category['preview_image'] = $homepage['file'];
        $category['preview_focus_x'] = $homepage['focus_x'];
        $category['preview_focus_y'] = $homepage['focus_y'];
        $category['preview_focus_zoom'] = $homepage['focus_zoom'];
        $category['preview_crop_x'] = $homepage['crop_x'];
        $category['preview_crop_y'] = $homepage['crop_y'];
        $category['preview_crop_zoom'] = $homepage['crop_zoom'];
        $category['preview_crop_x_mobile'] = $homepage['crop_x_mobile'];
        $category['preview_crop_y_mobile'] = $homepage['crop_y_mobile'];
        $category['preview_crop_zoom_mobile'] = $homepage['crop_zoom_mobile'];
        $category['preview_aspect_ratio'] = $homepage['aspect_ratio'];
        return;
    }

    $previewFile = $category['preview_image'] ?? '';
    if ($previewFile !== '') {
        foreach ($category['gallery'] ?? [] as &$item) {
            if (($item['file'] ?? '') === $previewFile) {
                $item['is_homepage'] = true;
                $homepage = $item;
                break;
            }
        }
        unset($item);
    }

    if ($homepage !== null) {
        $category['preview_image'] = $homepage['file'];
        $category['preview_focus_x'] = $homepage['focus_x'];
        $category['preview_focus_y'] = $homepage['focus_y'];
        $category['preview_focus_zoom'] = $homepage['focus_zoom'];
        $category['preview_crop_x'] = $homepage['crop_x'];
        $category['preview_crop_y'] = $homepage['crop_y'];
        $category['preview_crop_zoom'] = $homepage['crop_zoom'];
        $category['preview_crop_x_mobile'] = $homepage['crop_x_mobile'];
        $category['preview_crop_y_mobile'] = $homepage['crop_y_mobile'];
        $category['preview_crop_zoom_mobile'] = $homepage['crop_zoom_mobile'];
        $category['preview_aspect_ratio'] = $homepage['aspect_ratio'];
        return;
    }

    $previewFile = basename((string) ($category['preview_image'] ?? ''));
    if ($previewFile !== '' && is_file(gallery_storage_dir() . DIRECTORY_SEPARATOR . $previewFile)) {
        return;
    }

    $gallery = $category['gallery'] ?? [];
    if ($gallery !== []) {
        $category['gallery'][0] = normalize_gallery_item(array_merge($gallery[0], ['is_homepage' => true]));
        $homepage = $category['gallery'][0];
        $category['preview_image'] = $homepage['file'];
        $category['preview_focus_x'] = $homepage['focus_x'];
        $category['preview_focus_y'] = $homepage['focus_y'];
        $category['preview_focus_zoom'] = $homepage['focus_zoom'];
        $category['preview_crop_x'] = $homepage['crop_x'];
        $category['preview_crop_y'] = $homepage['crop_y'];
        $category['preview_crop_zoom'] = $homepage['crop_zoom'];
        $category['preview_crop_x_mobile'] = $homepage['crop_x_mobile'];
        $category['preview_crop_y_mobile'] = $homepage['crop_y_mobile'];
        $category['preview_crop_zoom_mobile'] = $homepage['crop_zoom_mobile'];
        $category['preview_aspect_ratio'] = $homepage['aspect_ratio'];
        return;
    }

    $category['preview_image'] = '';
    $category['preview_focus_x'] = max(0, min(100, (int) ($category['preview_focus_x'] ?? 50)));
    $category['preview_focus_y'] = max(0, min(100, (int) ($category['preview_focus_y'] ?? 50)));
    $category['preview_focus_zoom'] = max(100, min(300, (int) ($category['preview_focus_zoom'] ?? 100)));
}

function image_focus_style(array $item): string
{
    $item = migrate_legacy_crop($item);
    $x = normalize_crop_offset($item['crop_x'] ?? 0);
    $y = normalize_crop_offset($item['crop_y'] ?? 0);
    $zoom = normalize_crop_zoom($item['crop_zoom'] ?? 1);
    // Negate offsets: crop_x/y follow editor pan (image drag), object-position is the inverse axis.
    $posX = 50 - ($x * 45);
    $posY = 50 - ($y * 45);
    $style = 'object-position: ' . round($posX, 2) . '% ' . round($posY, 2) . '%;';
    if ($zoom > 1) {
        $style .= ' transform: scale(' . round($zoom, 3) . '); transform-origin: ' . round($posX, 2) . '% ' . round($posY, 2) . '%;';
    }
    return $style;
}

function image_crop_data(array $item, bool $isHomepage = false): array
{
    $item = normalize_gallery_item(array_merge($item, ['is_homepage' => $isHomepage]));
    return [
        'crop_x' => $item['crop_x'],
        'crop_y' => $item['crop_y'],
        'crop_zoom' => $item['crop_zoom'],
        'aspect_ratio' => gallery_crop_aspect($item, $isHomepage),
    ];
}

function image_crop_attrs(array $item, bool $isHomepage = false): string
{
    $item = normalize_gallery_item(array_merge($item, ['is_homepage' => $isHomepage]));
    $aspect = gallery_crop_aspect($item, $isHomepage);
    return 'data-crop-x="' . h((string) $item['crop_x']) . '" '
        . 'data-crop-y="' . h((string) $item['crop_y']) . '" '
        . 'data-crop-zoom="' . h((string) $item['crop_zoom']) . '" '
        . 'data-crop-x-mobile="' . h((string) $item['crop_x_mobile']) . '" '
        . 'data-crop-y-mobile="' . h((string) $item['crop_y_mobile']) . '" '
        . 'data-crop-zoom-mobile="' . h((string) $item['crop_zoom_mobile']) . '" '
        . 'data-aspect="' . h((string) round($aspect, 4)) . '"';
}

function preview_crop_attrs(array $category): string
{
    return image_crop_attrs([
        'crop_x' => $category['preview_crop_x'] ?? 0,
        'crop_y' => $category['preview_crop_y'] ?? 0,
        'crop_zoom' => $category['preview_crop_zoom'] ?? 1,
        'crop_x_mobile' => $category['preview_crop_x_mobile'] ?? $category['preview_crop_x'] ?? 0,
        'crop_y_mobile' => $category['preview_crop_y_mobile'] ?? $category['preview_crop_y'] ?? 0,
        'crop_zoom_mobile' => $category['preview_crop_zoom_mobile'] ?? $category['preview_crop_zoom'] ?? 1,
        'focus_x' => $category['preview_focus_x'] ?? 50,
        'focus_y' => $category['preview_focus_y'] ?? 50,
        'focus_zoom' => $category['preview_focus_zoom'] ?? 100,
    ], true);
}

function gallery_captions(): array
{
    return [
        'demo-web-1.svg' => 'Web design sample one',
        'demo-web-2.svg' => 'Web design sample two',
        'demo-web-3.svg' => 'Web design sample three',
        'demo-photo-1.svg' => 'Photography sample one',
        'demo-photo-2.svg' => 'Photography sample two',
        'demo-consult-1.svg' => 'Consulting sample',
    ];
}

function merge_category_defaults(array $defaults, array $saved): array
{
    $merged = array_replace_recursive($defaults, $saved);
    if (array_key_exists('gallery', $saved)) {
        $merged['gallery'] = $saved['gallery'];
    }
    if (($merged['preview_image'] ?? '') === '' && ($defaults['preview_image'] ?? '') !== '') {
        $merged['preview_image'] = $defaults['preview_image'];
    }
    return $merged;
}

function merge_category_lists(array $defaultCategories, array $savedCategories): array
{
    $defaultsBySlug = [];
    foreach ($defaultCategories as $default) {
        $slug = (string) ($default['slug'] ?? '');
        if ($slug !== '') {
            $defaultsBySlug[$slug] = $default;
        }
    }

    $customDefaults = [
        'visible' => false,
        'gallery' => [],
        'preview_focus_x' => 50,
        'preview_focus_y' => 50,
        'preview_focus_zoom' => 100,
        'featured' => false,
        'badge' => '',
        'features' => [],
    ];

    $merged = [];
    $seen = [];
    foreach ($savedCategories as $saved) {
        if (!is_array($saved) || empty($saved['slug'])) {
            continue;
        }
        $slug = (string) $saved['slug'];
        if (isset($seen[$slug])) {
            continue;
        }
        $seen[$slug] = true;
        $default = $defaultsBySlug[$slug] ?? $customDefaults;
        $merged[] = merge_category_defaults($default, $saved);
    }

    foreach ($defaultCategories as $default) {
        $slug = (string) ($default['slug'] ?? '');
        if ($slug !== '' && empty($seen[$slug])) {
            $merged[] = merge_category_defaults($default, []);
        }
    }

    return $merged;
}

function seed_category_galleries(array $categories): array
{
    $assignments = category_image_assignments();
    $captions = gallery_captions();
    $wideFiles = ['demo-web-1.svg'];

    foreach ($categories as &$category) {
        if (!empty($category['gallery'])) {
            continue;
        }
        $slug = $category['slug'] ?? '';
        $files = $assignments[$slug] ?? [];
        $category['gallery'] = [];
        foreach ($files as $file) {
            if (is_file(gallery_storage_dir() . DIRECTORY_SEPARATOR . $file)) {
                $category['gallery'][] = gallery_item_from_file($file, $captions, $wideFiles);
            }
        }
    }
    unset($category);

    return $categories;
}

function migrate_legacy_gallery(array $content): array
{
    $hasLegacyGallery = !empty($content['gallery']['items']);
    $hasLegacyServices = !empty($content['services']['items']);

    if ($hasLegacyGallery || $hasLegacyServices) {
        $categories = default_categories();
        $legacyItems = $content['gallery']['items'] ?? [];
        $fileToCategory = [];
        foreach (category_image_assignments() as $slug => $files) {
            foreach ($files as $file) {
                $fileToCategory[$file] = $slug;
            }
        }

        if ($legacyItems !== []) {
            foreach ($legacyItems as $item) {
                if (!is_array($item) || empty($item['file'])) {
                    continue;
                }
                $slug = $fileToCategory[$item['file']] ?? 'consulting';
                foreach ($categories as &$category) {
                    if (($category['slug'] ?? '') === $slug) {
                        $category['gallery'][] = $item;
                        break;
                    }
                }
                unset($category);
            }
        }

        if ($hasLegacyServices) {
            foreach ($content['services']['items'] as $legacyService) {
                $id = $legacyService['id'] ?? '';
                foreach ($categories as &$category) {
                    if (($category['slug'] ?? '') === $id) {
                        $category = array_replace_recursive($category, [
                            'title' => $legacyService['title'] ?? $category['title'],
                            'tag' => $legacyService['tag'] ?? $category['tag'],
                            'description' => $legacyService['description'] ?? $category['description'],
                            'features' => $legacyService['features'] ?? $category['features'],
                            'featured' => $legacyService['featured'] ?? $category['featured'],
                            'badge' => $legacyService['badge'] ?? $category['badge'],
                        ]);
                    }
                }
                unset($category);
            }
        }

        $content['categories'] = seed_category_galleries($categories);
        unset($content['gallery']);
        if (isset($content['services']['items'])) {
            unset($content['services']['items']);
        }
    }

    $content['categories'] = ensure_all_categories($content['categories'] ?? []);
    unset($content['gallery']);

    return $content;
}

function ensure_all_categories(array $categories): array
{
    $defaultsBySlug = [];
    foreach (default_categories() as $default) {
        $defaultsBySlug[$default['slug']] = $default;
    }

    $customDefaults = [
        'visible' => false,
        'gallery' => [],
        'preview_focus_x' => 50,
        'preview_focus_y' => 50,
        'preview_focus_zoom' => 100,
        'featured' => false,
        'badge' => '',
        'features' => [],
    ];

    $merged = [];
    $seen = [];
    foreach ($categories as $category) {
        $slug = (string) ($category['slug'] ?? '');
        if ($slug === '' || isset($seen[$slug])) {
            continue;
        }
        $seen[$slug] = true;
        $default = $defaultsBySlug[$slug] ?? $customDefaults;
        $merged[] = merge_category_defaults($default, $category);
    }

    foreach (default_categories() as $default) {
        $slug = (string) $default['slug'];
        if (empty($seen[$slug])) {
            $merged[] = merge_category_defaults($default, []);
        }
    }

    return seed_category_galleries($merged);
}

function reorder_categories(array $categories, array $order): array
{
    $bySlug = [];
    foreach ($categories as $category) {
        $slug = (string) ($category['slug'] ?? '');
        if ($slug !== '') {
            $bySlug[$slug] = $category;
        }
    }

    $reordered = [];
    $seen = [];
    foreach ($order as $slug) {
        $slug = sanitize_text((string) $slug, 80);
        if ($slug === '' || !isset($bySlug[$slug]) || isset($seen[$slug])) {
            continue;
        }
        $seen[$slug] = true;
        $reordered[] = $bySlug[$slug];
    }

    foreach ($categories as $category) {
        $slug = (string) ($category['slug'] ?? '');
        if ($slug !== '' && empty($seen[$slug])) {
            $reordered[] = $category;
        }
    }

    return $reordered;
}

function normalize_category_galleries(array $categories): array
{
    foreach ($categories as &$category) {
        $normalized = [];
        $seenFiles = [];
        foreach ($category['gallery'] ?? [] as $item) {
            if (!is_array($item) || empty($item['file'])) {
                continue;
            }
            $file = basename((string) $item['file']);
            if ($file === '' || isset($seenFiles[$file])) {
                continue;
            }
            $seenFiles[$file] = true;
            $normalized[] = normalize_gallery_item($item);
        }
        $category['gallery'] = $normalized;
        sync_category_preview($category);
        if (!array_key_exists('visible', $category)) {
            $category['visible'] = true;
        }
    }
    unset($category);
    return $categories;
}

function visible_gallery_items(array $category): array
{
    return array_values(array_filter(
        $category['gallery'] ?? [],
        static fn($item) => !empty($item['visible'])
    ));
}

function visible_categories(array $categories): array
{
    return array_values(array_filter(
        $categories,
        static fn($category) => !empty($category['visible'])
    ));
}

function slugify_category_title(string $title): string
{
    $slug = strtolower(trim($title));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    return $slug !== '' ? $slug : 'category';
}

function get_public_category_by_slug(string $slug): ?array
{
    $category = get_category_by_slug($slug);
    if ($category === null || empty($category['visible'])) {
        return null;
    }
    return $category;
}

function get_category_by_slug(string $slug): ?array
{
    foreach (load_content()['categories'] as $category) {
        if (($category['slug'] ?? '') === $slug) {
            return $category;
        }
    }
    return null;
}

function image_url(string $file): string
{
    $parts = explode('/', str_replace('\\', '/', $file));
    $encoded = implode('/', array_map('rawurlencode', $parts));

    return '/images/' . $encoded;
}

function preview_focus_style(array $category): string
{
    return image_focus_style([
        'crop_x' => $category['preview_crop_x'] ?? null,
        'crop_y' => $category['preview_crop_y'] ?? null,
        'crop_zoom' => $category['preview_crop_zoom'] ?? null,
        'focus_x' => $category['preview_focus_x'] ?? 50,
        'focus_y' => $category['preview_focus_y'] ?? 50,
        'focus_zoom' => $category['preview_focus_zoom'] ?? 100,
    ]);
}

function gallery_item_classes(array $item): string
{
    $classes = ['gallery-item'];
    $orientation = $item['orientation'] ?? 'landscape';
    if ($orientation === 'portrait') {
        $classes[] = 'gallery-item--portrait';
    } else {
        $classes[] = 'gallery-item--landscape';
        if (!empty($item['wide'])) {
            $classes[] = 'gallery-item--wide';
        }
    }
    return implode(' ', $classes);
}

function category_gallery_files(array $category): array
{
    $files = [];
    foreach ($category['gallery'] ?? [] as $item) {
        if (!empty($item['file'])) {
            $files[$item['file']] = true;
        }
    }
    if (!empty($category['preview_image'])) {
        $files[$category['preview_image']] = true;
    }
    return array_keys($files);
}

function gallery_wide_files(): array
{
    return ['demo-web-1.svg'];
}

function replenish_category_gallery(array &$category): bool
{
    $assignments = category_image_assignments();
    $slug = $category['slug'] ?? '';
    $defaultFiles = $assignments[$slug] ?? [];
    if ($defaultFiles === []) {
        return false;
    }

    $existing = [];
    foreach ($category['gallery'] ?? [] as $item) {
        $file = basename((string) ($item['file'] ?? ''));
        if ($file !== '') {
            $existing[$file] = true;
        }
    }

    $availableDefaults = array_values(array_filter(
        $defaultFiles,
        static fn(string $file): bool => is_file(gallery_storage_dir() . DIRECTORY_SEPARATOR . $file)
    ));
    if ($availableDefaults === []) {
        return false;
    }

    $missing = array_values(array_filter(
        $availableDefaults,
        static fn(string $file): bool => empty($existing[$file])
    ));
    if ($missing === []) {
        return false;
    }

    $galleryCount = count($category['gallery'] ?? []);
    if ($galleryCount !== 0) {
        return false;
    }

    $captions = gallery_captions();
    $wideFiles = gallery_wide_files();
    foreach ($missing as $file) {
        $category['gallery'][] = gallery_item_from_file($file, $captions, $wideFiles);
    }
    sync_category_preview($category);

    return true;
}

function service_icon_svg(string $slug): string
{
    if ($slug === 'web-design') {
        return '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="10" width="32" height="24" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 16h32M14 12v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }
    if ($slug === 'photography') {
        return '<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="14" width="28" height="20" rx="3" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2"/><circle cx="34" cy="18" r="2" fill="currentColor"/></svg>';
    }
    if ($slug === 'consulting') {
        return '<svg viewBox="0 0 48 48" fill="none"><path d="M12 34V18l12-8 12 8v16" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M20 34v-8h8v8" stroke="currentColor" stroke-width="2"/></svg>';
    }
    return '<svg viewBox="0 0 48 48" fill="none"><path d="M8 32l12-20 8 12 12-16 8 24H8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
}
