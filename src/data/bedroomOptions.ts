import { bedroomImages } from './bedroomImages';

export const bedroomOptions = [
  {
    label: 'One Bedroom',
    shortLabel: '1 Bedroom',
    href: '/one-bedroom',
    image: bedroomImages['one-bedroom'].exterior,
    imageAlt: bedroomImages['one-bedroom'].exteriorAlt,
    alt: 'One bedroom tiny home exterior with timber cladding and deck',
  },
  {
    label: 'Two Bedroom',
    shortLabel: '2 Bedroom',
    href: '/two-bedroom',
    image: bedroomImages['two-bedroom'].exterior,
    imageAlt: bedroomImages['two-bedroom'].exteriorAlt,
    alt: 'Two bedroom tiny home exterior with timber cladding and deck',
  },
  {
    label: 'Three Bedroom',
    shortLabel: '3 Bedroom',
    href: '/three-bedroom',
    image: bedroomImages['three-bedroom'].exterior,
    imageAlt: bedroomImages['three-bedroom'].exteriorAlt,
    alt: 'Three bedroom tiny home exterior with timber cladding and deck',
  },
] as const;
