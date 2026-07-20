import { notFound, redirect } from "next/navigation";

import {
  getAdminUser,
  getUsersAccessOptions,
} from "@/features/admin-users/api/users.server";
import { UserEditor } from "@/features/admin-users/components/user-editor";
import { requireAdmin } from "@/lib/auth/guards";

export default async function EditAdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("users.update")) {
    redirect("/admin/users");
  }
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const [user, accessOptions] = await Promise.all([
    getAdminUser(id),
    getUsersAccessOptions(),
  ]);
  if (!user) notFound();

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <UserEditor user={user} accessOptions={accessOptions} />
    </main>
  );
}
