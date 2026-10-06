"use client";

import Link from "next/link";
import BookForm from "@/components/admin/BookForm";

export default function NewBookPage() {
  return (
    <div>
      <p className="label-eyebrow">
        <Link href="/admin/books" className="hover:text-gold">Books</Link>
        <span className="mx-2 text-clay">/</span> New
      </p>
      <h1 className="mt-3 font-serif text-4xl text-cream">Add a Book</h1>
      <div className="rule-gold mt-5" />
      <div className="mt-10">
        <BookForm />
      </div>
    </div>
  );
}
