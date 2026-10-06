import type { Metadata } from "next";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Columnist collects, uses and protects your personal information.",
};

const SECTIONS = [
  {
    heading: "Information we collect",
    body: "When you create an account we collect your name and email address. When you request a book we record the request and its status. We do not collect payment card details on this site — payments are handled through separate, verified channels and we only record confirmation of payment.",
  },
  {
    heading: "How we use it",
    body: "Your information is used to operate your account and library: granting access to books you have requested, remembering your reading progress, and responding to messages you send us. We do not sell your data, and we do not use it for advertising.",
  },
  {
    heading: "Cookies and sessions",
    body: "We use a small number of essential cookies to keep you signed in and to remember your preferences. There are no third-party advertising trackers on Columnist.",
  },
  {
    heading: "Data security",
    body: "Access to personal data is limited to the people who operate the service, and our database enforces row-level security so that your library and requests are visible only to you. No system is perfectly secure, but we treat your information with the care it deserves.",
  },
  {
    heading: "Your rights",
    body: "You may ask for a copy of the data we hold about you, ask us to correct it, or ask us to delete your account and its data. Contact us through the contact page and we will act on your request.",
  },
  {
    heading: "Changes",
    body: "If this policy changes in a meaningful way, we will note the change here and update the date below. Continued use of Columnist after a change means you accept the updated policy.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
      <Reveal>
        <p className="label-eyebrow">Legal</p>
        <h1 className="mt-4 font-serif text-4xl text-cream sm:text-5xl">Privacy Policy</h1>
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
