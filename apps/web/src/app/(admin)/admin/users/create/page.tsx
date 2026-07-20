import { redirect } from "next/navigation";

import { getUsersAccessOptions } from "@/features/admin-users/api/users.server";
import { UserEditor } from "@/features/admin-users/components/user-editor";
import { requireAdmin } from "@/lib/auth/guards";

export default async function CreateAdminUserPage() {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("users.create")) {
    redirect("/admin/users");
  }
  const accessOptions = await getUsersAccessOptions();

  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <UserEditor user={null} accessOptions={accessOptions} />
    </main>
  );
}
