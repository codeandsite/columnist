import { guardAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = {
  title: "Admin · Columnist",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const g = await guardAdmin();
  if (!g.ok) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-ink lg:flex-row">
      <AdminNav />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
