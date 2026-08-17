# Putzamt — WG Wollmarktstr. 63

A tiny chore/trash tracker for the three of you. Static frontend + one Cloudflare Pages Function + one D1 table. No frameworks, no build step.

## What's in here
- `index.html`, `style.css`, `app.js` — the site
- `functions/api/logs.js` — the API (Cloudflare Pages Function, auto-routes to `/api/logs`)
- `schema.sql` — the one D1 table you need
- `wrangler.toml` — config for CLI deploys

## Status: D1 is already set up ✅
Claude provisioned this part for you already, via your connected Cloudflare account:
- Database `wg-putzamt-db` exists (id already filled into `wrangler.toml`)
- The `logs` table + index are created and ready

What's left is pushing the actual site files — Claude's Cloudflare connection can manage D1/KV/R2 data, but it can't push a Pages project or its files (Cloudflare doesn't expose that over the connector API). That last step needs either Wrangler or the dashboard, whichever you prefer:

### Option A — CLI (fastest if you're comfortable in a terminal)

1. Install Wrangler, if you don't have it:
   ```
   npm install -g wrangler
   ```
2. Log in (opens a browser tab):
   ```
   wrangler login
   ```
3. From inside this folder, deploy:
   ```
   wrangler pages deploy .
   ```
   First run will ask you to create a Pages project — name it `wg-putzamt` (or anything you like).
4. **Bind the database** (one-time, in the Cloudflare dashboard):
   Workers & Pages → your project → Settings → Functions → D1 database bindings → Add binding:
   - Variable name: `DB`
   - Database: `wg-putzamt-db`

   Then redeploy once (`wrangler pages deploy .`) so the binding takes effect.

### Option B — Dashboard only (no terminal)

1. Go to the Cloudflare dashboard → Workers & Pages → Create → Pages → Upload assets.
2. Drag in this whole folder (including the `functions` subfolder) and give the project a name.
3. Same binding step as above: Settings → Functions → D1 database bindings → add `DB` → `wg-putzamt-db`.
4. Redeploy once after adding the binding.

Either way, your site ends up at `https://<project-name>.pages.dev`. Share that link with Mahin and Razim — no login, no accounts, whoever opens it just taps their own name.

## Optional: custom domain
If you have a domain on Cloudflare already, add it under the Pages project → Custom domains. Free, no extra config needed.

## Notes
- The three names (Jubayer, Mahin, Razim) and the two task types are hardcoded in `index.html`/`app.js` — easy to find and rename if the roommate lineup ever changes.
- The API validates person/action/details server-side, so a stray request can't corrupt the log.
- The "funny log" line is generated from a small template pool, picked deterministically per entry (so it won't change on refresh).
