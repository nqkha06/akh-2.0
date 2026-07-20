import { notFound, redirect } from "next/navigation";

import { getAdminUser } from "@/features/admin-users/api/users.server";
import { UserDetails } from "@/features/admin-users/components/user-details";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("users.read")) {
    redirect("/admin");
  }
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const user = await getAdminUser(id);
  if (!user) notFound();

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <UserDetails user={user} />
    </main>
  );
}
