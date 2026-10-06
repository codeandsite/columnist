/** Build a public storage URL for a file in a public bucket. */
export function publicUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function coverUrl(path: string | null | undefined): string | null {
  return publicUrl("book-covers", path);
}

export function avatarUrl(path: string | null | undefined): string | null {
  return publicUrl("avatars", path);
}
