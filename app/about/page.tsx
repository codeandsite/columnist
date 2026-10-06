import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Columnist is a curated digital library for curious minds — our mission, our curation philosophy, and how access works.",
};

const SECTIONS = [
  {
    eyebrow: "Our Mission",
    heading: "Ideas deserve better shelves.",
    body: [
      "The internet is full of books, but starved of judgment. Anyone can publish; few curate. Columnist exists to do the slower, harder work — reading widely, choosing carefully, and presenting a library where every title has earned its place.",
      "We believe a small shelf of the right books beats an endless feed of the wrong ones. Our mission is to make meaningful books, knowledge and perspectives easier to discover and read, one curated title at a time.",
    ],
  },
  {
    eyebrow: "Curation Philosophy",
    heading: "Chosen, not collected.",
    body: [
      "Every book on Columnist passes a simple test: would we press it into the hands of a friend and say, “read this, it will change how you think”? If the answer is not an immediate yes, it does not make the shelf.",
      "We favour books with lasting ideas over passing trends — the kind you return to, underline, and quote years later. History, philosophy, science, literature and the examined life: these are our shelves, and we keep them deliberately short.",
    ],
  },
  {
    eyebrow: "How Access Works",
    heading: "Request. Verify. Read.",
    body: [
      "Columnist is a request-based library. When you find a book you want, you request access to it. Our team verifies your request and payment manually — usually within a day — and then the book is added to your personal library.",
      "Once approved, you can read online in our reader or download the PDF to keep. No subscriptions, no noise: you pay for the books you actually want, and they stay yours.",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
      <Reveal className="max-w-3xl">
        <p className="label-eyebrow">About Columnist</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-cream sm:text-6xl">
          A Library for
          <br />
          <span className="italic text-gold">Curious Minds.</span>
        </h1>
        <p className="mt-6 font-sans text-base leading-relaxed text-sand">
          Columnist is a premium digital library of carefully curated eBooks —
          built for thinkers, dreamers, learners, and anyone who still believes
          a book can change a life.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2 lg:mt-20">
        {SECTIONS.map((s, i) => (
          <Reveal key={s.eyebrow} delay={i % 2 === 1 ? 120 : 0}>
            <section className="border-t border-gold/15 pt-8">
              <p className="label-eyebrow !text-gold">{s.eyebrow}</p>
              <h2 className="mt-4 font-serif text-3xl text-cream">{s.heading}</h2>
              {s.body.map((p, j) => (
                <p
                  key={j}
                  className="mt-5 font-sans text-[15px] leading-relaxed text-cream/75"
                >
                  {p}
                </p>
              ))}
            </section>
          </Reveal>
        ))}

        <Reveal delay={120}>
          <section className="card-dark flex h-full flex-col justify-between p-8">
            <div>
              <p className="label-eyebrow !text-gold">Start Reading</p>
              <h2 className="mt-4 font-serif text-3xl text-cream">
                Your next great book is one request away.
              </h2>
              <p className="mt-5 font-sans text-[15px] leading-relaxed text-cream/75">
                Browse the shelves, request the titles that speak to you, and
                begin building a library worth keeping.
              </p>
            </div>
            <div className="mt-8">
              <Link href="/books" className="btn-crimson">
                Browse Books <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
