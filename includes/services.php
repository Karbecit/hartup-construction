<?php

declare(strict_types=1);

require_once __DIR__ . '/sections.php';
require_once __DIR__ . '/design-defaults.php';

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
                    'id' => 'new_builds_bedroom_tiles',
                    'type' => 'service_tiles',
                    'enabled' => true,
                    'eyebrow' => 'Configurations',
                    'heading' => 'Choose Your Bedroom Layout',
                    'paragraphs' => [
                        'Explore our one, two, and three bedroom tiny home configurations to find the right fit for your lifestyle.',
                    ],
                    'tiles' => [
                        [
                            'service_slug' => 'one-bedroom',
                            'label' => 'One Bedroom',
                            'image' => [
                                'file' => 'one-bedroom/exterior-alt.jpg',
                                'alt' => 'One bedroom tiny home exterior with timber cladding and deck',
                            ],
                        ],
                        [
                            'service_slug' => 'two-bedroom',
                            'label' => 'Two Bedroom',
                            'image' => [
                                'file' => 'two-bedroom/exterior-alt.jpg',
                                'alt' => 'Two bedroom tiny home exterior with timber cladding and deck',
                            ],
                        ],
                        [
                            'service_slug' => 'three-bedroom',
                            'label' => 'Three Bedroom',
                            'image' => [
                                'file' => 'three-bedroom/exterior-alt.jpg',
                                'alt' => 'Three bedroom tiny home exterior with timber cladding and deck',
                            ],
                        ],
                    ],
                ],
            ]),
        ],
        default_bedroom_service(
            [
                'slug' => 'one-bedroom',
                'title' => 'One Bedroom',
                'nav_label' => 'One Bedroom',
                'href' => '/one-bedroom',
                'tag' => 'New Builds',
                'description' => 'Our one bedroom tiny home delivers smart, efficient living in a compact footprint — perfect for singles, couples, granny flats, or investment properties.',
                'in_menu' => true,
                'menu_order' => 11,
                'parent_slug' => 'new-builds',
                'visible' => true,
            ],
            [
                [
                    'id' => 'one_bedroom_intro_1',
                    'eyebrow' => 'Compact Living',
                    'heading' => 'Maximum Comfort in Minimal Space',
                    'paragraphs' => [
                        'The one bedroom configuration is our most compact option, designed to maximise every square metre without compromising on comfort or style. Open-plan living flows seamlessly into a dedicated bedroom and fully functional kitchen and bathroom.',
                    ],
                    'image_position' => 'left',
                    'image' => [
                        'file' => 'one-bedroom/exterior.jpg',
                        'alt' => 'One bedroom tiny home exterior with timber cladding and deck',
                    ],
                ],
                [
                    'id' => 'one_bedroom_intro_2',
                    'eyebrow' => 'Smart Design',
                    'heading' => 'Built for Everyday Living',
                    'paragraphs' => [
                        'Every Hartup one bedroom design features open-plan living and dining, a separate bedroom with built-in storage, and a contemporary kitchen and bathroom — all finished with quality materials selected for durability and low maintenance.',
                    ],
                    'image_position' => 'right',
                    'image' => [
                        'file' => 'one-bedroom/exterior-alt.jpg',
                        'alt' => 'One bedroom tiny home alternate exterior view with timber deck',
                    ],
                ],
                [
                    'id' => 'one_bedroom_intro_3',
                    'eyebrow' => 'Versatile Use',
                    'heading' => 'Ideal for Any Setting',
                    'paragraphs' => [
                        'From granny flats and guest accommodation to rural retreats and investment properties, our one bedroom tiny homes adapt to your lifestyle. Customisable finishes, colours, and layout options ensure your home reflects your vision.',
                    ],
                    'image_position' => 'left',
                    'image' => [
                        'file' => 'one-bedroom/floorplan.jpg',
                        'alt' => 'One bedroom tiny home floorplan layout',
                    ],
                ],
            ],
            ['two-bedroom', 'three-bedroom']
        ),
        default_bedroom_service(
            [
                'slug' => 'two-bedroom',
                'title' => 'Two Bedroom',
                'nav_label' => 'Two Bedroom',
                'href' => '/two-bedroom',
                'tag' => 'New Builds',
                'description' => 'Our two bedroom tiny home offers the perfect balance of space and efficiency — ideal for small families, couples who want a home office, or rental investment properties.',
                'in_menu' => true,
                'menu_order' => 12,
                'parent_slug' => 'new-builds',
                'visible' => true,
            ],
            [
                [
                    'id' => 'two_bedroom_intro_1',
                    'eyebrow' => 'Versatile Space',
                    'heading' => 'Room to Grow and Adapt',
                    'paragraphs' => [
                        'The two bedroom configuration adds an extra room without sacrificing the smart design principles that define every Hartup tiny home. Whether you need a second bedroom, a home office, or guest accommodation, this layout adapts to your lifestyle.',
                    ],
                    'image_position' => 'left',
                    'image' => [
                        'file' => 'two-bedroom/exterior.jpg',
                        'alt' => 'Two bedroom tiny home exterior with timber cladding and deck',
                    ],
                ],
                [
                    'id' => 'two_bedroom_intro_2',
                    'eyebrow' => 'Family Friendly',
                    'heading' => 'Designed for Modern Households',
                    'paragraphs' => [
                        'Spacious open-plan living, dining, and kitchen areas flow into two separate bedrooms with built-in storage. Optional ensuite layouts and flexible floor plans make this configuration a popular choice for small families and rental investors.',
                    ],
                    'image_position' => 'right',
                    'image' => [
                        'file' => 'two-bedroom/exterior-alt.jpg',
                        'alt' => 'Two bedroom tiny home alternate exterior view with timber deck',
                    ],
                ],
                [
                    'id' => 'two_bedroom_intro_3',
                    'eyebrow' => 'Investment Ready',
                    'heading' => 'Built for Long-Term Value',
                    'paragraphs' => [
                        'Energy-efficient insulation, quality fixtures, and contemporary external finishes ensure your two bedroom tiny home delivers strong returns — whether as a primary residence, granny flat, or holiday rental.',
                    ],
                    'image_position' => 'left',
                    'image' => [
                        'file' => 'two-bedroom/floorplan.jpg',
                        'alt' => 'Two bedroom tiny home floorplan layout',
                    ],
                ],
            ],
            ['one-bedroom', 'three-bedroom']
        ),
        default_bedroom_service(
            [
                'slug' => 'three-bedroom',
                'title' => 'Three Bedroom',
                'nav_label' => 'Three Bedroom',
                'href' => '/three-bedroom',
                'tag' => 'New Builds',
                'description' => 'Our largest tiny home configuration — three bedrooms of smart, efficient living designed for families, multi-generational households, or high-yield investment properties.',
                'in_menu' => true,
                'menu_order' => 13,
                'parent_slug' => 'new-builds',
                'visible' => true,
            ],
            [
                [
                    'id' => 'three_bedroom_intro_1',
                    'eyebrow' => 'Family Sized',
                    'heading' => 'Compact Living Without Compromise',
                    'paragraphs' => [
                        'The three bedroom configuration proves that tiny home living does not mean sacrificing space. With three dedicated bedrooms, a full kitchen, and well-appointed bathrooms, this layout delivers genuine family accommodation in an efficient, affordable package.',
                    ],
                    'image_position' => 'left',
                    'image' => [
                        'file' => 'three-bedroom/exterior.jpg',
                        'alt' => 'Three bedroom tiny home exterior with timber cladding and deck',
                    ],
                ],
                [
                    'id' => 'three_bedroom_intro_2',
                    'eyebrow' => 'Thoughtful Layout',
                    'heading' => 'Space for Everyone',
                    'paragraphs' => [
                        'Generous open-plan living, dining, and kitchen zones connect to three separate bedrooms — each with built-in wardrobe storage. Master bedroom ensuite options and flexible floor plans accommodate growing families and multi-generational living.',
                    ],
                    'image_position' => 'right',
                    'image' => [
                        'file' => 'three-bedroom/exterior-alt.jpg',
                        'alt' => 'Three bedroom tiny home alternate exterior view with timber deck',
                    ],
                ],
                [
                    'id' => 'three_bedroom_intro_3',
                    'eyebrow' => 'Premium Build',
                    'heading' => 'Quality That Lasts',
                    'paragraphs' => [
                        'Energy-efficient insulation, ventilation, and LED lighting combine with contemporary external finishes and large glazed openings. Every three bedroom Hartup tiny home is built to Australian standards with a comprehensive workmanship warranty.',
                    ],
                    'image_position' => 'left',
                    'image' => [
                        'file' => 'three-bedroom/floorplan.jpg',
                        'alt' => 'Three bedroom tiny home floorplan layout',
                    ],
                ],
            ],
            ['one-bedroom', 'two-bedroom']
        ),
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
                    'image' => ['file' => 'kitchen1.jpg', 'alt' => 'Modern kitchen upgrade'],
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
                    'image' => ['file' => 'kitchen-restore.jpg', 'alt' => 'Restored property interior'],
                ],
            ]),
        ],
    ];

    return array_map('normalize_service', $services);
}

function default_bedroom_tile(string $slug): array
{
    $tiles = [
        'one-bedroom' => [
            'service_slug' => 'one-bedroom',
            'label' => 'One Bedroom',
            'image' => [
                'file' => 'one-bedroom/exterior-alt.jpg',
                'alt' => 'One bedroom tiny home exterior with timber cladding and deck',
            ],
        ],
        'two-bedroom' => [
            'service_slug' => 'two-bedroom',
            'label' => 'Two Bedroom',
            'image' => [
                'file' => 'two-bedroom/exterior-alt.jpg',
                'alt' => 'Two bedroom tiny home exterior with timber cladding and deck',
            ],
        ],
        'three-bedroom' => [
            'service_slug' => 'three-bedroom',
            'label' => 'Three Bedroom',
            'image' => [
                'file' => 'three-bedroom/exterior-alt.jpg',
                'alt' => 'Three bedroom tiny home exterior with timber cladding and deck',
            ],
        ],
    ];

    return $tiles[$slug];
}

function default_bedroom_service(array $meta, array $intros, array $otherSlugs): array
{
    $labels = [
        'one-bedroom' => '1 bedroom',
        'two-bedroom' => '2 bedroom',
        'three-bedroom' => '3 bedroom',
    ];
    $otherLabels = array_map(static fn($slug) => $labels[$slug] ?? $slug, $otherSlugs);

    $sections = [];
    foreach ($intros as $index => $intro) {
        $sections[] = array_merge($intro, [
            'type' => 'image_text',
            'background' => $index === 1 ? 'elevated' : 'default',
        ]);
    }

    $slug = (string) $meta['slug'];
    $sections[] = default_our_designs_banner($slug);
    $sections[] = default_bedroom_designs_section($slug);

    $sections[] = [
        'id' => str_replace('-', '_', $slug) . '_other_tiles',
        'type' => 'service_tiles',
        'background' => 'elevated',
        'eyebrow' => 'Explore More',
        'heading' => 'Other Configurations',
        'paragraphs' => [
            'Compare our ' . implode(' and ', $otherLabels) . ' tiny home layouts to find your ideal fit.',
        ],
        'tiles' => array_map('default_bedroom_tile', $otherSlugs),
    ];

    return array_merge($meta, ['sections' => normalize_sections($sections)]);
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
