import type { Metadata } from "next";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of the Columnist library.",
};

const SECTIONS = [
  {
    heading: "Your account",
    body: "You must provide a valid email address to create an account, and you are responsible for keeping your sign-in credentials private. Accounts are for personal use; sharing your access with others is not permitted.",
  },
  {
    heading: "Book requests and access",
    body: "Access to books is granted per request after manual verification, including payment confirmation where a price applies. Columnist may decline a request at its discretion, for example where verification cannot be completed. Once granted, access to a book is personal to your account.",
  },
  {
    heading: "Your library",
    body: "Approved books appear in your personal library. You may read them online in our reader and, where offered, download the PDF for personal, non-commercial use. Redistribution, resale or public sharing of book files is strictly prohibited.",
  },
  {
    heading: "Content",
    body: "Books are provided as-is. We curate with care, but we make no warranty about the accuracy or completeness of any title's contents. Cover art, descriptions and metadata are the property of their respective owners.",
  },
  {
    heading: "Acceptable use",
    body: "You agree not to misuse the service — no attempts to access other users' libraries, no automated scraping of the catalogue, and no activity that disrupts the platform. We may suspend accounts that violate these terms.",
  },
  {
    heading: "Changes and contact",
    body: "We may update these terms as the service evolves; the current version is always the one published on this page. If you have questions about these terms, write to us through the contact page.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
      <Reveal>
        <p className="label-eyebrow">Legal</p>
        <h1 className="mt-4 font-serif text-4xl text-cream sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 font-sans text-sm text-clay">Last updated: October 2026</p>
      </Reveal>
      <div className="mt-10 space-y-10">
        {SECTIONS.map((s, i) => (
          <Reveal key={s.heading} delay={Math.min(i * 60, 240)}>
            <section className="border-t border-gold/15 pt-7">
              <h2 className="font-serif text-2xl text-cream">{s.heading}</h2>
              <p className="mt-4 font-sans text-[15px] leading-relaxed text-cream/75">
                {s.body}
              </p>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
