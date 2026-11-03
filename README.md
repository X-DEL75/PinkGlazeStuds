# PinkGlaze Studio Website

Luxury black & pink website for PinkGlaze — makeup, photography, hair installation & microblading studio in Abule Egba, Lagos.

## Structure

```
pinkglaze/
├── index.html              # Public site
├── css/style.css
├── js/main.js              # Portfolio loading + UI
├── assets/logo.svg
├── admin/
│   └── pg-s4int-console.html   # HIDDEN admin console
└── README.md
```

## Admin location (keep private)

**Path:** `/admin/pg-s4int-console.html`

Full example once hosted:  
`https://yourdomain.com/admin/pg-s4int-console.html`

- Not linked anywhere on the public site  
- `noindex, nofollow` meta  
- Password-gated (session only, clears when tab closes)  
- Password: `s4int-Pinkglaze`

Do not share this path publicly.

## Supabase setup (when ready)

1. Create a Supabase project.
2. Create a table `posts`:

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  image_url text not null,
  category text,
  created_at timestamptz default now()
);

-- Optional: enable RLS and policies as needed
alter table posts enable row level security;

-- Public read
create policy "Public can read posts"
  on posts for select
  using (true);

-- For simplicity with anon key + password gate, you can allow insert/update/delete
-- for authenticated or just for the anon key during early use (tighten later).
create policy "Allow all for now"
  on posts for all
  using (true)
  with check (true);
```

3. Create a **Storage** bucket named `portfolio` (make it public or add a policy that allows public read + authenticated/anon upload).

4. In both files replace the placeholders:

- `js/main.js` → `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- `admin/pg-s4int-console.html` → same two constants

## Features

- Full-screen hamburger navigation
- Home introduction to PinkGlaze
- Services + exact prices you provided
- Portfolio feed (empty until admin uploads) with Newest / Oldest / All filters
- FAQ (Lagos-only, services, etc.)
- Contact section + form placeholder
- Admin: upload image + title + caption + category, edit, delete
- No auto-generated posts — only what you publish

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit the admin at `/admin/pg-s4int-console.html`.

## Notes

- WhatsApp link is a placeholder (`https://wa.me/234`) — replace with the real number.
- Contact form is front-end only for now.
- Theme: luxurious black + soft pink, professional serif + clean sans.
- Designed to feel high-end and calm, not playful.
