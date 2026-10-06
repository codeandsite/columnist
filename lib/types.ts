export type Membership = "free" | "pro";
export type Role = "user" | "admin";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: Role;
  membership: Membership;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  author: string;
  short_description: string | null;
  description: string | null;
  price: number;
  cover_path: string | null;
  epub_path: string | null;
  pdf_path: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  /** joined */
  categories?: Category[];
  /** joined */
  book_categories?: { category: Category }[];
}

export interface PurchaseRequest {
  id: string;
  user_id: string;
  book_id: string;
  status: RequestStatus;
  requested_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  /** joined */
  book?: Book;
  /** joined */
  profile?: Profile;
}

export interface BookAccess {
  id: string;
  user_id: string;
  book_id: string;
  granted_by: string | null;
  granted_at: string;
  status: string;
  book?: Book;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  location: string | null;
  progress: number;
  last_opened: string;
  updated_at: string;
  book?: Book;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}

/** Access state of the current user for a given book (book detail page). */
export type BookAccessState =
  | "visitor" // not logged in
  | "none" // logged in, no request
  | "pending"
  | "approved"
  | "rejected";
