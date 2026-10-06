# COLUMNIST — Manual Test Checklist

Run through these on the production deploy (`https://columnist.site`) after the
database migrations, seed, buckets, env vars and an admin user are in place.
Tick each box only when the behavior is observed, not assumed.

## 0. Pre-flight
- [ ] `npm run build` passes with zero TypeScript errors; `npm run lint` clean
- [ ] Migrations 0001–0003 + seed applied; 4 storage buckets exist
- [ ] Env vars set in Vercel; `columnist.site` domain attached and loading
- [ ] Admin user created (`profiles.role = 'admin'`)

## 1. Authentication
- [ ] Register: full name / email / password / confirm — mismatch shows error; success → prompt to sign in
- [ ] Login with wrong password → friendly error (no stack trace)
- [ ] Login correct → lands on /dashboard ("Welcome back, <Name>")
- [ ] Reload → still logged in (session persistence); header shows account menu
- [ ] Logout → header shows Login/Register; /dashboard redirects to /login
- [ ] Forgot password → email arrives; reset link → set new password → login works
- [ ] Password visibility toggles work on all auth forms

## 2. Public site
- [ ] Homepage: hero, category strip (from DB), Featured Books carousel with arrows, Recently Added, Explore Categories, Why Columnist, quote, CTA, footer
- [ ] Header search icon → overlay, live results, empty state "No books found."
- [ ] /books: text search, category/author/price/featured filters, sort (newest/oldest/A–Z/Z–A/price), pagination, result count
- [ ] /categories/[slug]: title, description, book count, grid
- [ ] /about, /contact (submit → appears in DB `contact_submissions`), /privacy, /terms
- [ ] 404 page: "This page has been shelved." + Return Home
- [ ] Mobile: hamburger menu, horizontal category scroll, 2-col book grid, no layout breakage
- [ ] Book page SEO: title/meta/OG/canonical present; JSON-LD Book schema valid

## 3. Book request flow
- [ ] Visitor on book page → "Login to Get Access" → /login?next=/books/<slug>
- [ ] Logged-in, no request → "Get This Book" → toast: "Your request has been received. Access will be activated after payment verification." → button becomes "Request Pending"
- [ ] Refresh → still "Request Pending" (no duplicate pending — second POST returns 409)
- [ ] Admin approves → user sees "Read Now"; book appears in /library
- [ ] Admin rejects → user sees "Request Again"; re-request works
- [ ] No payment UI exists anywhere on the site

## 4. Library & downloads
- [ ] /library shows only approved books: cover, title, author, progress %, last opened, Read Now, Download PDF (only when a PDF was uploaded)
- [ ] Download PDF → file downloads; rename check
- [ ] Direct-guess test: open a signed PDF URL after expiry / as logged-out user → access denied

## 5. EPUB reader
- [ ] Generate: `npm run make-sample-epub`; admin uploads it to a book; test user gets approved
- [ ] /read/[id] opens, renders real EPUB pages (not a download link)
- [ ] Prev/next buttons, ←/→ keyboard, TOC drawer jumps to chapters
- [ ] Font size, reading width, Light/Dark/Sepia themes, fullscreen
- [ ] Progress % updates in top bar; reload → resumes at saved location ("Continue Reading" from dashboard/library)
- [ ] No-access user (or logged out) hitting /read/[id] → blocked (403-style message), no file URL leaks

## 6. Profile
- [ ] Edit name → persists; avatar upload → visible in header; change password → login with new password works
- [ ] Membership badge shows FREE or PRO correctly

## 7. Admin panel
- [ ] Non-admin visiting /admin → redirected to /
- [ ] Dashboard cards: Total Books, Total Users, PRO Users, Categories, Pending/Approved Requests; Recent Users; Recent Requests
- [ ] Books: create → appears in catalog (if published); edit; publish/unpublish hides/shows publicly; feature/unfeature; delete (confirm dialog)
- [ ] Uploads: cover (JPG/PNG/WebP) shows on site; EPUB uploads; PDF uploads; progress bar; replace; error on wrong file type; size limits enforced
- [ ] Categories: add → appears on homepage strip automatically; edit slug; delete blocked when books linked
- [ ] Users: search; view detail (library + request history + progress); Upgrade to PRO / Remove PRO → badge updates for the user
- [ ] Purchase Requests: filters All/Pending/Approved/Rejected; search by user/email/book; Approve → one click: request approved + book_access created + book in user's library; Reject → status set
- [ ] Reading Analytics: per-book readers, avg progress, completed counts
- [ ] Settings: site name/tagline/contact email save
- [ ] Admin responsive: sidebar collapses on mobile

## 8. Security spot-checks
- [ ] `book-epubs` / `book-pdfs` buckets are private (no public read policy)
- [ ] Logged-in non-owner cannot read another user's requests/library/progress (try direct API calls)
- [ ] PATCH /api/profile cannot change role or membership (attempt → unchanged)
- [ ] No service-role key, private URLs, or secrets in client bundles / git history
- [ ] `.env.local` not committed

## 9. Performance / polish
- [ ] Images lazy-load; pages feel fast; skeletons appear instead of blank screens
- [ ] No console errors on homepage, book page, reader, admin dashboard
- [ ] Reduced-motion: with OS "reduce motion" on, no drift/parallax animations
