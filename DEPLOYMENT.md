# Hartup Construction — cPanel Deployment Guide

Deploy the **Astro build output** (`dist/`) to your cPanel server. The static HTML files in the repo root (`index.html`, etc.) are legacy mirrors — use the Astro build for hosting.

## Quick reference

| Goal | Command | Upload target |
|------|---------|---------------|
| Customer preview (hidden from search) | `npm run build:staging` | `public_html/` or staging subdomain folder |
| Go live | `npm run build` | `public_html/` on `hartupconstruction.com.au` |

---

## Staging mode

Set `STAGING=true` (via `.env.staging`) to:

- Add `<meta name="robots" content="noindex, nofollow">` on every page
- Serve `robots.txt` with `Disallow: /`

**Commands:**

```bash
npm install
npm run build:staging    # customer preview build
npm run build            # production / go-live build
npm run dev:staging      # local preview with staging flags
npm run preview:staging  # build staging + preview production output locally
```

Verify staging before upload:

1. Open `dist/robots.txt` — should contain `Disallow: /`
2. Open any HTML file in `dist/` — should contain `noindex, nofollow` in `<head>`

---

## Pre-deploy checklist

- [ ] Node.js 18+ installed locally
- [ ] `npm install` completed
- [ ] Correct build command run (`build:staging` for preview, `build` for launch)
- [ ] cPanel login and domain/subdomain ready
- [ ] SSL available (AutoSSL / Let's Encrypt)

---

## Option A — Preview on a staging subdomain (recommended)

Use e.g. `preview.hartupconstruction.com.au` so the live domain can stay parked until approval.

### 1. Create subdomain in cPanel

1. cPanel → **Domains** → **Subdomains**
2. Create `preview.hartupconstruction.com.au`
3. Note the document root (e.g. `public_html/preview`)

### 2. Build and upload

```bash
npm run build:staging
```

Upload **everything inside** `dist/` into the subdomain document root:

- `index.html`
- `about/`, `contact/`, `images/`, `_astro/`, etc.

Do **not** upload the `dist` folder itself — upload its contents.

**Upload methods:**

- cPanel **File Manager** → Upload (or Extract from zip)
- FTP/SFTP client (FileZilla, WinSCP) → connect with cPanel credentials

### 3. Password-protect the preview

1. cPanel → **Directory Privacy** (or **Password Protect Directories**)
2. Select the preview folder (e.g. `public_html/preview`)
3. Enable protection and create username/password for the customer

Share with the customer:

- URL: `https://preview.hartupconstruction.com.au`
- Username / password

### 4. Enable HTTPS

1. cPanel → **SSL/TLS Status**
2. Run **AutoSSL** for the subdomain

---

## Option B — Preview on the live domain

Same steps as Option A, but upload to `public_html/` and password-protect `public_html` until the customer approves.

Use this only if DNS already points to your server and you are comfortable password-protecting the main site temporarily.

---

## DNS setup (`hartupconstruction.com.au`)

At the domain registrar (or cPanel **Zone Editor** if DNS is managed there):

| Type | Name | Value |
|------|------|-------|
| A | `@` | Your cPanel server IP |
| A or CNAME | `www` | Server IP or `@` |

For a staging subdomain, cPanel usually creates the record automatically when you add the subdomain.

Allow up to 24–48 hours for DNS propagation (often much faster).

---

## Go-live checklist (after customer approval)

1. **Remove** cPanel directory password protection
2. **Rebuild for production:**
   ```bash
   npm run build
   ```
3. **Re-upload** all contents of `dist/` to `public_html/` (overwrite existing files)
4. **Verify** `https://hartupconstruction.com.au/robots.txt` shows `Allow: /`
5. **Verify** page source has **no** `noindex` meta tag
6. **Confirm** HTTPS works and redirects HTTP → HTTPS (optional `.htaccess` below)
7. **Test** contact form, phone links, navigation, and mobile layout
8. **Optional:** add Google Search Console and submit sitemap when `@astrojs/sitemap` is configured

### Optional HTTPS redirect (`.htaccess` in `public_html`)

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Updating the site later

1. Make changes locally
2. Run `npm run build` (or `build:staging` if still in review)
3. Upload/replace files in `public_html/` (or staging folder)
4. Clear browser cache if CSS/images look stale

---

## Troubleshooting

| Issue | Likely cause | Fix |
|-------|--------------|-----|
| 404 on inner pages | Files uploaded into wrong folder | Ensure `about/index.html` is at `public_html/about/index.html`, not nested deeper |
| Broken images/CSS | Incomplete upload | Re-upload entire `dist/` contents including `_astro/` and `images/` |
| Site still asks for password | Directory privacy still on | Disable in cPanel Directory Privacy |
| Site appears in Google during preview | Only robots.txt used | Use `build:staging` **and** cPanel password protection |
| SSL certificate error | AutoSSL not run | Run AutoSSL in cPanel for the domain/subdomain |

---

## Security notes

- **Password protection** is the primary gate for customer preview — staging meta tags and robots.txt are backup layers for search engines.
- Do not commit `.env.local` (local overrides only).
- `.env.staging` is committed intentionally — it only sets `STAGING=true`.

---

## Support contacts (fill in for your team)

| Role | Contact |
|------|---------|
| Hosting / cPanel admin | |
| DNS / domain registrar | |
| Developer | |
