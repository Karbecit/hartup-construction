# Hartup Construction — CMS Admin

End-user guide (plain language): **[CMS-USER-MANUAL.md](CMS-USER-MANUAL.md)** or **Admin → Help**.

Flat-file PHP admin for Hartup. Content lives in **`content/site.json`**; the Astro site reads it at **build time** (`npm run build`).

## Admin areas

| URL | Purpose |
|-----|---------|
| `/admin/setup.php` | First-time setup (run once, then delete) |
| `/admin/login.php` | Admin login |
| `/admin/` | Dashboard |
| `/admin/pages.php` | **Pages** — Home, About Us, Contact Us |
| `/admin/page-edit.php?slug=home` | Section editor for a general page |
| `/admin/services.php` | **Services & categories** — list, add, menu order |
| `/admin/service-edit.php?slug=new-builds` | Section editor for a service page |
| `/admin/themes.php` | Colours & fonts |
| `/admin/settings.php` | SMTP, Turnstile, admin password |

Legacy URLs `/admin/content.php` and `/admin/categories.php` redirect to Pages and Services.

## Section types

When editing a page or service, you can add and reorder sections:

| Type | Description |
|------|-------------|
| **Image + text** | Split layout — image left or right, with eyebrow, heading, paragraphs, and bullet list |
| **Text only** | Heading and body copy |
| **Image only** | Full-width image with optional caption |
| **Service tiles** | Grid linking to services (e.g. New Builds, Kitchens, Bathrooms, Restorations) |

Each image field supports:

- Upload a new image
- Pick from the media library
- Pan/zoom crop (desktop and mobile)

## Menu management

On **Services**, drag items in the **Navigation menu order** list to reorder. Toggle **Show in menu** per service. Child services (e.g. bedroom layouts under New Builds) nest under their parent in the site header.

## Local setup

### 1. PHP config and content

After cloning the repo:

```powershell
npm install
npm run cms:setup
npm run cms:dev
```

`cms:setup` creates `config/config.php` and `content/site.json` from the committed examples if they are missing.

Visit **http://localhost:8090/admin/setup.php** and complete setup on a new machine.

### 2. Astro dev

```powershell
npm run dev
```

Visit **http://localhost:4321/**

### 3. Seed CMS content (optional)

```powershell
copy content\site.json.example content\site.json
npm run build
```

Default content is also in **`content/site.defaults.json`** (used when `site.json` is missing or partial).

## Publishing content changes

1. Edit pages or services in **/admin/**
2. Run `npm run build` (or `npm run build:staging`)
3. Upload **`dist/`** and CMS folders to cPanel:
   - `admin/`, `api/`, `includes/`, `content/`, `data/`, `.htaccess`
   - `config/config.php` on server only (never commit)

The contact form posts to **`/api/contact.php`**.

## Security

- Never commit `config/config.php` or `content/site.json`
- Delete `admin/setup.php` after first setup
- `.htaccess` blocks direct access to `config/`, `content/`, `data/`, `includes/`

## Pre-configured services

Matching Astro routes:

- `new-builds`, `upgrades`, `restorations`
- `one-bedroom`, `two-bedroom`, `three-bedroom`
- `kitchens`, `bathrooms` (used for home page tiles; may share `/upgrades` href)

Gallery and section uploads go to **`public/images/`** (served as `/images/` on the live site).
