# Wood & Grains Furniture — Website

A simple showcase site. Every product links to a pre-filled **WhatsApp enquiry** — no cart, no checkout, no payments.

Products (name, price, category, photos, description, extra info) are managed through a real admin page at **`/admin.html`**, backed by a free [Supabase](https://supabase.com) project.

## One-time setup

### 1. Create your Supabase project
- Sign up free at supabase.com (no credit card).
- Create a new project, pick a region, save your database password somewhere safe.

### 2. Create the `products` table
In **Table Editor → New table**, name it `products`, and add these columns (in addition to the default `id` and `created_at` columns Supabase adds automatically):

| Column        | Type |
|---------------|------|
| name          | text |
| price         | int8 |
| category      | text |
| material      | text |
| image_url     | text |
| image_2       | text |
| image_3       | text |
| image_4       | text |
| description   | text |
| product_info  | text |

If you already have the table from before, don't recreate it — just run `supabase-migration.sql` (see step 3), which adds the new columns for you.

### 3. Run the migration / security script
Open **SQL Editor → New query**, paste in the contents of `supabase-migration.sql` from this project, and run it. This:
- adds the new `image_2`, `image_3`, `image_4` and `product_info` columns,
- **turns on Row Level Security** so the public can only *read* products, and only a signed-in admin can add/edit/delete them,
- locks down the `product-images` storage bucket the same way.

Previously RLS was left off, which meant anyone who inspected the page (or just called the Supabase REST API directly) could insert, edit, or delete any product using the public anon key — that's now fixed.

### 4. Create your admin login
The old "type a password stored in a JS file" login has been replaced with a real login, because that password was visible to anyone who viewed the page source and gave no real protection.

- **Authentication → Users → Add user** in your Supabase dashboard.
- Tick **Auto Confirm User**, set an email and a strong password — this is what you'll use to sign in at `/admin.html`.
- Then go to **Authentication → Providers → Email** and turn **off** "Allow new users to sign up", so nobody else can create their own account.

### 5. Create a storage bucket for photos
**Storage → New bucket** → name it exactly `product-images` → set it to **Public** (this only controls whether *uploaded files* are viewable by URL; who can *upload* is controlled by the storage policies from step 3).

### 6. Get your API keys
**Project Settings → API** → copy the **Project URL** and the **anon public** key.

Open `js/supabase-config.js` in this project and paste them in:
```js
const SUPABASE_URL = 'https://yourproject.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```
The anon key is safe to have in a public site — with RLS in place (step 3) it can only read products, never write.

## Deploying (free, no backend server, no ongoing cost)

1. Push this folder to a GitHub repository.
2. Sign up free at [netlify.com](https://netlify.com), "Add new site → Import an existing project", pick your repo, deploy. No build command needed, it's a static site.
3. You'll get a live `yoursite.netlify.app` URL. Attach your own domain later if you want, still free.

## Using it day to day

- Go to `yoursite.netlify.app/admin.html`, sign in with the email/password you created in step 4.
- Fill in the name, price, category, material, optional description, optional "product information" (dimensions, materials, care instructions, etc.), a main photo, and up to 3 additional view photos.
- Click **Save product**. It appears on your live site within seconds — no redeploy needed.
- Edit or delete existing products from the list on the same page.
- Use **Sign out** when you're done on a shared computer.

## What's shown where
- **Shop page**: each product card shows its photo, name and price; the category sidebar shows a live count of products per category (no more manually-typed numbers). Material/colour filters have been removed.
- **Product page**: main photo + up to 3 additional view thumbnails (only the ones you've uploaded), name, price, description, and — if you filled it in — a separate "Product Information" section for extra detail.

## Changing the WhatsApp number
Open `js/script.js` and change:
```js
const WHATSAPP_NUMBER = '9746841327';
```
Use the full number with country code, no `+`, spaces, or dashes (e.g. `919746841327`).

## Note on Supabase's free tier
A free Supabase project pauses itself after 7 days with zero activity. If that happens, log into your Supabase dashboard once and click "Restore" — it takes a few seconds and nothing is lost.
