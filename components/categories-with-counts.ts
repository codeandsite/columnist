import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export interface CategoryWithCount extends Category {
  bookCount: number;
}

/** All categories (oldest first) with the number of published books in each. */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = createClient();
  const { data: cats } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });
  const categories = (cats ?? []) as Category[];
  if (categories.length === 0) return [];

  const { data: rows } = await supabase
    .from("book_categories")
    .select("category_id, book:books!inner(published)")
    .eq("book.published", true);
  const counts = new Map<string, number>();
  for (const row of (rows ?? []) as Array<{ category_id: string }>) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }
  return categories.map((c) => ({ ...c, bookCount: counts.get(c.id) ?? 0 }));
}
