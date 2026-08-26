<?php

declare(strict_types=1);

require_once __DIR__ . '/sections.php';

const GENERAL_PAGE_SLUGS = ['home', 'about', 'contact'];

function default_home_sections(): array
{
    return normalize_sections([
        [
            'id' => 'home_service_tiles',
            'type' => 'service_tiles',
            'enabled' => true,
            'background' => 'default',
            'tiles' => [
                ['service_slug' => 'new-builds', 'label' => 'New Builds', 'image' => ['file' => 'tiny-home.png', 'alt' => 'Modern new home exterior']],
                ['service_slug' => 'kitchens', 'label' => 'Kitchens', 'image' => ['file' => 'kitchen1.png', 'alt' => 'Modern kitchen interior']],
                ['service_slug' => 'bathrooms', 'label' => 'Bathrooms', 'image' => ['file' => 'bathroom3.png', 'alt' => 'Modern bathroom interior']],
                ['service_slug' => 'restorations', 'label' => 'Restorations', 'image' => ['file' => 'kitchen-restore.png', 'alt' => 'Restored heritage home']],
            ],
        ],
        [
            'id' => 'home_about',
            'type' => 'image_text',
            'enabled' => true,
            'background' => 'elevated',
            'eyebrow' => 'About Hartup',
            'heading' => 'Trusted Builders, Proven Results',
            'paragraphs' => [
                'Hartup Construction is an Adelaide-based building company committed to delivering exceptional quality on every project — big or small.',
                'Our experienced team combines traditional craftsmanship with modern building techniques. We work closely with clients, architects, and subcontractors to ensure seamless project delivery from concept to completion.',
            ],
            'bullets' => [
                'Transparent quoting and project timelines',
                'Full compliance with Australian building codes',
                'Dedicated project manager on every build',
                'Comprehensive warranty on all workmanship',
            ],
            'image_position' => 'right',
            'image' => ['file' => 'tiny-home.png', 'alt' => 'Modern tiny home exterior'],
        ],
        [
            'id' => 'home_specialises',
            'type' => 'image_text',
            'enabled' => true,
            'background' => 'default',
            'eyebrow' => 'What We Do',
            'heading' => 'Hartup Construction Specialises in',
            'paragraphs' => [
                'From ground-up builds to detailed interior upgrades — tailored construction services for homes and commercial spaces throughout the Adelaide metro and surrounding areas.',
            ],
            'image_position' => 'left',
            'image' => ['file' => 'three-bedroom/exterior.png', 'alt' => 'Three bedroom tiny home exterior'],
        ],
        [
            'id' => 'home_values',
            'type' => 'image_text',
            'enabled' => true,
            'background' => 'elevated',
            'eyebrow' => 'Our Principles',
            'heading' => 'Our Values',
            'paragraphs' => [
                'Everything we build reflects what we stand for — uncompromising quality, honest communication, and a genuine commitment to our clients.',
                'At Hartup Construction, our values guide every decision on site and in the office. They shape how we treat people, how we manage projects, and how we deliver results that stand the test of time.',
            ],
            'bullets' => [
                'Quality craftsmanship in every detail, from foundation to finish',
                'Integrity and transparency in all quoting, communication, and delivery',
                'Client focus — your vision, timeline, and budget always come first',
                'Safety and compliance as non-negotiable standards on every project',
            ],
            'image_position' => 'right',
            'image' => ['file' => 'kitchen-restore.png', 'alt' => 'Restored kitchen interior'],
        ],
    ]);
}

function default_about_sections(): array
{
    return normalize_sections([
        [
            'id' => 'about_story',
            'type' => 'text',
            'enabled' => true,
            'background' => 'default',
            'eyebrow' => 'Our Story',
            'heading' => 'Who We Are',
            'paragraphs' => [
                'Hartup Construction was founded on a simple belief: every client deserves a builder who treats their project as if it were their own. From the first consultation to the final handover, we prioritise transparency, quality, and respect for your investment.',
                'Our team brings together decades of combined experience across residential, commercial, and renovation projects. We understand the South Australian building landscape — local regulations, climate considerations, and the standards that define a job well done.',
            ],
        ],
        [
            'id' => 'about_values',
            'type' => 'image_text',
            'enabled' => true,
            'background' => 'elevated',
            'eyebrow' => 'Our Values',
            'heading' => 'Built on Trust',
            'paragraphs' => [
                'Quality craftsmanship, honest communication, reliability, and safety are the foundations of every Hartup project.',
            ],
            'image_position' => 'left',
            'image' => ['file' => 'two-bedroom/exterior.png', 'alt' => 'Two bedroom tiny home exterior'],
        ],
    ]);
}

function default_contact_sections(): array
{
    return normalize_sections([
        [
            'id' => 'contact_intro',
            'type' => 'text',
            'enabled' => true,
            'background' => 'default',
            'eyebrow' => 'Get In Touch',
            'heading' => "We'd Love to Hear From You",
            'paragraphs' => [
                'Whether you\'re at the early planning stage or ready to break ground, our team is here to help. Fill in the form and we\'ll get back to you within one business day.',
            ],
        ],
    ]);
}

function default_pages(): array
{
    return [
        'home' => [
            'slug' => 'home',
            'title' => 'Home',
            'path' => '/',
            'page_hero' => [
                'use_site_hero' => true,
            ],
            'sections' => default_home_sections(),
        ],
        'about' => [
            'slug' => 'about',
            'title' => 'About Us',
            'path' => '/about',
            'page_hero' => [
                'eyebrow' => 'Our Story',
                'heading' => 'About Hartup Construction',
                'lead' => 'A trusted Adelaide building company dedicated to quality craftsmanship, honest communication, and projects that stand the test of time.',
            ],
            'sections' => default_about_sections(),
        ],
        'contact' => [
            'slug' => 'contact',
            'title' => 'Contact Us',
            'path' => '/contact',
            'page_hero' => [
                'eyebrow' => 'Get In Touch',
                'heading' => 'Contact Us',
                'lead' => 'Ready to start your project? Reach out for a free, no-obligation consultation and quote.',
            ],
            'sections' => default_contact_sections(),
        ],
    ];
}

function normalize_page(array $page): array
{
    $slug = trim((string) ($page['slug'] ?? ''));
    $defaults = default_pages()[$slug] ?? [];

    return [
        'slug' => $slug,
        'title' => trim((string) ($page['title'] ?? $defaults['title'] ?? ucfirst($slug))),
        'path' => trim((string) ($page['path'] ?? $defaults['path'] ?? '/' . $slug)),
        'page_hero' => array_replace_recursive(
            $defaults['page_hero'] ?? [],
            is_array($page['page_hero'] ?? null) ? $page['page_hero'] : []
        ),
        'sections' => normalize_sections(is_array($page['sections'] ?? null) ? $page['sections'] : []),
    ];
}

function merge_pages(array $defaults, array $saved): array
{
    $merged = [];
    foreach ($defaults as $slug => $defaultPage) {
        $savedPage = is_array($saved[$slug] ?? null) ? $saved[$slug] : [];
        $page = normalize_page(array_replace_recursive($defaultPage, $savedPage));
        if (!empty($savedPage['sections'])) {
            $page['sections'] = merge_sections($defaultPage['sections'], $savedPage['sections']);
        }
        $merged[$slug] = $page;
    }

    return $merged;
}

function get_page(array $content, string $slug): array
{
    $pages = is_array($content['pages'] ?? null) ? $content['pages'] : default_pages();

    return $pages[$slug] ?? normalize_page(['slug' => $slug]);
}

function parse_page_sections_from_post(array $sectionsInput): array
{
    $sections = [];
    if (!is_array($sectionsInput)) {
        return $sections;
    }

    foreach ($sectionsInput as $section) {
        if (!is_array($section)) {
            continue;
        }
        $sections[] = normalize_section($section);
    }

    return $sections;
}
