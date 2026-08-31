# Hartup Construction — production update

Use this with **`hartup-production-update.zip`**. Extract the zip **into** `public_html` (do not leave an extra folder around the files).

This package is a **production** build (`npm run build`), not staging.

If the CMS is already set up, extracting this zip **updates** the public pages and PHP. It does **not** include a live `config/config.php`. Keep the one already on the server.

`config/` and `content/` are hidden from the public website on purpose (`.htaccess` blocks them). Check they exist in **cPanel File Manager**, not by opening `/config` in a browser.

## Before you start

1. Log in to **cPanel**.
2. Open **File Manager** → **`public_html`**.
3. Optional: compress the current `public_html` folder as a backup zip in File Manager.
4. If `config/config.php` already exists, download a copy before extracting.

## What this zip contains

- Public site files (`index.html`, `terms/`, `_astro/`, `images/`, and other pages)
- CMS code (`admin/` including **setup.php**, `api/`, `includes/`)
- **`content/`** with `site.json` (page copy) and defaults
- **`config/`** with `config.example.php` only — not a live `config.php`
- `data/themes.json` and `.htaccess`

## Upload and extract

1. Upload **`hartup-production-update.zip`** into `public_html`.
2. Select the zip → **Extract** into `public_html`.
3. Confirm this structure:
   - `public_html/index.html`
   - `public_html/terms/index.html`
   - `public_html/_astro/`
   - `public_html/images/`
   - `public_html/admin/`
   - `public_html/api/`
   - `public_html/includes/`
   - `public_html/content/site.json`
   - `public_html/config/config.example.php`
   - `public_html/.htaccess`
4. There must be **no** nested `public_html/dist/` or `public_html/hartup-production-update/`.
5. Overwrite existing HTML/CSS/images when prompted.
6. Delete the zip from `public_html` after a successful extract (optional).

## First-time CMS setup (required)

`config/config.php` does not exist yet. Create it on the server:

1. In File Manager, confirm `config/` is writable (permissions `755` on the folder is usually enough).
2. Open **https://hartupconstruction.com.au/admin/setup.php**
3. Fill in:
   - Admin username and a password (at least 10 characters)
   - **Site URL:** `https://hartupconstruction.com.au` (not localhost)
   - Enquiry email, SES SMTP username/password
   - Cloudflare Turnstile site key and secret
4. Save, then log in at `/admin/login.php`
5. **Delete** `public_html/admin/setup.php` in File Manager after setup succeeds

After setup you should have `public_html/config/config.php`. Never replace that file on later uploads.

## After setup

1. Hard-refresh **https://hartupconstruction.com.au/** (Ctrl+F5).
2. Check home, bedroom pages, footer KarBec credit, Terms link, and the contact form.
3. Open **https://hartupconstruction.com.au/terms**
4. In **Pages → Terms and Conditions**, upload the terms PDF and save.

The public **Download PDF** button is baked into the static page at build time. If you upload the PDF only on the live admin, save the page, then rebuild locally (`npm run build`) and re-upload `terms/` plus `content/site.json`.

## If something looks wrong

- **`/config` or `/content` in the browser is 403:** expected. Use File Manager.
- **Old CSS/layout:** `_astro/` did not upload. Re-extract the zip.
- **404 on /terms:** `terms/index.html` is missing or nested in the wrong folder.
- **Setup cannot save config:** folder permissions on `public_html/config`.
- **Admin 404:** `admin/` was not extracted into `public_html`.
- **Contact form fails:** finish setup (SMTP + Turnstile) first.
- **Contact form says success but no email arrives:**
  1. Extract this zip so the updated `includes/mailer.php`, `api/contact.php`, and `contact/` HTML are live. Keep `config/config.php`.
  2. In **Admin → Settings**, Site URL must be `https://hartupconstruction.com.au` (not localhost).
  3. **From email** must be a verified SES identity. SMTP username is the IAM key, not the from address.
  4. If AWS SES is still in **sandbox**, it will not deliver to unverified inboxes. Request production access, or verify the office address as a recipient.
  5. Hard-refresh `/contact` (Ctrl+F5) so the new form script loads, then submit once more.
- **Images missing:** confirm `public_html/images/` includes the new design photos.
