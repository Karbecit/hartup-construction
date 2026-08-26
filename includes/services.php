<?php

declare(strict_types=1);

require_once __DIR__ . '/sections.php';

function default_services(): array
{
    $services = [
        [
            'slug' => 'new-builds',
            'title' => 'New Builds',
            'nav_label' => 'New Builds',
            'href' => '/new-builds',
            'tag' => 'Tiny homes & new construction',
            'description' => 'Custom new builds and tiny homes designed for modern living across Adelaide and surrounding regions.',
            'in_menu' => true,
            'menu_order' => 10,
            'parent_slug' => '',
            'visible' => true,
            'sections' => normalize_sections([
                [
                    'type' => 'text',
                    'heading' => 'Quality New Builds',
                    'paragraphs' => ['Explore our range of one, two, and three bedroom tiny home designs.'],
                ],
            ]),
        ],
        [
            'slug' => 'one-bedroom',
            'title' => 'One Bedroom',
            'nav_label' => 'One Bedroom',
            'href' => '/one-bedroom',
            'tag' => 'Compact tiny home',
            'description' => 'Efficient one bedroom tiny home designs for compact sites and simplified living.',
            'in_menu' => true,
            'menu_order' => 11,
            'parent_slug' => 'new-builds',
            'visible' => true,
            'sections' => [],
        ],
        [
            'slug' => 'two-bedroom',
            'title' => 'Two Bedroom',
            'nav_label' => 'Two Bedroom',
            'href' => '/two-bedroom',
            'tag' => 'Family-friendly tiny home',
            'description' => 'Two bedroom tiny home designs with flexible living spaces for couples and small families.',
            'in_menu' => true,
            'menu_order' => 12,
            'parent_slug' => 'new-builds',
            'visible' => true,
            'sections' => [],
        ],
        [
            'slug' => 'three-bedroom',
            'title' => 'Three Bedroom',
            'nav_label' => 'Three Bedroom',
            'href' => '/three-bedroom',
            'tag' => 'Premium tiny home',
            'description' => 'Our most spacious tiny home — three bedrooms for families who need room without a full-scale build.',
            'in_menu' => true,
            'menu_order' => 13,
            'parent_slug' => 'new-builds',
            'visible' => true,
            'sections' => [],
        ],
        [
            'slug' => 'kitchens',
            'title' => 'Kitchens',
            'nav_label' => 'Kitchens',
            'href' => '/upgrades',
            'tag' => 'Kitchen upgrades',
            'description' => 'Kitchen renovations and upgrades that add value and liveability to your home.',
            'in_menu' => false,
            'menu_order' => 20,
            'parent_slug' => '',
            'visible' => true,
            'sections' => [],
        ],
        [
            'slug' => 'bathrooms',
            'title' => 'Bathrooms',
            'nav_label' => 'Bathrooms',
            'href' => '/upgrades',
            'tag' => 'Bathroom upgrades',
            'description' => 'Bathroom renovations with quality fixtures and contemporary styling.',
            'in_menu' => false,
            'menu_order' => 21,
            'parent_slug' => '',
            'visible' => true,
            'sections' => [],
        ],
        [
            'slug' => 'upgrades',
            'title' => 'Upgrades',
            'nav_label' => 'Upgrades',
            'href' => '/upgrades',
            'tag' => 'Kitchens & bathrooms',
            'description' => 'Kitchen, bathroom, and interior upgrades that add value and liveability to your home.',
            'in_menu' => true,
            'menu_order' => 30,
            'parent_slug' => '',
            'visible' => true,
            'sections' => normalize_sections([
                [
                    'type' => 'image_text',
                    'heading' => 'Interior Upgrades',
                    'paragraphs' => ['From full kitchen renovations to bathroom refreshes — we deliver upgrades on time and on budget.'],
                    'image_position' => 'right',
                    'image' => ['file' => 'kitchen1.png', 'alt' => 'Modern kitchen upgrade'],
                ],
            ]),
        ],
        [
            'slug' => 'restorations',
            'title' => 'Restorations',
            'nav_label' => 'Restorations',
            'href' => '/restorations',
            'tag' => 'Heritage & character homes',
            'description' => 'Sensitive restoration work that preserves character while improving function and durability.',
            'in_menu' => true,
            'menu_order' => 40,
            'parent_slug' => '',
            'visible' => true,
            'sections' => normalize_sections([
                [
                    'type' => 'image_text',
                    'heading' => 'Property Restorations',
                    'paragraphs' => ['We restore heritage and character homes with care — balancing authenticity with modern standards.'],
                    'image_position' => 'left',
                    'image' => ['file' => 'kitchen-restore.png', 'alt' => 'Restored property interior'],
                ],
            ]),
        ],
    ];

    return array_map('normalize_service', $services);
}

function normalize_service(array $service): array
{
    return [
        'slug' => trim((string) ($service['slug'] ?? '')),
        'title' => trim((string) ($service['title'] ?? '')),
        'nav_label' => trim((string) ($service['nav_label'] ?? $service['title'] ?? '')),
        'href' => trim((string) ($service['href'] ?? '/' . ($service['slug'] ?? ''))),
        'tag' => trim((string) ($service['tag'] ?? '')),
        'description' => trim((string) ($service['description'] ?? '')),
        'in_menu' => !empty($service['in_menu']),
        'menu_order' => (int) ($service['menu_order'] ?? 0),
        'parent_slug' => trim((string) ($service['parent_slug'] ?? '')),
        'visible' => !array_key_exists('visible', $service) || !empty($service['visible']),
        'sections' => normalize_sections(is_array($service['sections'] ?? null) ? $service['sections'] : []),
    ];
}

function merge_services(array $defaults, array $saved): array
{
    $defaultBySlug = [];
    foreach ($defaults as $service) {
        $defaultBySlug[$service['slug']] = $service;
    }

    $merged = [];
    foreach ($saved as $service) {
        if (!is_array($service)) {
            continue;
        }
        $slug = trim((string) ($service['slug'] ?? ''));
        if ($slug === '') {
            continue;
        }
        $base = $defaultBySlug[$slug] ?? ['slug' => $slug];
        $combined = array_replace_recursive($base, $service);
        if (!empty($service['sections'])) {
            $combined['sections'] = merge_sections($base['sections'] ?? [], $service['sections']);
        }
        $merged[] = normalize_service($combined);
        unset($defaultBySlug[$slug]);
    }

    foreach ($defaultBySlug as $service) {
        $merged[] = $service;
    }

    usort($merged, static fn($a, $b) => ($a['menu_order'] ?? 0) <=> ($b['menu_order'] ?? 0));

    return $merged;
}

function services_for_menu(array $services): array
{
    $topLevel = array_values(array_filter(
        $services,
        static fn($service) => !empty($service['in_menu']) && !empty($service['visible']) && ($service['parent_slug'] ?? '') === ''
    ));

    usort($topLevel, static fn($a, $b) => ($a['menu_order'] ?? 0) <=> ($b['menu_order'] ?? 0));

    return array_map(static function (array $service) use ($services) {
        $children = array_values(array_filter(
            $services,
            static fn($child) => !empty($child['in_menu'])
                && !empty($child['visible'])
                && ($child['parent_slug'] ?? '') === $service['slug']
        ));
        usort($children, static fn($a, $b) => ($a['menu_order'] ?? 0) <=> ($b['menu_order'] ?? 0));

        return [
            'href' => $service['href'],
            'label' => $service['nav_label'] ?: $service['title'],
            'children' => array_map(static fn($child) => [
                'href' => $child['href'],
                'label' => $child['nav_label'] ?: $child['title'],
            ], $children),
        ];
    }, $topLevel);
}

function service_by_slug(array $services, string $slug): ?array
{
    foreach ($services as $service) {
        if (($service['slug'] ?? '') === $slug) {
            return $service;
        }
    }

    return null;
}

function parse_services_from_post(array $servicesInput): array
{
    $services = [];
    if (!is_array($servicesInput)) {
        return $services;
    }

    foreach ($servicesInput as $service) {
        if (!is_array($service)) {
            continue;
        }
        $services[] = normalize_service($service);
    }

    return $services;
}

function parse_services_menu_order(array $orderSlugs): array
{
    $order = [];
    $position = 0;
    foreach ($orderSlugs as $slug) {
        $slug = trim((string) $slug);
        if ($slug !== '') {
            $order[$slug] = $position * 10;
            $position++;
        }
    }

    return $order;
}
