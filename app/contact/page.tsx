"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useToast } from "@/components/Toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 201) {
        setSent(true);
      } else {
        toast(data.error ?? "Something went wrong. Please try again.", "error");
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
      <Reveal>
        <p className="label-eyebrow">Get in touch</p>
        <h1 className="mt-4 font-serif text-4xl text-cream sm:text-5xl">
          Contact <span className="italic text-gold">Us.</span>
        </h1>
        <p className="mt-4 font-sans text-base leading-relaxed text-sand">
          Questions about a book, a request, or the library itself — write to
          us. We read every message.
        </p>
      </Reveal>

      <Reveal delay={120} className="mt-10">
        {sent ? (
          <div className="card-dark border-gold/40 p-10 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/50">
              <span aria-hidden="true" className="font-serif text-2xl text-gold">
                ✓
              </span>
            </div>
            <h2 className="font-serif text-2xl text-cream">Message received.</h2>
            <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-sand">
              Thank you for writing to us. We will get back to you at{" "}
              <span className="text-cream">{email}</span> shortly.
            </p>
            <Link href="/" className="btn-outline mt-8">
              Return Home
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="card-dark space-y-6 p-8 sm:p-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className="label-eyebrow mb-3 block">
                  Name
                </label>
                <input
                  id="c-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="input-dark"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="c-email" className="label-eyebrow mb-3 block">
                  Email
                </label>
                <input
                  id="c-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-dark"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="c-subject" className="label-eyebrow mb-3 block">
                Subject
              </label>
              <input
                id="c-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What is this about?"
                className="input-dark"
              />
            </div>
            <div>
              <label htmlFor="c-message" className="label-eyebrow mb-3 block">
                Message
              </label>
              <textarea
                id="c-message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message…"
                className="input-dark resize-y"
              />
            </div>
            <button type="submit" disabled={sending} className="btn-crimson w-full sm:w-auto">
              {sending ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </Reveal>
    </div>
  );
}
