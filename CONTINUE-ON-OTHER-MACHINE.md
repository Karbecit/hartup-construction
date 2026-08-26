# Continue Hartup work on another computer

Use this guide after cloning or pulling the repo on a second machine (same Cursor account or not).

## How files sync between computers

| What | How it syncs |
|------|----------------|
| **Code, CMS, images in git** | **GitHub** — `git pull` / `git push` |
| **CMS content edits** | `content/site.json` is **not** in git (local/server only). Shared baseline is in `content/site.json.example` — run `npm run cms:setup` on a new machine. After editing here, ask Cursor to sync `site.json` → `site.json.example` + `site.defaults.json` and commit. |
| **Secrets** | `config/config.php` is **not** in git. Created from `config/config.example.php` via `npm run cms:setup`. |
| **Cursor settings** | Same Cursor account may sync editor settings; **project files do not** sync via Cursor alone. |
| **This chat / agent context** | Does **not** transfer. Open this file on the other machine and paste the prompt below into a new Cursor chat. |

**Bottom line:** use **GitHub** for the project. Cursor account = same login and settings, not automatic file sharing.

---

## One-time setup (new machine)

**Prerequisites:** Node.js 18+, PHP 8.1+ (for CMS admin), Git.

```powershell
cd C:\Projects\Hartup   # or your clone path
git pull origin main
npm install
npm run cms:setup
```

If you already had an old clone and the site looks wrong (missing CMS sections/images):

```powershell
del content\site.json
npm run cms:setup
```

First-time admin login on this machine:

1. `npm run cms:dev`
2. Open http://localhost:8090/admin/setup.php
3. Set admin password, then delete or ignore setup.php on production only

---

## Daily workflow (two terminals)

**Terminal 1 — website (Astro):**

```powershell
npm run dev
```

→ http://localhost:4321/

**Terminal 2 — CMS admin (PHP):**

```powershell
npm run cms:dev
```

→ http://localhost:8090/admin/

After CMS edits, refresh the Astro dev tab (content loads from `content/site.json` in dev).

---

## Prompt to paste into Cursor on the other computer

Copy everything inside the box into a **new Cursor chat** after `git pull`:

```
I'm continuing the Hartup Construction project on this machine after pulling from GitHub.

Please:
1. Read CONTINUE-ON-OTHER-MACHINE.md and CMS.md
2. Confirm git is on latest main and run npm install + npm run cms:setup if content/site.json or config/config.php is missing
3. Verify CMS admin (npm run cms:dev → :8090) and Astro site (npm run dev → :4321) can run
4. Use content/site.json.example as the shared content baseline if site.json is empty or stale

Recent work on the other machine includes:
- Flat-file PHP CMS (admin/, includes/, api/)
- Custom layout sections (drag/resize canvas, rich text with styles, tick bullet lists)
- Tighter consistent section spacing (--section-padding-y in global.css)
- CMS content and media committed via site.defaults.json / site.json.example

Do not commit config/config.php, content/site.json, or data/rate_limits/.
```

---

## When you finish editing CMS content (either machine)

Before pushing so the other computer stays in sync:

1. Save in admin (writes `content/site.json`)
2. Ask Cursor to copy `content/site.json` → `content/site.json.example` and `content/site.defaults.json`
3. Commit and push those two files (not `site.json` itself)

Or run manually:

```powershell
copy content\site.json content\site.json.example
copy content\site.json content\site.defaults.json
git add content/site.json.example content/site.defaults.json
git commit -m "Sync CMS content for other machines."
git push
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site looks like old static placeholders | `del content\site.json` then `npm run cms:setup` |
| Admin 404 / PHP errors | Run `npm run cms:dev` (not Astro dev server) |
| Images missing in admin | Ensure `public/images/` pulled; hard refresh |
| CMS code missing | `git pull` — need commits `7dc393b`, `59a5092`, `ebedeef` or later |
| Layout editor old behaviour | Hard refresh admin (`Ctrl+F5`) after pull |

---

## Key repo paths

```
admin/              CMS admin UI
content/site.json   Live CMS content (local, gitignored)
content/site.json.example   Shared content snapshot (committed)
includes/sections.php       Section types + layout blocks
admin/assets/layout-editor.js   Custom layout editor
src/components/CmsSections.astro   Frontend rendering
scripts/cms-setup.js    Bootstrap config + content on clone
```

---

## Useful commands

```powershell
git pull origin main
npm install
npm run cms:setup
npm run cms:dev
npm run dev
npm run build          # production static site in dist/
```

See **CMS.md** and **DEPLOYMENT.md** for publishing to cPanel.
