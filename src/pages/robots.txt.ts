import type { APIRoute } from 'astro';
import { STAGING } from 'astro:env/server';

export const GET: APIRoute = () => {
  const body = STAGING
    ? ['User-agent: *', 'Disallow: /'].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${import.meta.env.SITE}/sitemap-index.xml`,
      ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
