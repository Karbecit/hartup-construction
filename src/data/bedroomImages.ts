export const bedroomImages = {
  'one-bedroom': {
    exterior: '/images/one-bedroom/exterior.png',
    exteriorAlt: '/images/one-bedroom/exterior-alt.png',
    floorplan: '/images/one-bedroom/floorplan.png',
  },
  'two-bedroom': {
    exterior: '/images/two-bedroom/exterior.png',
    exteriorAlt: '/images/two-bedroom/exterior-alt.png',
    floorplan: '/images/two-bedroom/floorplan.png',
  },
  'three-bedroom': {
    exterior: '/images/three-bedroom/exterior.png',
    exteriorAlt: '/images/three-bedroom/exterior-alt.png',
    floorplan: '/images/three-bedroom/floorplan.png',
  },
} as const;

export const bedroomGridImages = [
  bedroomImages['one-bedroom'].exterior,
  bedroomImages['two-bedroom'].exterior,
  bedroomImages['three-bedroom'].exterior,
] as const;

export const bedroomGridImagesAlt = [
  bedroomImages['one-bedroom'].exteriorAlt,
  bedroomImages['two-bedroom'].exteriorAlt,
  bedroomImages['three-bedroom'].exteriorAlt,
] as const;
