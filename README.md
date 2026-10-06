# COLUMNIST — Ebooks for a Wiser You

A premium digital library & e-book platform. Dark, editorial, luxury-publishing aesthetic.
Built with **Next.js 14 + TypeScript + Tailwind CSS + Supabase** (Auth, Postgres, Storage, RLS),
deployed on **Vercel** at [columnist.site](https://columnist.site).

## What it does

- **Public site** — cinematic hero, dynamic category strip, featured-books carousel, new arrivals,
  full-text search overlay, filterable book catalog, category pages, premium book detail pages,
  about / contact / legal pages, SEO (per-book metadata, OG, canonical, JSON-LD, sitemap).
- **Accounts** — Supabase Auth (register / login / forgot / reset, session persistence).
- **Book requests** — logged-in users request a book; **no payment gateway** — payment happens
  externally/manual. Admin approves with one click → access granted → book appears in the
  user's library.
- **Library & reader** — approved books only; online EPUB reader (epub.js) with TOC, themes,
  font/width settings, fullscreen, keyboard nav, and reading progress saved to the DB
  (resume where you left off); authorized PDF downloads via signed URLs.
- **Admin panel** (`/admin`) — dashboard stats, book CRUD with drag-drop cover/EPUB/PDF uploads,
  category CRUD, user management + FREE/PRO membership, purchase-request approval queue,
  reading analytics, site settings. Role-based: only `profiles.role = 'admin'` can enter
  (enforced in middleware **and** in every admin API route **and** by RLS).
- **Security** — private storage buckets for EPUB/PDF (signed URLs only after access check),
  RLS on every table, users cannot change their own role/membership (DB-enforced),
  service-role key stays server-side.

## Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | Next.js 14 (App Router), React 18, TypeScript |
| Styling    | Tailwind CSS 3, Playfair Display + Inter (next/font) |
| Backend    | Supabase: Auth, Postgres + RLS, Storage |
| EPUB       | epub.js (client-side rendering) |
| Deploy     | Vercel, custom domain `columnist.site` |

## Project structure

```
app/                    # routes
  page.tsx              # homepage (hero, strip, featured, arrivals, …)
  books/                # catalog + /books/[slug] detail
  categories/[slug]/    # category pages
  dashboard/ library/ profile/   # user area (auth required)
  read/[bookId]/        # EPUB reader (access required)
  admin/                # admin panel (role=admin required)
  api/                  # JSON APIs (requests, progress, profile, contact,
                        #   signed file URLs, admin/*)
  login/ register/ forgot-password/ reset-password/
  about/ contact/ privacy/ terms/
  sitemap.ts  robots.ts  not-found.tsx  layout.tsx  globals.css
components/             # Header, Footer, Hero, BookCard, BookCover, Reader,
                        #   SearchOverlay, UploadZone, Skeletons, …
lib/                    # supabase/{client,server,admin}, auth guards,
                        #   types, utils, storage helpers
supabase/
  migrations/0001_init.sql      # schema + RLS + triggers
  migrations/0002_storage.sql   # buckets + storage policies
  migrations/0003_settings.sql  # site_settings table
  seed.sql                      # 12 categories + 5 featured books
scripts/make-sample-epub.mjs    # generates a test EPUB (public-domain text)
middleware.ts           # session refresh + route protection
```

## Setup

### 1. Prerequisites
Node.js 18+ and npm. A Supabase project and a Vercel account.

### 2. Install
```bash
cd columnist
npm install
```

### 3. Supabase — database
In the Supabase dashboard → **SQL Editor**, run in order:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_storage.sql`
3. `supabase/migrations/0003_settings.sql`
4. `supabase/seed.sql` (12 categories + 5 featured books)

Verify: **Storage** shows buckets `book-covers` (public), `book-epubs` (private),
`book-pdfs` (private), `avatars` (public).

### 4. Supabase — auth URLs
**Authentication → URL Configuration**:
- Site URL: `https://columnist.site`
- Redirect URLs: `https://columnist.site/**` (add `http://localhost:3000/**` for local dev)

### 5. Environment
```bash
cp .env.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server only — never commit), and `NEXT_PUBLIC_SITE_URL`.

### 6. Create the admin user
1. Register at `/register` (or invite via Supabase Auth).
2. In SQL Editor: `update public.profiles set role='admin' where email='you@example.com';`

### 7. Run / build
```bash
npm run dev      # local dev
npm run build    # production build (must pass with zero TS errors)
npm run lint
```

### 8. Deploy to Vercel
- Push this repo to GitHub, import in Vercel.
- Add the 4 env vars above in **Project Settings → Environment Variables**.
- **Domains** → add `columnist.site` (and `www` if desired) per Vercel's DNS instructions.

## Testing the reader
```bash
npm run make-sample-epub   # → scripts/sample-meditations.epub
```
Then: Admin → Books → pick a book → upload the EPUB → request/approve it as a test user →
open the reader. See `TESTING.md` for the full checklist.

## Notes
- There is **no payment gateway** anywhere by design. The request flow message is:
  *"Your request has been received. Access will be activated after payment verification."*
- Book covers are rendered typographically by `<BookCover>` until an admin uploads real art.
- Fonts load via `next/font` (no external font CDN needed).
