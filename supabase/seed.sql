-- ═══════════════════════════════════════════════════════════════════
-- COLUMNIST · seed.sql
-- 12 categories + 5 featured, published books (typographic covers are
-- rendered by the <BookCover> component — no cover art files needed).
-- All descriptions are original blurbs written for Columnist.
-- ═══════════════════════════════════════════════════════════════════

-- ── Categories ──────────────────────────────────────────────────────
insert into public.categories (name, slug, description) values
  ('History', 'history', 'Explore books that bring the past into perspective — empires, revolutions and the people who shaped them.'),
  ('Philosophy', 'philosophy', 'Timeless questions, examined slowly. Stoicism, ethics and the art of thinking clearly.'),
  ('Education', 'education', 'Books that teach — sharp, structured and built to expand what you know.'),
  ('Science', 'science', 'From the cosmos to the cell: rigorous ideas, beautifully explained.'),
  ('Literature', 'literature', 'Great writing that endures — stories and essays worth returning to.'),
  ('Self Improvement', 'self-improvement', 'Small disciplines, compounded. Practical wisdom for a better-built life.'),
  ('Psychology', 'psychology', 'How minds work — decisions, habits, biases and the quiet machinery of behaviour.'),
  ('Business', 'business', 'Strategy, leadership and the craft of building things that last.'),
  ('Finance', 'finance', 'Money, markets and the psychology of wealth — explained without the noise.'),
  ('Technology', 'technology', 'The ideas reshaping the world, from first principles to the frontier.'),
  ('Biography', 'biography', 'Lives examined — the choices, failures and obsessions behind remarkable people.'),
  ('Fiction', 'fiction', 'Invented worlds, true feelings. Novels and stories that stay with you.')
on conflict (slug) do nothing;

-- ── Books ───────────────────────────────────────────────────────────
insert into public.books (title, slug, author, short_description, description, price, featured, published) values
  (
    'The Daily Stoic', 'the-daily-stoic', 'Ryan Holiday',
    '366 meditations on wisdom, perseverance, and the art of living — one for every day of the year.',
    'A year-long companion drawn from the great Stoic philosophers — Marcus Aurelius, Seneca and Epictetus. Each day offers a short meditation on clarity, resilience and virtue, translated into practical guidance for modern life. Read a page each morning; carry it with you all day.',
    1499, true, true
  ),
  (
    'Think Like a Roman', 'think-like-a-roman', 'Donald Robertson',
    'A practical guide to Stoic philosophy as a way of life, from one of its clearest modern interpreters.',
    'Philosophy was never meant to stay on the shelf. This book reconstructs how the ancient Stoics actually thought — through exercises, reflections and lived practice — and shows how to apply that discipline to anxiety, anger and the pressures of contemporary life.',
    1299, true, true
  ),
  (
    'Atomic Habits', 'atomic-habits', 'James Clear',
    'Tiny changes, remarkable results — a proven framework for building good habits and breaking bad ones.',
    'You do not rise to the level of your goals; you fall to the level of your systems. Drawing on biology, psychology and neuroscience, this book lays out a practical system for compounding small improvements into extraordinary outcomes — in work, health and craft.',
    1499, true, true
  ),
  (
    'The Obstacle Is the Way', 'the-obstacle-is-the-way', 'Ryan Holiday',
    'Turn trials into triumph: the Stoic art of transforming obstacles into opportunities.',
    'Drawing on the philosophy of Marcus Aurelius, this book reframes adversity itself. With stories from history''s great figures, it presents a three-part discipline — perception, action and will — for converting setbacks into fuel.',
    1399, true, true
  ),
  (
    'The Psychology of Money', 'the-psychology-of-money', 'Morgan Housel',
    'Doing well with money has surprisingly little to do with how smart you are — and a lot to do with how you behave.',
    'Through nineteen short stories, this book explores the strange ways people think about wealth, greed and happiness. It argues that financial success is a soft skill — shaped by temperament, patience and humility — more than a hard science.',
    1499, true, true
  )
on conflict (slug) do nothing;

-- ── Link books to categories ─────────────────────────────────────────
insert into public.book_categories (book_id, category_id)
select b.id, c.id from public.books b, public.categories c
where (b.slug, c.slug) in (
  ('the-daily-stoic', 'philosophy'),
  ('the-daily-stoic', 'self-improvement'),
  ('think-like-a-roman', 'philosophy'),
  ('atomic-habits', 'self-improvement'),
  ('atomic-habits', 'psychology'),
  ('the-obstacle-is-the-way', 'philosophy'),
  ('the-obstacle-is-the-way', 'business'),
  ('the-psychology-of-money', 'finance'),
  ('the-psychology-of-money', 'psychology')
)
on conflict do nothing;
