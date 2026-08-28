# Hartup Construction — production update

Use this with **`hartup-production-update.zip`**. Extract the zip **into** `public_html` (do not leave an extra folder around the files).

This package is a **production** build (`npm run build`), not staging. Pages should be indexable.

## Before you start

1. Log in to **cPanel**.
2. Open **File Manager** → **`public_html`**.
3. **Back up first:**
   - Download a copy of `public_html/config/config.php`
   - Download a copy of `public_html/content/site.json`
   - Optional: compress the current `public_html` folder as a zip in File Manager

Do **not** skip the `config.php` backup. That file has live passwords, SMTP, and Turnstile keys.

## What this zip contains

- New public site files (`index.html`, `terms/`, `_astro/`, `images/`, and other pages)
- CMS code (`admin/`, `api/`, `includes/`)
- Content snapshot (`content/site.json`, `content/site.defaults.json`)
- `data/themes.json` and `.htaccess`

It does **not** contain `config/config.php`. Leave the server copy in place.

## Upload and extract

1. Upload **`hartup-production-update.zip`** into `public_html`.
2. Select the zip → **Extract**.
3. Extract **into `public_html`**, so you have:
   - `public_html/index.html`
   - `public_html/terms/index.html`
   - `public_html/_astro/`
   - `public_html/images/`
   - `public_html/admin/`
   - `public_html/api/`
   - `public_html/includes/`
   - `public_html/content/site.json`
   - `public_html/.htaccess`
4. Confirm there is **no** extra nested folder such as `public_html/dist/` or `public_html/hartup-production-update/`.
5. Delete the zip from `public_html` after a successful extract (optional).

Overwrite existing files when prompted.

## Do not overwrite these

| File | Action |
|------|--------|
| `public_html/config/config.php` | Keep the live file. Do not replace it. |
| `admin/setup.php` | Do not run setup again. Delete it if it reappears. |

If extract created a new `config/config.example.php`, that is fine. It is only a template.

## After extract

1. Visit **https://hartupconstruction.com.au/** and hard-refresh (Ctrl+F5).
2. Check:
   - Home, New Builds, bedroom pages, Upgrades, Restorations
   - Footer: **Website created by KarBec IT Services**
   - **Terms and Conditions** in the footer
   - Contact form
3. Visit **https://hartupconstruction.com.au/terms**
4. Log in to **https://hartupconstruction.com.au/admin/**
   - Open **Pages → Terms and Conditions**
   - Upload the terms PDF and save

The public **Download PDF** button is baked into the static page at build time. If you upload the PDF only on the live admin after this extract, save the page, then rebuild locally (`npm run build`) and re-upload `terms/` plus `content/site.json`.

## If something looks wrong

- **Old CSS/layout:** the `_astro/` folder did not upload. Re-extract the whole zip.
- **404 on /terms:** `terms/index.html` is missing or nested in the wrong folder.
- **Admin login broken:** restore `config/config.php` from your backup.
- **CMS content missing:** restore `content/site.json` from your backup.
- **Images missing:** confirm `public_html/images/` has the new files (design photos, kitchens, bathrooms).

## Note about CMS content

This zip includes a `content/site.json` snapshot from the machine that built it. Extracting **overwrites** live CMS text with that snapshot.

If the live site has newer admin edits than this package, restore the backed-up `site.json` after extract, then re-apply only the new Terms page in admin.
