<?php

declare(strict_types=1);

function default_cms_image(string $file, string $alt, float $aspect = 1.3333): array
{
    return [
        'file' => $file,
        'alt' => $alt,
        'aspect_ratio' => $aspect,
    ];
}

function default_our_designs_banner(string $slug): array
{
    $alts = [
        'one-bedroom' => 'Hartup one bedroom tiny home exterior with modern timber cladding',
        'two-bedroom' => 'Hartup two bedroom tiny home exterior with modern timber cladding',
        'three-bedroom' => 'Hartup three bedroom tiny home exterior with modern timber cladding',
    ];

    return [
        'id' => str_replace('-', '_', $slug) . '_designs_banner',
        'type' => 'image',
        'background' => 'default',
        'image' => default_cms_image(
            $slug . '/exterior.png',
            $alts[$slug] ?? 'Hartup tiny home exterior',
            16 / 9
        ),
        'caption' => '',
        'overlay' => [
            'text' => 'OUR DESIGNS',
            'size' => 'xl',
            'color' => 'light',
            'x' => 5.0,
            'y' => 28.0,
            'w' => 90.0,
            'h' => 44.0,
        ],
    ];
}

function default_design_card(array $item): array
{
    $folder = (string) ($item['folder'] ?? '');
    $name = (string) ($item['name'] ?? '');

    return [
        'id' => (string) ($item['id'] ?? ('des_' . bin2hex(random_bytes(4)))),
        'name' => $name,
        'description' => is_array($item['description'] ?? null) ? $item['description'] : [],
        'bullets' => is_array($item['bullets'] ?? null) ? $item['bullets'] : [],
        'price_from' => (string) ($item['price_from'] ?? ''),
        'width' => (string) ($item['width'] ?? ''),
        'length' => (string) ($item['length'] ?? ''),
        'area' => (string) ($item['area'] ?? ''),
        'bedrooms' => (string) ($item['bedrooms'] ?? ''),
        'bathrooms' => (string) ($item['bathrooms'] ?? ''),
        'floorplan_pdf' => '',
        'video_url' => '',
        'image_position' => 'right',
        'hero_image' => default_cms_image(
            $folder . '/floorplan.png',
            $name . ' floorplan layout'
        ),
        'hero_caption' => 'Floor Plan',
        'image_2' => default_cms_image(
            $folder . '/exterior.png',
            $name . ' exterior with timber cladding and deck'
        ),
        'image_2_caption' => 'Exterior view',
        'image_3' => default_cms_image(
            $folder . '/exterior-alt.png',
            $name . ' alternate exterior view'
        ),
        'image_3_caption' => 'Exterior view',
    ];
}

function default_bedroom_design_items(string $slug): array
{
    $designs = [
        'one-bedroom' => [
            default_design_card([
                'id' => 'des_the_studio',
                'folder' => 'one-bedroom',
                'name' => 'The Studio',
                'description' => [
                    'A streamlined single-bedroom layout with open-plan living, full kitchen, and ensuite bathroom. Perfect for couples or solo occupants who want simplicity without sacrifice.',
                    'The Studio makes intelligent use of every square metre, with clearly defined zones for sleeping, cooking, and relaxing that feel generous despite the compact footprint. Quality fixtures, durable finishes, and large windows create a bright, comfortable home ideal for granny flats, guest accommodation, or rural retreats.',
                ],
                'price_from' => '$89,500',
                'width' => '7.2',
                'length' => '4.2',
                'area' => '30',
                'bedrooms' => '1',
                'bathrooms' => '1',
            ]),
            default_design_card([
                'id' => 'des_the_haven',
                'folder' => 'one-bedroom',
                'name' => 'The Haven',
                'description' => [
                    'A slightly wider one bedroom design with a dedicated study nook and expanded living area. Ideal for remote workers or those who want a little extra breathing room without stepping up to a two bedroom layout.',
                    'The Haven balances efficiency with flexibility — the additional width allows for a separate work zone, more kitchen bench space, and improved storage throughout. Contemporary external finishes and optional deck extensions make this a popular choice for backyard studios and premium rental accommodation.',
                ],
                'price_from' => '$98,500',
                'width' => '7.8',
                'length' => '4.6',
                'area' => '36',
                'bedrooms' => '1',
                'bathrooms' => '1',
            ]),
            default_design_card([
                'id' => 'des_the_retreat',
                'folder' => 'one-bedroom',
                'name' => 'The Retreat',
                'description' => [
                    'Our premium one bedroom offering with a covered deck, larger glazing, and upgraded kitchen package. Designed for those who want a touch of luxury in a compact footprint.',
                    'The Retreat elevates tiny home living with premium inclusions — stone benchtops, upgraded appliances, and expansive glazing that connects indoor and outdoor spaces. The covered deck extends your living area and makes this design well suited to coastal blocks, vineyard settings, and high-end short-stay rentals.',
                ],
                'price_from' => '$112,000',
                'width' => '8.4',
                'length' => '5.0',
                'area' => '42',
                'bedrooms' => '1',
                'bathrooms' => '1',
            ]),
        ],
        'two-bedroom' => [
            default_design_card([
                'id' => 'des_the_duo',
                'folder' => 'two-bedroom',
                'name' => 'The Duo',
                'description' => [
                    'A compact two bedroom layout with equal-sized bedrooms and a shared bathroom. Efficient and affordable, perfect for couples with a home office or small rental properties.',
                    'The Duo keeps construction costs down while delivering genuine two-room flexibility — use the second bedroom as a guest room, nursery, or dedicated office. Open-plan living and a practical kitchen layout ensure the home feels spacious and easy to live in day to day.',
                ],
                'price_from' => '$128,000',
                'width' => '9.0',
                'length' => '5.4',
                'area' => '49',
                'bedrooms' => '2',
                'bathrooms' => '1',
            ]),
            default_design_card([
                'id' => 'des_the_family',
                'folder' => 'two-bedroom',
                'name' => 'The Family',
                'description' => [
                    'Our most popular two bedroom design featuring a master bedroom with optional ensuite, generous living area, and full-size kitchen. Ideal for small families or premium rental accommodation.',
                    'The Family is designed around everyday living — with separated bedrooms, ample storage, and a kitchen that handles real cooking rather than just reheating. Optional ensuite layouts and a choice of external finishes let you tailor the home to your site, budget, and intended use.',
                ],
                'price_from' => '$145,000',
                'width' => '10.2',
                'length' => '6.0',
                'area' => '61',
                'bedrooms' => '2',
                'bathrooms' => '2',
            ]),
            default_design_card([
                'id' => 'des_the_horizon',
                'folder' => 'two-bedroom',
                'name' => 'The Horizon',
                'description' => [
                    'A wider two bedroom design with an extended deck, floor-to-ceiling glazing, and premium kitchen package. Built for those who want extra space and elevated finishes.',
                    'The Horizon prioritises light, outlook, and indoor-outdoor connection — with full-height glazing, an extended deck, and a generous open-plan living zone. Premium fixtures and contemporary cladding options make this our standout two bedroom design for owner-occupiers and high-yield holiday rentals.',
                ],
                'price_from' => '$162,000',
                'width' => '11.4',
                'length' => '6.6',
                'area' => '75',
                'bedrooms' => '2',
                'bathrooms' => '2',
            ]),
        ],
        'three-bedroom' => [
            default_design_card([
                'id' => 'des_the_homestead',
                'folder' => 'three-bedroom',
                'name' => 'The Homestead',
                'description' => [
                    'Our entry-level three bedroom design with a central living hub, shared bathroom, and three equal-sized bedrooms. A practical choice for families on a budget who need genuine three-bedroom accommodation.',
                    'The Homestead delivers real family functionality without unnecessary complexity — three bedrooms, a full kitchen, and a shared bathroom arranged around a central living area. Built-in wardrobes, energy-efficient construction, and low-maintenance external finishes make this a smart option for growing families and long-term rental investment.',
                ],
                'price_from' => '$185,000',
                'width' => '12.0',
                'length' => '7.2',
                'area' => '86',
                'bedrooms' => '3',
                'bathrooms' => '1',
            ]),
            default_design_card([
                'id' => 'des_the_estate',
                'folder' => 'three-bedroom',
                'name' => 'The Estate',
                'description' => [
                    'Our flagship three bedroom design featuring a master suite with ensuite, two additional bedrooms, main bathroom, and expansive open-plan living. Premium finishes and optional deck extensions available.',
                    'The Estate is Hartup\'s most spacious tiny home — designed for families who need room to spread out without committing to a full-scale build. A master suite with ensuite, two further bedrooms, and a generous living and dining zone create a home that works for multi-generational living, large families, or premium accommodation with strong rental appeal.',
                ],
                'price_from' => '$218,000',
                'width' => '13.8',
                'length' => '8.4',
                'area' => '116',
                'bedrooms' => '3',
                'bathrooms' => '2',
            ]),
        ],
    ];

    return $designs[$slug] ?? [];
}

function default_bedroom_designs_section(string $slug): array
{
    return [
        'id' => str_replace('-', '_', $slug) . '_designs',
        'type' => 'designs',
        'background' => 'default',
        'items' => default_bedroom_design_items($slug),
    ];
}
