<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

const THEME_ORIGINAL_ID = 'original';

function theme_font_catalog(): array
{
    static $catalog = null;
    if ($catalog !== null) {
        return $catalog;
    }

    $webSafe = [
        ['family' => 'Arial', 'source' => 'system', 'category' => 'sans-serif'],
        ['family' => 'Helvetica', 'source' => 'system', 'category' => 'sans-serif'],
        ['family' => 'Verdana', 'source' => 'system', 'category' => 'sans-serif'],
        ['family' => 'Tahoma', 'source' => 'system', 'category' => 'sans-serif'],
        ['family' => 'Trebuchet MS', 'source' => 'system', 'category' => 'sans-serif'],
        ['family' => 'Georgia', 'source' => 'system', 'category' => 'serif'],
        ['family' => 'Times New Roman', 'source' => 'system', 'category' => 'serif'],
        ['family' => 'Palatino Linotype', 'source' => 'system', 'category' => 'serif'],
        ['family' => 'Courier New', 'source' => 'system', 'category' => 'monospace'],
    ];

    $google = [
        ['family' => 'Cormorant Garamond', 'source' => 'google', 'category' => 'serif'],
        ['family' => 'DM Sans', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Playfair Display', 'source' => 'google', 'category' => 'serif'],
        ['family' => 'Lora', 'source' => 'google', 'category' => 'serif'],
        ['family' => 'Merriweather', 'source' => 'google', 'category' => 'serif'],
        ['family' => 'Libre Baskerville', 'source' => 'google', 'category' => 'serif'],
        ['family' => 'Crimson Text', 'source' => 'google', 'category' => 'serif'],
        ['family' => 'PT Serif', 'source' => 'google', 'category' => 'serif'],
        ['family' => 'Fraunces', 'source' => 'google', 'category' => 'serif'],
        ['family' => 'Open Sans', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Roboto', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Montserrat', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Raleway', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Poppins', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Nunito', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Source Sans 3', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Work Sans', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Inter', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Josefin Sans', 'source' => 'google', 'category' => 'sans-serif'],
        ['family' => 'Bitter', 'source' => 'google', 'category' => 'serif'],
    ];

    $catalog = array_merge($webSafe, $google);
    return $catalog;
}

function theme_font_types(): array
{
    return [
        'display' => 'Headings',
        'subheading' => 'Subheadings',
        'body' => 'Body text',
        'nav' => 'Navigation',
        'button' => 'Buttons',
    ];
}

function theme_typography_fields(): array
{
    return [
        'size' => 'Font size',
        'weight' => 'Font weight',
        'line_height' => 'Line height',
        'letter_spacing' => 'Letter spacing',
    ];
}

function theme_typography_defaults(): array
{
    return [
        'logo' => ['size' => '1.35rem', 'weight' => '700'],
        'nav' => ['size' => '0.95rem', 'weight' => '500'],
        'nav_cta' => ['size' => '0.95rem', 'weight' => '600'],
        'hero_eyebrow' => ['size' => '0.85rem', 'weight' => '600', 'letter_spacing' => '0.12em'],
        'heading' => ['size' => 'clamp(2.5rem, 6vw, 4rem)', 'weight' => '700', 'line_height' => '1.1'],
        'lead' => ['size' => '1.125rem', 'weight' => '400', 'line_height' => '1.6'],
        'btn_primary' => ['size' => '0.95rem', 'weight' => '600'],
        'btn_ghost' => ['size' => '0.95rem', 'weight' => '600'],
        'section_eyebrow' => ['size' => '0.8rem', 'weight' => '600', 'letter_spacing' => '0.14em'],
        'subheading' => ['size' => 'clamp(2rem, 4vw, 2.75rem)', 'weight' => '700', 'line_height' => '1.15'],
        'card_title' => ['size' => '1.65rem', 'weight' => '700'],
        'card_body' => ['size' => '0.95rem', 'weight' => '400', 'line_height' => '1.5'],
        'body_text' => ['size' => '1rem', 'weight' => '400', 'line_height' => '1.6'],
        'form' => ['size' => '0.85rem', 'weight' => '400'],
        'footer_title' => ['size' => '1.5rem', 'weight' => '700'],
        'footer_text' => ['size' => '0.9rem', 'weight' => '400'],
    ];
}

/**
 * Clickable demo objects and their contextual editor settings.
 *
 * @return array<string, array{label: string, hint: string, settings: list<array<string, mixed>>}>
 */
function theme_targets(): array
{
    return [
        'header' => [
            'label' => 'Header bar',
            'hint' => 'Top navigation background',
            'settings' => [
                ['kind' => 'color', 'key' => 'header', 'label' => 'Background colour'],
            ],
        ],
        'logo' => [
            'label' => 'Site logo',
            'hint' => 'Brand name in the header',
            'settings' => [
                ['kind' => 'font', 'key' => 'display', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'logo', 'fields' => ['size', 'weight']],
            ],
        ],
        'nav' => [
            'label' => 'Navigation links',
            'hint' => 'Main menu text',
            'settings' => [
                ['kind' => 'font', 'key' => 'nav', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'nav', 'fields' => ['size', 'weight']],
            ],
        ],
        'nav-cta' => [
            'label' => 'Nav button',
            'hint' => 'Call-to-action in the header',
            'settings' => [
                ['kind' => 'font', 'key' => 'button', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'rose', 'label' => 'Background colour'],
                ['kind' => 'color', 'key' => 'on_accent', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'nav_cta', 'fields' => ['size', 'weight']],
            ],
        ],
        'hero-bg' => [
            'label' => 'Hero background',
            'hint' => 'Main banner gradient colours',
            'settings' => [
                ['kind' => 'color', 'key' => 'cream', 'label' => 'Primary background'],
                ['kind' => 'color', 'key' => 'sage_light', 'label' => 'Accent background'],
            ],
        ],
        'hero-eyebrow' => [
            'label' => 'Hero eyebrow',
            'hint' => 'Small label above the main heading',
            'settings' => [
                ['kind' => 'font', 'key' => 'body', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'sage', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'hero_eyebrow', 'fields' => ['size', 'weight', 'letter_spacing']],
            ],
        ],
        'heading' => [
            'label' => 'Main heading',
            'hint' => 'Large hero title',
            'settings' => [
                ['kind' => 'font', 'key' => 'display', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'heading', 'fields' => ['size', 'weight', 'line_height']],
            ],
        ],
        'lead' => [
            'label' => 'Lead paragraph',
            'hint' => 'Intro text below the heading',
            'settings' => [
                ['kind' => 'font', 'key' => 'body', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink_soft', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'lead', 'fields' => ['size', 'weight', 'line_height']],
            ],
        ],
        'btn-primary' => [
            'label' => 'Primary button',
            'hint' => 'Filled call-to-action button',
            'settings' => [
                ['kind' => 'font', 'key' => 'button', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'rose', 'label' => 'Background colour'],
                ['kind' => 'color', 'key' => 'on_accent', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'btn_primary', 'fields' => ['size', 'weight']],
            ],
        ],
        'btn-ghost' => [
            'label' => 'Secondary button',
            'hint' => 'Outlined button style',
            'settings' => [
                ['kind' => 'font', 'key' => 'button', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink', 'label' => 'Text colour'],
                ['kind' => 'color', 'key' => 'border', 'label' => 'Border colour'],
                ['kind' => 'type', 'key' => 'btn_ghost', 'fields' => ['size', 'weight']],
            ],
        ],
        'section-alt' => [
            'label' => 'Alternate section',
            'hint' => 'Services and gallery background',
            'settings' => [
                ['kind' => 'color', 'key' => 'warm_white', 'label' => 'Background colour'],
            ],
        ],
        'section-eyebrow' => [
            'label' => 'Section eyebrow',
            'hint' => 'Small label above section titles',
            'settings' => [
                ['kind' => 'font', 'key' => 'body', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'terracotta', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'section_eyebrow', 'fields' => ['size', 'weight', 'letter_spacing']],
            ],
        ],
        'subheading' => [
            'label' => 'Section heading',
            'hint' => 'Secondary page headings',
            'settings' => [
                ['kind' => 'font', 'key' => 'subheading', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'subheading', 'fields' => ['size', 'weight', 'line_height']],
            ],
        ],
        'card' => [
            'label' => 'Card',
            'hint' => 'Service card background',
            'settings' => [
                ['kind' => 'color', 'key' => 'card', 'label' => 'Background colour'],
                ['kind' => 'color', 'key' => 'border', 'label' => 'Border colour'],
            ],
        ],
        'card-title' => [
            'label' => 'Card title',
            'hint' => 'Heading inside a card',
            'settings' => [
                ['kind' => 'font', 'key' => 'subheading', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'card_title', 'fields' => ['size', 'weight']],
            ],
        ],
        'card-body' => [
            'label' => 'Card text',
            'hint' => 'Body copy inside a card',
            'settings' => [
                ['kind' => 'font', 'key' => 'body', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink_soft', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'card_body', 'fields' => ['size', 'weight', 'line_height']],
            ],
        ],
        'body-text' => [
            'label' => 'Body paragraph',
            'hint' => 'Standard page text',
            'settings' => [
                ['kind' => 'font', 'key' => 'body', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'ink_soft', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'body_text', 'fields' => ['size', 'weight', 'line_height']],
            ],
        ],
        'contact-form' => [
            'label' => 'Contact form',
            'hint' => 'Form panel background and border',
            'settings' => [
                ['kind' => 'color', 'key' => 'contact_form', 'label' => 'Background colour'],
                ['kind' => 'color', 'key' => 'border', 'label' => 'Border colour'],
                ['kind' => 'color', 'key' => 'ink_soft', 'label' => 'Placeholder text'],
                ['kind' => 'type', 'key' => 'form', 'fields' => ['size', 'weight']],
            ],
        ],
        'footer' => [
            'label' => 'Footer',
            'hint' => 'Page footer background',
            'settings' => [
                ['kind' => 'color', 'key' => 'footer', 'label' => 'Background colour'],
            ],
        ],
        'footer-title' => [
            'label' => 'Footer title',
            'hint' => 'Brand name in the footer',
            'settings' => [
                ['kind' => 'font', 'key' => 'display', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'on_accent', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'footer_title', 'fields' => ['size', 'weight']],
            ],
        ],
        'footer-text' => [
            'label' => 'Footer text',
            'hint' => 'Tagline in the footer',
            'settings' => [
                ['kind' => 'font', 'key' => 'body', 'label' => 'Font family'],
                ['kind' => 'color', 'key' => 'on_accent', 'label' => 'Text colour'],
                ['kind' => 'type', 'key' => 'footer_text', 'fields' => ['size', 'weight']],
            ],
        ],
    ];
}

function theme_color_groups(): array
{
    return [
        'Page & sections' => [
            'cream' => 'Page background',
            'warm_white' => 'Alternate sections (services, gallery)',
            'header' => 'Header bar',
            'card' => 'Card background',
            'contact_form' => 'Contact form',
            'footer' => 'Footer',
        ],
        'Text' => [
            'ink' => 'Primary text',
            'ink_soft' => 'Muted text',
        ],
        'Accents' => [
            'rose' => 'Primary accent',
            'rose_dark' => 'Primary accent (dark)',
            'terracotta' => 'Eyebrow / highlights',
            'sage' => 'Secondary accent',
            'sage_light' => 'Soft accent background',
            'gold' => 'Gold accent',
            'on_accent' => 'Text on accent / footer',
            'border' => 'Borders & outlines',
        ],
    ];
}

function original_theme(): array
{
    return [
        'id' => THEME_ORIGINAL_ID,
        'name' => 'Original',
        'protected' => true,
        'fonts' => [
            'display' => ['family' => 'Cormorant Garamond', 'source' => 'google'],
            'subheading' => ['family' => 'Cormorant Garamond', 'source' => 'google'],
            'body' => ['family' => 'DM Sans', 'source' => 'google'],
            'nav' => ['family' => 'DM Sans', 'source' => 'google'],
            'button' => ['family' => 'DM Sans', 'source' => 'google'],
        ],
        'colors' => [
            'cream' => '#faf7f2',
            'warm_white' => '#fffdf9',
            'header' => 'rgba(255, 253, 249, 0.92)',
            'card' => '#faf7f2',
            'contact_form' => '#ffffff',
            'footer' => '#2c2419',
            'ink' => '#2c2419',
            'ink_soft' => '#5c5348',
            'rose' => '#c4776a',
            'rose_dark' => '#a85f53',
            'terracotta' => '#c17f59',
            'sage' => '#7a8f7a',
            'sage_light' => '#e8ede8',
            'gold' => '#b8956a',
            'on_accent' => '#ffffff',
            'border' => 'rgba(44, 36, 25, 0.1)',
        ],
        'typography' => theme_typography_defaults(),
    ];
}

function themes_data_path(): string
{
    $override = getenv('THEMES_DATA_PATH');
    if (is_string($override) && $override !== '') {
        return $override;
    }

    return base_path('data/themes.json');
}

function reset_themes_data_cache(): void
{
    putenv('THEMES_DATA_CACHE_BUST=' . microtime(true));
}

function default_themes_data(): array
{
    return [
        'active_theme_id' => THEME_ORIGINAL_ID,
        'themes' => [],
    ];
}

function load_themes_data(): array
{
    static $data = null;
    static $loadedPath = null;
    static $cacheBust = null;

    $path = themes_data_path();
    $bust = getenv('THEMES_DATA_CACHE_BUST') ?: '';
    if ($data !== null && $loadedPath === $path && $cacheBust === $bust) {
        return $data;
    }

    $loadedPath = $path;
    $cacheBust = $bust;
    $data = default_themes_data();

    if (is_file($path)) {
        $json = json_decode((string) file_get_contents($path), true);
        if (is_array($json)) {
            $data = array_replace_recursive($data, $json);
        }
    }

    if (!is_array($data['themes'])) {
        $data['themes'] = [];
    }

    return $data;
}

function save_themes_data(array $data): bool
{
    $path = themes_data_path();
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }

    $written = file_put_contents($path, $json . "\n", LOCK_EX) !== false;
    if ($written) {
        reset_themes_data_cache();
    }

    return $written;
}

function theme_by_id(string $id): ?array
{
    if ($id === THEME_ORIGINAL_ID) {
        return original_theme();
    }

    $data = load_themes_data();
    $theme = $data['themes'][$id] ?? null;
    return is_array($theme) ? normalize_theme($theme) : null;
}

function active_theme_id(): string
{
    $data = load_themes_data();
    $id = (string) ($data['active_theme_id'] ?? THEME_ORIGINAL_ID);
    if ($id === THEME_ORIGINAL_ID) {
        return THEME_ORIGINAL_ID;
    }
    return isset($data['themes'][$id]) ? $id : THEME_ORIGINAL_ID;
}

function active_theme(): array
{
    return theme_by_id(active_theme_id()) ?? original_theme();
}

function theme_font_stack(array $font): string
{
    $family = trim((string) ($font['family'] ?? 'Arial'));
    $source = (string) ($font['source'] ?? 'system');
    $category = theme_font_category($family);

    if ($source === 'google') {
        return '"' . $family . '", ' . $category;
    }

    return $family . ', ' . $category;
}

function theme_font_category(string $family): string
{
    foreach (theme_font_catalog() as $entry) {
        if ($entry['family'] === $family) {
            return $entry['category'];
        }
    }

    return 'sans-serif';
}

function theme_color_css_var(string $key): string
{
    $map = [
        'cream' => '--color-cream',
        'warm_white' => '--color-warm-white',
        'header' => '--color-header',
        'card' => '--color-card',
        'contact_form' => '--color-contact-form',
        'footer' => '--color-footer',
        'ink' => '--color-ink',
        'ink_soft' => '--color-ink-soft',
        'rose' => '--color-rose',
        'rose_dark' => '--color-rose-dark',
        'terracotta' => '--color-terracotta',
        'sage' => '--color-sage',
        'sage_light' => '--color-sage-light',
        'gold' => '--color-gold',
        'on_accent' => '--color-on-accent',
        'border' => '--color-border',
    ];

    return $map[$key] ?? '--color-' . str_replace('_', '-', $key);
}

function theme_font_css_var(string $key): string
{
    $map = [
        'display' => '--font-display',
        'subheading' => '--font-subheading',
        'body' => '--font-body',
        'nav' => '--font-nav',
        'button' => '--font-button',
    ];

    return $map[$key] ?? '--font-' . str_replace('_', '-', $key);
}

function theme_typography_css_var(string $role, string $field): string
{
    return '--type-' . str_replace('_', '-', $role) . '-' . str_replace('_', '-', $field);
}

function merge_theme_typography(array $typography): array
{
    $defaults = theme_typography_defaults();
    $merged = $defaults;

    foreach ($typography as $role => $values) {
        if (!is_array($values) || !isset($defaults[$role])) {
            continue;
        }
        foreach ($defaults[$role] as $field => $default) {
            $raw = $values[$field] ?? $default;
            $clean = sanitize_typography_value($field, (string) $raw);
            $merged[$role][$field] = $clean ?? $default;
        }
    }

    return $merged;
}

function sanitize_typography_value(string $field, string $value): ?string
{
    $value = trim($value);
    if ($value === '') {
        return null;
    }

    if ($field === 'weight') {
        if (preg_match('/^[1-9]00$/', $value)) {
            return $value;
        }
        return null;
    }

    if ($field === 'line_height') {
        if (preg_match('/^\d+(?:\.\d+)?(?:px|rem|em|%)?$/', $value)) {
            return $value;
        }
        return null;
    }

    if ($field === 'letter_spacing') {
        if (preg_match('/^-?\d+(?:\.\d+)?(?:px|rem|em)?$/', $value)) {
            return $value;
        }
        return null;
    }

    if ($field === 'size') {
        if (preg_match('/^clamp\([^)]+\)$/', $value)) {
            return $value;
        }
        if (preg_match('/^\d+(?:\.\d+)?(?:px|rem|em|%|vw|vh)$/', $value)) {
            return $value;
        }
        return null;
    }

    return null;
}

function sanitize_theme_color(string $value): ?string
{
    $value = trim($value);
    if ($value === '') {
        return null;
    }

    if (preg_match('/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0?\.\d+|1(?:\.0)?))?\s*\)$/i', $value)) {
        return $value;
    }

    if (preg_match('/^#[0-9a-fA-F]{3,8}$/', $value)) {
        return strtolower($value);
    }

    return null;
}

function sanitize_theme_font(array $font): ?array
{
    $family = sanitize_text((string) ($font['family'] ?? ''), 80);
    if ($family === '') {
        return null;
    }

    $source = ($font['source'] ?? '') === 'google' ? 'google' : 'system';
    $allowed = array_column(theme_font_catalog(), 'family');
    if (!in_array($family, $allowed, true)) {
        return null;
    }

    $entry = null;
    foreach (theme_font_catalog() as $item) {
        if ($item['family'] === $family) {
            $entry = $item;
            break;
        }
    }

    if ($entry === null) {
        return null;
    }

    return [
        'family' => $entry['family'],
        'source' => $entry['source'] === 'google' ? 'google' : 'system',
    ];
}

function sanitize_theme_payload(array $payload): ?array
{
    $original = original_theme();
    $fonts = [];
    foreach (theme_font_types() as $key => $label) {
        $raw = $payload['fonts'][$key] ?? $original['fonts'][$key] ?? null;
        $font = is_array($raw) ? sanitize_theme_font($raw) : null;
        if ($font === null) {
            return null;
        }
        $fonts[$key] = $font;
    }

    $colors = [];
    foreach ($original['colors'] as $key => $default) {
        $raw = $payload['colors'][$key] ?? $default;
        $color = sanitize_theme_color((string) $raw);
        if ($color === null) {
            return null;
        }
        $colors[$key] = $color;
    }

    $typography = merge_theme_typography(is_array($payload['typography'] ?? null) ? $payload['typography'] : []);

    $name = sanitize_text((string) ($payload['name'] ?? 'Untitled theme'), 80);
    if ($name === '' || strcasecmp($name, 'Original') === 0) {
        return null;
    }

    return [
        'name' => $name,
        'fonts' => $fonts,
        'colors' => $colors,
        'typography' => $typography,
    ];
}

function normalize_theme(array $theme): array
{
    $original = original_theme();
    $theme['fonts'] = array_replace($original['fonts'], $theme['fonts'] ?? []);
    $theme['colors'] = array_replace($original['colors'], $theme['colors'] ?? []);
    $theme['typography'] = merge_theme_typography($theme['typography'] ?? []);
    return $theme;
}

function theme_css_block(?array $theme = null): string
{
    $theme = normalize_theme($theme ?? active_theme());
    if (($theme['id'] ?? '') === THEME_ORIGINAL_ID && active_theme_id() === THEME_ORIGINAL_ID) {
        return '';
    }

    $lines = [];
    foreach ($theme['colors'] ?? [] as $key => $value) {
        $lines[] = theme_color_css_var($key) . ': ' . $value . ';';
    }
    foreach ($theme['fonts'] ?? [] as $key => $font) {
        $lines[] = theme_font_css_var($key) . ': ' . theme_font_stack($font) . ';';
    }
    foreach ($theme['typography'] ?? [] as $role => $values) {
        if (!is_array($values)) {
            continue;
        }
        foreach ($values as $field => $value) {
            if (!is_string($value) || $value === '') {
                continue;
            }
            $lines[] = theme_typography_css_var($role, $field) . ': ' . $value . ';';
        }
    }

    if ($lines === []) {
        return '';
    }

    return ":root {\n  " . implode("\n  ", $lines) . "\n}\n";
}

function theme_google_font_families(?array $theme = null): array
{
    $theme = $theme ?? active_theme();
    $families = [];

    foreach ($theme['fonts'] ?? [] as $font) {
        if (($font['source'] ?? '') !== 'google') {
            continue;
        }
        $family = (string) ($font['family'] ?? '');
        if ($family !== '') {
            $families[$family] = true;
        }
    }

    return array_keys($families);
}

function theme_google_fonts_url(?array $theme = null): string
{
    $families = theme_google_font_families($theme);
    if ($families === []) {
        return '';
    }

    $params = [];
    foreach ($families as $family) {
        $slug = str_replace(' ', '+', $family);
        $params[] = 'family=' . $slug . ':wght@400;500;600;700';
    }

    return 'https://fonts.googleapis.com/css2?' . implode('&', $params) . '&display=swap';
}

function theme_list_for_admin(): array
{
    $data = load_themes_data();
    $items = [
        original_theme(),
    ];

    foreach ($data['themes'] as $theme) {
        if (!is_array($theme)) {
            continue;
        }
        $items[] = $theme;
    }

    return [
        'active_theme_id' => active_theme_id(),
        'themes' => $items,
        'saved_themes' => array_values($data['themes']),
    ];
}

function find_theme_id_by_name(string $name, ?string $excludeId = null): ?string
{
    $needle = strtolower(trim($name));
    if ($needle === '') {
        return null;
    }

    foreach (load_themes_data()['themes'] as $id => $theme) {
        if (!is_array($theme)) {
            continue;
        }
        if ($excludeId !== null && (string) $id === $excludeId) {
            continue;
        }
        if (strtolower(trim((string) ($theme['name'] ?? ''))) === $needle) {
            return (string) $id;
        }
    }

    return null;
}

function update_custom_theme(string $id, array $payload): array
{
    if ($id === THEME_ORIGINAL_ID || $id === '') {
        return ['success' => false, 'message' => 'The Original theme cannot be edited. Use Save As to create a custom theme.'];
    }

    $clean = sanitize_theme_payload($payload);
    if ($clean === null) {
        return ['success' => false, 'message' => 'Invalid theme data.'];
    }

    $data = load_themes_data();
    if (!isset($data['themes'][$id])) {
        return ['success' => false, 'message' => 'Theme not found.'];
    }

    $duplicateId = find_theme_id_by_name($clean['name'], $id);
    if ($duplicateId !== null) {
        return ['success' => false, 'message' => 'Another theme already uses that name. Choose a different name or use Save As to replace it.'];
    }

    $now = gmdate('c');
    $clean['id'] = $id;
    $clean['created_at'] = (string) ($data['themes'][$id]['created_at'] ?? $now);
    $clean['updated_at'] = $now;
    $data['themes'][$id] = $clean;

    if (!save_themes_data($data)) {
        return ['success' => false, 'message' => 'Could not save theme. Check permissions on /data.'];
    }

    return ['success' => true, 'message' => 'Theme updated.', 'theme' => $data['themes'][$id]];
}

function create_custom_theme(array $payload, ?string $overwriteId = null): array
{
    $clean = sanitize_theme_payload($payload);
    if ($clean === null) {
        return ['success' => false, 'message' => 'Invalid theme data.'];
    }

    $data = load_themes_data();
    $now = gmdate('c');

    if ($overwriteId !== null && $overwriteId !== '' && $overwriteId !== THEME_ORIGINAL_ID) {
        if (!isset($data['themes'][$overwriteId])) {
            return ['success' => false, 'message' => 'Theme to overwrite was not found.'];
        }

        $clean['id'] = $overwriteId;
        $clean['created_at'] = (string) ($data['themes'][$overwriteId]['created_at'] ?? $now);
        $clean['updated_at'] = $now;
        $data['themes'][$overwriteId] = $clean;
        $message = 'Theme saved.';
    } else {
        $existingId = find_theme_id_by_name($clean['name']);
        if ($existingId !== null) {
            return [
                'success' => false,
                'message' => 'A theme with that name already exists.',
                'duplicate_id' => $existingId,
                'duplicate_name' => $clean['name'],
            ];
        }

        $id = bin2hex(random_bytes(8));
        $clean['id'] = $id;
        $clean['created_at'] = $now;
        $clean['updated_at'] = $now;
        $data['themes'][$id] = $clean;
        $message = 'Theme saved as new variation.';
    }

    if (!save_themes_data($data)) {
        return ['success' => false, 'message' => 'Could not save theme. Check permissions on /data.'];
    }

    return ['success' => true, 'message' => $message, 'theme' => $clean];
}

/** @deprecated Use update_custom_theme() or create_custom_theme() */
function save_custom_theme(string $id, array $payload): array
{
    if ($id === '' || !isset(load_themes_data()['themes'][$id])) {
        return create_custom_theme($payload);
    }

    return update_custom_theme($id, $payload);
}

function delete_custom_theme(string $id): array
{
    if ($id === THEME_ORIGINAL_ID) {
        return ['success' => false, 'message' => 'The Original theme cannot be deleted.'];
    }

    $data = load_themes_data();
    if (!isset($data['themes'][$id])) {
        return ['success' => false, 'message' => 'Theme not found.'];
    }

    unset($data['themes'][$id]);
    if (($data['active_theme_id'] ?? '') === $id) {
        $data['active_theme_id'] = THEME_ORIGINAL_ID;
    }

    if (!save_themes_data($data)) {
        return ['success' => false, 'message' => 'Could not delete theme.'];
    }

    return ['success' => true, 'message' => 'Theme deleted.'];
}

function apply_theme(string $id): array
{
    if ($id === THEME_ORIGINAL_ID) {
        $data = load_themes_data();
        $data['active_theme_id'] = THEME_ORIGINAL_ID;
        if (!save_themes_data($data)) {
            return ['success' => false, 'message' => 'Could not apply theme.'];
        }
        return ['success' => true, 'message' => 'Original theme applied to the site.'];
    }

    $data = load_themes_data();
    if (!isset($data['themes'][$id])) {
        return ['success' => false, 'message' => 'Theme not found.'];
    }

    $data['active_theme_id'] = $id;
    if (!save_themes_data($data)) {
        return ['success' => false, 'message' => 'Could not apply theme.'];
    }

    return ['success' => true, 'message' => 'Theme applied to the live site.'];
}

/** Demo copy for the themes admin preview — pulled from live site content. */
function theme_demo_content(): array
{
    require_once __DIR__ . '/content.php';

    $content = load_content();
    $hero = $content['hero'] ?? [];
    $services = $content['services'] ?? [];
    $about = $content['about'] ?? [];
    $contact = $content['contact'] ?? [];
    $footer = $content['footer'] ?? [];

    $siteName = trim((string) ($footer['brand'] ?? ''));
    if ($siteName === '') {
        $metaTitle = (string) ($content['meta']['title'] ?? '');
        $siteName = trim(explode('|', $metaTitle, 2)[0]);
    }
    if ($siteName === '') {
        $siteName = 'Your Site';
    }

    $heroHeading = trim(preg_replace('/\s+/', ' ', str_replace(["\r\n", "\r", "\n"], ' ', (string) ($hero['heading'] ?? ''))));

    $visibleCategories = array_values(array_filter(
        $content['categories'] ?? [],
        static fn(array $category): bool => ($category['visible'] ?? true) !== false
    ));

    $cards = [];
    foreach (array_slice($visibleCategories, 0, 2) as $category) {
        $cards[] = [
            'title' => (string) ($category['title'] ?? ''),
            'body' => (string) ($category['description'] ?? $category['tag'] ?? ''),
        ];
    }
    while (count($cards) < 2) {
        $cards[] = ['title' => 'Service', 'body' => 'Category description.'];
    }

    $aboutParagraphs = $about['paragraphs'] ?? [];
    $aboutBody = is_array($aboutParagraphs) && $aboutParagraphs !== []
        ? (string) $aboutParagraphs[0]
        : '';

    return [
        'siteName' => $siteName,
        'heroEyebrow' => (string) ($hero['eyebrow'] ?? ''),
        'heroHeading' => $heroHeading !== '' ? $heroHeading : 'Welcome',
        'heroLead' => (string) ($hero['lead'] ?? ''),
        'btnPrimary' => 'Explore services',
        'btnGhost' => 'Contact us',
        'servicesEyebrow' => (string) ($services['eyebrow'] ?? ''),
        'servicesHeading' => (string) ($services['heading'] ?? 'What we do'),
        'cards' => $cards,
        'aboutHeading' => (string) ($about['heading'] ?? ''),
        'aboutBody' => $aboutBody,
        'contactHeading' => (string) ($contact['heading'] ?? 'Contact us'),
        'footerTitle' => (string) ($footer['brand'] ?? $siteName),
        'footerText' => (string) ($footer['tagline'] ?? ''),
        'navCta' => 'Get in Touch',
        'fontDisplay' => $heroHeading !== '' ? $heroHeading : $siteName,
        'fontSubheading' => (string) ($services['heading'] ?? 'Our services'),
        'fontBody' => (string) ($hero['lead'] ?? $aboutBody),
        'fontNav' => 'What we do · About',
        'fontButton' => 'Get in Touch',
    ];
}
