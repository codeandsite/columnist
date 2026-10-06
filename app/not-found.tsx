import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="label-eyebrow">404</p>
      <h1 className="mt-5 font-serif text-4xl leading-tight text-cream sm:text-6xl">
        This page has been <span className="italic text-gold">shelved.</span>
      </h1>
      <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-sand">
        Looks like the page you&rsquo;re looking for isn&rsquo;t in our library.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-crimson">
          Return Home
        </Link>
        <Link href="/books" className="btn-outline">
          Browse Books
        </Link>
      </div>
    </div>
  );
}
