import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role: (session.user as { role?: string }).role ?? "user",
  };

  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <MobileNav user={user} />

      {/* Main content — offset by sidebar on desktop, by top/bottom nav on mobile */}
      <main className="lg:pl-[220px]">
        <div className="mx-auto max-w-6xl px-4 py-6 pt-20 pb-20 sm:px-6 lg:px-8 lg:pt-6 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
