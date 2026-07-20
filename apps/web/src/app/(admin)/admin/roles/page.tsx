import { getAuthorizationData } from "@/features/admin-authorization/api/authorization.server";
import { AuthorizationManager } from "@/features/admin-authorization/components/authorization-manager";

export default async function AdminRolesPage() {
  const data = await getAuthorizationData();

  return (
    <main className="flex flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <AuthorizationManager {...data} />
    </main>
  );
}
