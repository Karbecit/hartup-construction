# Hartup Construction Website

Professional website for **Hartup Construction** — [hartupconstruction.com.au](https://hartupconstruction.com.au)

## Tech Stack

- **[Astro 5](https://astro.build)** — Static site generator (fast, SEO-friendly)
- **HTML / CSS / TypeScript** — No heavy frameworks, minimal JavaScript
- **Responsive design** — Mobile-first layout with modern industrial aesthetic

## Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Hero, services overview, featured projects, stats |
| New Builds | `/new-builds` | Tiny home design features, benefits, bedroom options |
| Upgrades | `/upgrades` | Property upgrades (placeholder — awaiting customer content) |
| Restorations | `/restorations` | Heritage restorations (placeholder — awaiting customer content) |
| About | `/about` | Company story, values, accreditations |
| Services | `/services` | Residential, commercial, renovations, project management |
| Projects | `/projects` | Filterable project gallery |
| Contact | `/contact` | Contact form, phone, email, service area |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (included with Node.js)

### Install & Run

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full cPanel upload guide, password-protected preview setup, and go-live checklist.

The site builds to static HTML in the `dist/` folder.

### Build commands

```bash
# Customer preview — blocks search indexing (noindex + Disallow robots.txt)
npm run build:staging

# Production — allow indexing when customer has approved
npm run build
```

Upload the **contents** of `dist/` to cPanel `public_html/` (or a staging subdomain folder). Password-protect the folder in cPanel during customer review.

### Other hosts

| Platform | Notes |
|----------|-------|
| **Netlify** | Connect repo, build: `npm run build`, publish: `dist` |
| **Vercel** | Auto-detects Astro; set output to `dist` |
| **Cloudflare Pages** | Build: `npm run build`, output: `dist` |
| **cPanel** | See [DEPLOYMENT.md](./DEPLOYMENT.md) |

### Domain Setup

1. Purchase/configure `hartupconstruction.com.au` with your registrar
2. Point DNS A/CNAME records to your hosting provider
3. Enable HTTPS (most hosts provide free SSL via Let's Encrypt)

## Customisation Checklist

Before going live, update these placeholder values:

- [x] **Phone numbers** — Project Management (Robert): 0418 839 759; Office: 08 7119 5191
- [x] **Email** — `office@hartupconstruction.com.au`
- [ ] **Company stats** — Years experience, project count on homepage
- [ ] **Project photos** — Replace Unsplash placeholders with real project images in `public/images/`
- [ ] **About content** — Founding year, team size, accreditations in `about.astro`
- [ ] **Contact form** — Wire up to a form service (Formspree, Netlify Forms, or custom backend)
- [ ] **Google Analytics / Search Console** — Add tracking scripts to `Layout.astro`
- [ ] **ABN / business details** — Add to footer if required

## Project Structure

```
Hartup/
├── public/              # Static assets (favicon, robots.txt)
├── src/
│   ├── components/      # Reusable UI components
│   ├── layouts/         # Page layout with SEO meta tags
│   ├── pages/           # Route pages
│   └── styles/          # Global CSS
├── astro.config.mjs     # Astro configuration
├── package.json
└── README.md
```

## License

© Hartup Construction. All rights reserved.
