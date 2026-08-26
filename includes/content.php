<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/pages.php';
require_once __DIR__ . '/services.php';

function default_content(): array
{
    return [
        'meta' => [
            'title' => 'Hartup Construction',
            'description' => 'Hartup Construction — quality residential and commercial building services in the Adelaide metropolitan area and surrounding regions.',
        ],
        'hero' => [
            'tagline' => 'BUILDING QUALITY - CREATING VALUE',
            'background_image' => 'images/tiny-home.png',
        ],
        'contact' => [
            'eyebrow' => 'Get In Touch',
            'heading' => 'Contact Us',
            'intro' => 'Ready to start your project? Reach out for a free, no-obligation consultation and quote.',
            'project_management_name' => 'Robert',
            'project_management_phone' => '0418 839 759',
            'project_management_phone_href' => '+61418839759',
            'office_phone' => '08 7119 5191',
            'office_phone_href' => '+61871195191',
            'email' => 'office@hartupconstruction.com.au',
            'service_area' => 'Adelaide metro and surrounding areas',
            'business_hours' => 'Mon – Fri: 7:00 AM – 5:00 PM ACST',
            'location' => 'Adelaide, SA',
        ],
        'footer' => [
            'brand' => 'Hartup Construction',
            'tagline' => 'Quality residential and commercial building services across Adelaide and surrounding regions.',
            'abn' => '',
        ],
        'pages' => default_pages(),
        'services' => default_services(),
    ];
}

function load_content(): array
{
    static $content = null;
    if ($content !== null) {
        return $content;
    }

    $defaults = default_content();
    $content = $defaults;
    $path = base_path('content/site.json');

    if (is_file($path)) {
        $json = json_decode((string) file_get_contents($path), true);
        if (is_array($json)) {
            $savedPages = $json['pages'] ?? null;
            $savedServices = $json['services'] ?? null;
            unset($json['pages'], $json['services'], $json['categories'], $json['about'], $json['services_section']);
            $content = array_replace_recursive($defaults, $json);
            if (is_array($savedPages)) {
                $content['pages'] = merge_pages($defaults['pages'], $savedPages);
            }
            if (is_array($savedServices)) {
                $content['services'] = merge_services($defaults['services'], $savedServices);
            }
        }
    }

    return $content;
}

function save_content(array $content): bool
{
    $path = base_path('content/site.json');
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }

    return file_put_contents($path, $json . "\n", LOCK_EX) !== false;
}

function content_path(string $path): string
{
    $parts = explode('.', $path);
    $value = load_content();
    foreach ($parts as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return '';
        }
        $value = $value[$part];
    }
    return is_string($value) ? $value : '';
}

function nl2p(string $text): string
{
    return nl2br(h($text), false);
}
