import Link from "next/link";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";
import { guardUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import EmptyState, { ReaderSkeleton } from "@/components/Skeletons";

export const dynamic = "force-dynamic";

const Reader = nextDynamic(() => import("@/components/Reader"), {
  ssr: false,
  loading: () => <ReaderSkeleton />,
});

export default async function ReadPage({ params }: { params: { bookId: string } }) {
  const g = await guardUser();
  if (!g.ok) redirect(`/login?next=/read/${params.bookId}`);
  const admin = createAdminClient();

  const { data: book } = await admin
    .from("books")
    .select("id,title,author,slug,epub_path,published")
    .eq("id", params.bookId)
    .maybeSingle();

  if (!book) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <EmptyState
          title="Book not found."
          message="The book you are looking for doesn't exist or was removed."
          action={
            <Link href="/library" className="btn-crimson">
              Back to Library
            </Link>
          }
        />
      </div>
    );
  }

  const { data: access } = await admin
    .from("book_access")
    .select("id")
    .eq("user_id", g.userId)
    .eq("book_id", params.bookId)
    .maybeSingle();
  if (!access && g.profile?.role !== "admin") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <EmptyState
          title="You don't have access to this book."
          message="Request access to this title, and it will appear here once approved."
          action={
            <Link href="/library" className="btn-crimson">
              Back to Library
            </Link>
          }
        />
      </div>
    );
  }

  if (!book.epub_path) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <EmptyState
          title="This book has no readable file yet."
          message="The digital edition of this title is still being prepared. Please check back soon."
          action={
            <Link href="/library" className="btn-crimson">
              Back to Library
            </Link>
          }
        />
      </div>
    );
  }

  const { data: progress } = await admin
    .from("reading_progress")
    .select("location,progress")
    .eq("user_id", g.userId)
    .eq("book_id", params.bookId)
    .maybeSingle();

  return (
    <Reader
      bookId={book.id}
      title={book.title}
      author={book.author ?? ""}
      savedCfi={progress?.location ?? null}
      savedProgress={progress?.progress ?? 0}
    />
  );
}
