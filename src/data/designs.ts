import { bedroomImages } from './bedroomImages';

export interface IntroSectionData {
  eyebrow?: string;
  heading: string;
  text: string;
  button?: { label: string; href: string };
  image: string;
  imageAlt: string;
  imagePosition: 'left' | 'right';
  imageFit?: 'cover' | 'contain';
}

export interface Design {
  name: string;
  slug: string;
  description: string[];
  priceFrom: number;
  width: number;
  length: number;
  totalArea: number;
  bedrooms: number;
  bathrooms: number;
  exteriorImage: string;
  exteriorImageAlt: string;
  exteriorImageCaption?: string;
  floorplanImage: string;
  floorplanImageAlt: string;
  floorplanImageCaption?: string;
  floorplan3dImage: string;
  floorplan3dImageAlt: string;
  thirdImageCaption?: string;
  floorplanPdfUrl: string;
  videoUrl?: string;
  gallery?: { src: string; alt: string }[];
}

export interface BedroomCategory {
  slug: string;
  pageTitle: string;
  metaDescription: string;
  heroLead: string;
  introSections: [IntroSectionData, IntroSectionData, IntroSectionData];
  ourDesignsFeatureImage: { src: string; alt: string };
  designs: Design[];
}

export const bedroomCategories: Record<string, BedroomCategory> = {
  'one-bedroom': {
    slug: 'one-bedroom',
    pageTitle: 'One Bedroom',
    metaDescription:
      'Hartup Construction one bedroom tiny home designs — compact, efficient living with modern finishes and quality craftsmanship.',
    heroLead:
      'Our one bedroom tiny home delivers smart, efficient living in a compact footprint — perfect for singles, couples, granny flats, or investment properties.',
    introSections: [
      {
        eyebrow: 'Compact Living',
        heading: 'Maximum Comfort in Minimal Space',
        text: 'The one bedroom configuration is our most compact option, designed to maximise every square metre without compromising on comfort or style. Open-plan living flows seamlessly into a dedicated bedroom and fully functional kitchen and bathroom.',
        button: { label: 'View Our Designs', href: '#our-designs' },
        image: bedroomImages['one-bedroom'].exterior,
        imageAlt: 'One bedroom tiny home exterior with timber cladding and deck',
        imagePosition: 'left',
      },
      {
        eyebrow: 'Smart Design',
        heading: 'Built for Everyday Living',
        text: 'Every Hartup one bedroom design features open-plan living and dining, a separate bedroom with built-in storage, and a contemporary kitchen and bathroom — all finished with quality materials selected for durability and low maintenance.',
        image: bedroomImages['one-bedroom'].exteriorAlt,
        imageAlt: 'One bedroom tiny home alternate exterior view with timber deck',
        imagePosition: 'right',
      },
      {
        eyebrow: 'Versatile Use',
        heading: 'Ideal for Any Setting',
        text: 'From granny flats and guest accommodation to rural retreats and investment properties, our one bedroom tiny homes adapt to your lifestyle. Customisable finishes, colours, and layout options ensure your home reflects your vision.',
        button: { label: 'Get a Quote', href: '/contact?service=1-bedroom-tiny-home' },
        image: bedroomImages['one-bedroom'].floorplan,
        imageAlt: 'One bedroom tiny home floorplan layout',
        imagePosition: 'left',
        imageFit: 'contain',
      },
    ],
    ourDesignsFeatureImage: {
      src: bedroomImages['one-bedroom'].exterior,
      alt: 'Hartup one bedroom tiny home exterior with modern timber cladding',
    },
    designs: [
      {
        name: 'The Studio',
        slug: 'the-studio',
        description: [
          'A streamlined single-bedroom layout with open-plan living, full kitchen, and ensuite bathroom. Perfect for couples or solo occupants who want simplicity without sacrifice.',
          'The Studio makes intelligent use of every square metre, with clearly defined zones for sleeping, cooking, and relaxing that feel generous despite the compact footprint. Quality fixtures, durable finishes, and large windows create a bright, comfortable home ideal for granny flats, guest accommodation, or rural retreats.',
        ],
        priceFrom: 89500,
        width: 7.2,
        length: 4.2,
        totalArea: 30,
        bedrooms: 1,
        bathrooms: 1,
        exteriorImage: bedroomImages['one-bedroom'].exterior,
        exteriorImageAlt: 'The Studio one bedroom tiny home exterior with timber cladding and front deck',
        floorplanImage: bedroomImages['one-bedroom'].floorplan,
        floorplanImageAlt: 'The Studio one bedroom floorplan layout',
        floorplan3dImage: bedroomImages['one-bedroom'].exteriorAlt,
        floorplan3dImageAlt: 'The Studio one bedroom tiny home exterior view at dusk',
        thirdImageCaption: 'Exterior view',
        floorplanPdfUrl: '#',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        name: 'The Haven',
        slug: 'the-haven',
        description: [
          'A slightly wider one bedroom design with a dedicated study nook and expanded living area. Ideal for remote workers or those who want a little extra breathing room without stepping up to a two bedroom layout.',
          'The Haven balances efficiency with flexibility — the additional width allows for a separate work zone, more kitchen bench space, and improved storage throughout. Contemporary external finishes and optional deck extensions make this a popular choice for backyard studios and premium rental accommodation.',
        ],
        priceFrom: 98500,
        width: 7.8,
        length: 4.6,
        totalArea: 36,
        bedrooms: 1,
        bathrooms: 1,
        exteriorImage: bedroomImages['one-bedroom'].exterior,
        exteriorImageAlt: 'The Haven one bedroom tiny home exterior with timber cladding and timber deck',
        floorplanImage: bedroomImages['one-bedroom'].floorplan,
        floorplanImageAlt: 'The Haven one bedroom floorplan layout showing bedroom, bathroom, kitchen, and deck',
        floorplan3dImage: bedroomImages['one-bedroom'].exteriorAlt,
        floorplan3dImageAlt: 'The Haven one bedroom tiny home exterior view at dusk',
        thirdImageCaption: 'Exterior view',
        floorplanPdfUrl: '#',
      },
      {
        name: 'The Retreat',
        slug: 'the-retreat',
        description: [
          'Our premium one bedroom offering with a covered deck, larger glazing, and upgraded kitchen package. Designed for those who want a touch of luxury in a compact footprint.',
          'The Retreat elevates tiny home living with premium inclusions — stone benchtops, upgraded appliances, and expansive glazing that connects indoor and outdoor spaces. The covered deck extends your living area and makes this design well suited to coastal blocks, vineyard settings, and high-end short-stay rentals.',
        ],
        priceFrom: 112000,
        width: 8.4,
        length: 5.0,
        totalArea: 42,
        bedrooms: 1,
        bathrooms: 1,
        exteriorImage: bedroomImages['one-bedroom'].exterior,
        exteriorImageAlt: 'The Retreat premium one bedroom tiny home exterior with timber cladding and deck',
        floorplanImage: bedroomImages['one-bedroom'].floorplan,
        floorplanImageAlt: 'The Retreat one bedroom floorplan layout',
        floorplan3dImage: bedroomImages['one-bedroom'].exteriorAlt,
        floorplan3dImageAlt: 'The Retreat one bedroom tiny home exterior view at dusk',
        thirdImageCaption: 'Exterior view',
        floorplanPdfUrl: '#',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    ],
  },
  'two-bedroom': {
    slug: 'two-bedroom',
    pageTitle: 'Two Bedroom',
    metaDescription:
      'Hartup Construction two bedroom tiny home designs — versatile family-friendly living with modern design and quality construction.',
    heroLead:
      'Our two bedroom tiny home offers the perfect balance of space and efficiency — ideal for small families, couples who want a home office, or rental investment properties.',
    introSections: [
      {
        eyebrow: 'Versatile Space',
        heading: 'Room to Grow and Adapt',
        text: 'The two bedroom configuration adds an extra room without sacrificing the smart design principles that define every Hartup tiny home. Whether you need a second bedroom, a home office, or guest accommodation, this layout adapts to your lifestyle.',
        button: { label: 'View Our Designs', href: '#our-designs' },
        image: bedroomImages['two-bedroom'].exterior,
        imageAlt: 'Two bedroom tiny home exterior with timber cladding and deck',
        imagePosition: 'left',
      },
      {
        eyebrow: 'Family Friendly',
        heading: 'Designed for Modern Households',
        text: 'Spacious open-plan living, dining, and kitchen areas flow into two separate bedrooms with built-in storage. Optional ensuite layouts and flexible floor plans make this configuration a popular choice for small families and rental investors.',
        image: bedroomImages['two-bedroom'].exteriorAlt,
        imageAlt: 'Two bedroom tiny home alternate exterior view with timber deck',
        imagePosition: 'right',
      },
      {
        eyebrow: 'Investment Ready',
        heading: 'Built for Long-Term Value',
        text: 'Energy-efficient insulation, quality fixtures, and contemporary external finishes ensure your two bedroom tiny home delivers strong returns — whether as a primary residence, granny flat, or holiday rental.',
        button: { label: 'Get a Quote', href: '/contact?service=2-bedroom-tiny-home' },
        image: bedroomImages['two-bedroom'].floorplan,
        imageAlt: 'Two bedroom tiny home floorplan layout',
        imagePosition: 'left',
        imageFit: 'contain',
      },
    ],
    ourDesignsFeatureImage: {
      src: bedroomImages['two-bedroom'].exterior,
      alt: 'Hartup two bedroom tiny home exterior with modern timber cladding',
    },
    designs: [
      {
        name: 'The Duo',
        slug: 'the-duo',
        description: [
          'A compact two bedroom layout with equal-sized bedrooms and a shared bathroom. Efficient and affordable, perfect for couples with a home office or small rental properties.',
          'The Duo keeps construction costs down while delivering genuine two-room flexibility — use the second bedroom as a guest room, nursery, or dedicated office. Open-plan living and a practical kitchen layout ensure the home feels spacious and easy to live in day to day.',
        ],
        priceFrom: 128000,
        width: 9.0,
        length: 5.4,
        totalArea: 49,
        bedrooms: 2,
        bathrooms: 1,
        exteriorImage: '/images/two-bedroom/exterior.png',
        exteriorImageAlt: 'The Duo two bedroom tiny home exterior with timber cladding and deck',
        floorplanImage: '/images/two-bedroom/floorplan.png',
        floorplanImageAlt: 'The Duo two bedroom floorplan layout',
        floorplan3dImage: '/images/two-bedroom/exterior-alt.png',
        floorplan3dImageAlt: 'The Duo two bedroom tiny home alternate exterior view',
        thirdImageCaption: 'Exterior view',
        floorplanPdfUrl: '#',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        name: 'The Family',
        slug: 'the-family',
        description: [
          'Our most popular two bedroom design featuring a master bedroom with optional ensuite, generous living area, and full-size kitchen. Ideal for small families or premium rental accommodation.',
          'The Family is designed around everyday living — with separated bedrooms, ample storage, and a kitchen that handles real cooking rather than just reheating. Optional ensuite layouts and a choice of external finishes let you tailor the home to your site, budget, and intended use.',
        ],
        priceFrom: 145000,
        width: 10.2,
        length: 6.0,
        totalArea: 61,
        bedrooms: 2,
        bathrooms: 2,
        exteriorImage: '/images/two-bedroom/exterior.png',
        exteriorImageAlt: 'The Family two bedroom tiny home exterior with timber cladding and deck',
        floorplanImage: '/images/two-bedroom/floorplan.png',
        floorplanImageAlt: 'The Family two bedroom floorplan layout',
        floorplan3dImage: '/images/two-bedroom/exterior-alt.png',
        floorplan3dImageAlt: 'The Family two bedroom tiny home alternate exterior view',
        thirdImageCaption: 'Exterior view',
        floorplanPdfUrl: '#',
      },
      {
        name: 'The Horizon',
        slug: 'the-horizon',
        description: [
          'A wider two bedroom design with an extended deck, floor-to-ceiling glazing, and premium kitchen package. Built for those who want extra space and elevated finishes.',
          'The Horizon prioritises light, outlook, and indoor-outdoor connection — with full-height glazing, an extended deck, and a generous open-plan living zone. Premium fixtures and contemporary cladding options make this our standout two bedroom design for owner-occupiers and high-yield holiday rentals.',
        ],
        priceFrom: 162000,
        width: 11.4,
        length: 6.6,
        totalArea: 75,
        bedrooms: 2,
        bathrooms: 2,
        exteriorImage: '/images/two-bedroom/exterior.png',
        exteriorImageAlt: 'The Horizon two bedroom tiny home exterior with timber cladding and expansive deck',
        floorplanImage: '/images/two-bedroom/floorplan.png',
        floorplanImageAlt: 'The Horizon two bedroom floorplan layout',
        floorplan3dImage: '/images/two-bedroom/exterior-alt.png',
        floorplan3dImageAlt: 'The Horizon two bedroom tiny home alternate exterior view',
        thirdImageCaption: 'Exterior view',
        floorplanPdfUrl: '#',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
    ],
  },
  'three-bedroom': {
    slug: 'three-bedroom',
    pageTitle: 'Three Bedroom',
    metaDescription:
      'Hartup Construction three bedroom tiny home designs — family-sized compact living with premium finishes and professional construction.',
    heroLead:
      'Our largest tiny home configuration — three bedrooms of smart, efficient living designed for families, multi-generational households, or high-yield investment properties.',
    introSections: [
      {
        eyebrow: 'Family Sized',
        heading: 'Compact Living Without Compromise',
        text: 'The three bedroom configuration proves that tiny home living does not mean sacrificing space. With three dedicated bedrooms, a full kitchen, and well-appointed bathrooms, this layout delivers genuine family accommodation in an efficient, affordable package.',
        button: { label: 'View Our Designs', href: '#our-designs' },
        image: bedroomImages['three-bedroom'].exterior,
        imageAlt: 'Three bedroom tiny home exterior with timber cladding and deck',
        imagePosition: 'left',
      },
      {
        eyebrow: 'Thoughtful Layout',
        heading: 'Space for Everyone',
        text: 'Generous open-plan living, dining, and kitchen zones connect to three separate bedrooms — each with built-in wardrobe storage. Master bedroom ensuite options and flexible floor plans accommodate growing families and multi-generational living.',
        image: bedroomImages['three-bedroom'].exteriorAlt,
        imageAlt: 'Three bedroom tiny home alternate exterior view with timber deck',
        imagePosition: 'right',
      },
      {
        eyebrow: 'Premium Build',
        heading: 'Quality That Lasts',
        text: 'Energy-efficient insulation, ventilation, and LED lighting combine with contemporary external finishes and large glazed openings. Every three bedroom Hartup tiny home is built to Australian standards with a comprehensive workmanship warranty.',
        button: { label: 'Get a Quote', href: '/contact?service=3-bedroom-tiny-home' },
        image: bedroomImages['three-bedroom'].floorplan,
        imageAlt: 'Three bedroom tiny home floorplan layout',
        imagePosition: 'left',
        imageFit: 'contain',
      },
    ],
    ourDesignsFeatureImage: {
      src: bedroomImages['three-bedroom'].exterior,
      alt: 'Hartup three bedroom tiny home exterior with modern timber cladding',
    },
    designs: [
      {
        name: 'The Homestead',
        slug: 'the-homestead',
        description: [
          'Our entry-level three bedroom design with a central living hub, shared bathroom, and three equal-sized bedrooms. A practical choice for families on a budget who need genuine three-bedroom accommodation.',
          'The Homestead delivers real family functionality without unnecessary complexity — three bedrooms, a full kitchen, and a shared bathroom arranged around a central living area. Built-in wardrobes, energy-efficient construction, and low-maintenance external finishes make this a smart option for growing families and long-term rental investment.',
        ],
        priceFrom: 185000,
        width: 12.0,
        length: 7.2,
        totalArea: 86,
        bedrooms: 3,
        bathrooms: 1,
        exteriorImage: '/images/three-bedroom/exterior.png',
        exteriorImageAlt: 'The Homestead three bedroom tiny home exterior with timber cladding and deck',
        floorplanImage: '/images/three-bedroom/floorplan.png',
        floorplanImageAlt: 'The Homestead three bedroom floorplan layout',
        floorplan3dImage: '/images/three-bedroom/exterior-alt.png',
        floorplan3dImageAlt: 'The Homestead three bedroom tiny home alternate exterior view',
        thirdImageCaption: 'Exterior view',
        floorplanPdfUrl: '#',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      },
      {
        name: 'The Estate',
        slug: 'the-estate',
        description: [
          'Our flagship three bedroom design featuring a master suite with ensuite, two additional bedrooms, main bathroom, and expansive open-plan living. Premium finishes and optional deck extensions available.',
          'The Estate is Hartup\'s most spacious tiny home — designed for families who need room to spread out without committing to a full-scale build. A master suite with ensuite, two further bedrooms, and a generous living and dining zone create a home that works for multi-generational living, large families, or premium accommodation with strong rental appeal.',
        ],
        priceFrom: 218000,
        width: 13.8,
        length: 8.4,
        totalArea: 116,
        bedrooms: 3,
        bathrooms: 2,
        exteriorImage: '/images/three-bedroom/exterior.png',
        exteriorImageAlt: 'The Estate three bedroom tiny home exterior with premium timber cladding',
        floorplanImage: '/images/three-bedroom/floorplan.png',
        floorplanImageAlt: 'The Estate three bedroom floorplan layout',
        floorplan3dImage: '/images/three-bedroom/exterior-alt.png',
        floorplan3dImageAlt: 'The Estate three bedroom tiny home alternate exterior view',
        thirdImageCaption: 'Exterior view',
        floorplanPdfUrl: '#',
      },
    ],
  },
};

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDimensions(width: number, length: number, totalArea: number): string {
  return `${width} × ${length} m | ${totalArea} m²`;
}
