import fs from 'node:fs';
import path from 'node:path';
import siteDefaults from '../../content/site.defaults.json';

export interface CmsImageField {
  file: string;
  alt?: string;
  crop_x?: number;
  crop_y?: number;
  crop_zoom?: number;
  crop_x_mobile?: number;
  crop_y_mobile?: number;
  crop_zoom_mobile?: number;
  aspect_ratio?: number;
}

export interface CmsSection {
  id: string;
  type: 'image_text' | 'text' | 'image' | 'service_tiles' | string;
  enabled?: boolean;
  background?: 'default' | 'elevated';
  eyebrow?: string;
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  image_position?: 'left' | 'right';
  image_scale?: number;
  heading_size?: string;
  heading_weight?: string;
  text_size?: string;
  eyebrow_size?: string;
  min_height?: number;
  blocks?: Array<{
    id: string;
    type: 'image' | 'text';
    x: number;
    y: number;
    w: number;
    h: number;
    content?: string;
    eyebrow?: string;
    heading?: string;
    paragraphs?: string[];
    heading_size?: string;
    heading_weight?: string;
    text_size?: string;
    eyebrow_size?: string;
    image?: CmsImageField;
  }>;
  image?: CmsImageField;
  caption?: string;
  tiles?: Array<{
    service_slug: string;
    label?: string;
    image?: CmsImageField;
  }>;
}

export interface CmsPage {
  slug: string;
  title: string;
  path: string;
  page_hero?: {
    use_site_hero?: boolean;
    eyebrow?: string;
    heading?: string;
    lead?: string;
  };
  sections: CmsSection[];
}

export interface CmsService {
  slug: string;
  title: string;
  nav_label: string;
  href: string;
  tag?: string;
  description?: string;
  in_menu?: boolean;
  menu_order?: number;
  parent_slug?: string;
  visible?: boolean;
  sections: CmsSection[];
}

export interface CmsContent {
  meta: { title: string; description: string };
  hero: { tagline: string; background_image: string };
  contact: {
    eyebrow: string;
    heading: string;
    intro: string;
    project_management_name: string;
    project_management_phone: string;
    project_management_phone_href: string;
    office_phone: string;
    office_phone_href: string;
    email: string;
    service_area: string;
    business_hours: string;
    location: string;
  };
  footer: { brand: string; tagline: string; abn: string };
  pages: Record<string, CmsPage>;
  services: CmsService[];
}

export const cmsDefaults: CmsContent = siteDefaults as CmsContent;

function mergeDeep<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = mergeDeep(result[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

export function loadCmsContent(): CmsContent {
  const jsonPath = path.join(process.cwd(), 'content/site.json');
  if (!fs.existsSync(jsonPath)) {
    return cmsDefaults;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as Record<string, unknown>;
    return mergeDeep(cmsDefaults, parsed);
  } catch {
    return cmsDefaults;
  }
}

let buildCms: CmsContent | null = null;

export function getCms(): CmsContent {
  if (import.meta.env.DEV) {
    return loadCmsContent();
  }
  if (!buildCms) {
    buildCms = loadCmsContent();
  }
  return buildCms;
}

/** Reads site.json on each access during dev so CMS edits appear without restarting Astro. */
export const cms: CmsContent = import.meta.env.DEV
  ? (new Proxy({} as CmsContent, {
      get(_target, prop) {
        return (getCms() as Record<string | symbol, unknown>)[prop];
      },
    }) as CmsContent)
  : loadCmsContent();

export function getPage(slug: string): CmsPage | undefined {
  return getCms().pages?.[slug];
}

export function serviceBySlug(slug: string): CmsService | undefined {
  return getCms().services?.find((service) => service.slug === slug);
}

export function navLinksFromCms() {
  const content = getCms();
  const staticLinks = [
    { href: '/', label: 'Home' },
  ];

  const services = (content.services ?? [])
    .filter((service) => service.in_menu && service.visible && !service.parent_slug)
    .sort((a, b) => (a.menu_order ?? 0) - (b.menu_order ?? 0));

  const serviceLinks = services.map((service) => {
    const children = (content.services ?? [])
      .filter((child) => child.in_menu && child.visible && child.parent_slug === service.slug)
      .sort((a, b) => (a.menu_order ?? 0) - (b.menu_order ?? 0))
      .map((child) => ({
        href: child.href,
        label: child.nav_label || child.title,
      }));

    return {
      href: service.href,
      label: service.nav_label || service.title,
      ...(children.length ? { children } : {}),
    };
  });

  return [
    ...staticLinks,
    ...serviceLinks,
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
  ];
}

export const serviceArea = cms.contact.service_area;
export const serviceAreaLong = 'the Adelaide metropolitan area and surrounding regions';

export const serviceAreaRegions = [
  'Adelaide CBD and inner suburbs',
  'Adelaide Hills',
  'Barossa Valley',
  'Fleurieu Peninsula',
  'Gawler and northern suburbs',
  'McLaren Vale and southern suburbs',
  'Murray Bridge and eastern regions',
] as const;

export const projectManagementContact = {
  department: 'Project Management',
  name: cms.contact.project_management_name,
  phone: cms.contact.project_management_phone,
  phoneTel: cms.contact.project_management_phone_href,
} as const;

export const officeContact = {
  department: 'Office & Accounts',
  phone: cms.contact.office_phone,
  phoneTel: cms.contact.office_phone_href,
  email: cms.contact.email,
} as const;

export const businessHours = cms.contact.business_hours;
