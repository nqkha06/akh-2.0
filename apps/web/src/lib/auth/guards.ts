import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { AuthUser } from "@/features/auth/types";
import { readAuthError } from "@/lib/auth/auth-errors";
import { serverApiFetch } from "@/lib/auth/server-access";

type CurrentUserResult =
  | { user: AuthUser; message?: never }
  | { user: null; message: string };

const fetchCurrentUser = cache(async function fetchCurrentUser(
  callbackUrl: string,
): Promise<CurrentUserResult> {
  const response = await serverApiFetch(
    "/auth/me",
    { cache: "no-store" },
    callbackUrl,
  );
  if (!response.ok) {
    const error = await readAuthError(response);
    return { user: null, message: error.message };
  }
  return { user: (await response.json()) as AuthUser };
});

export async function requireMember(callbackUrl = "/member") {
  const currentUserResult = await fetchCurrentUser(callbackUrl);
  if (!currentUserResult.user) {
    throw new Error(currentUserResult.message);
  }
  return { currentUser: currentUserResult.user };
}

export async function requireAdmin() {
  const context = await requireMember("/admin");
  if (!context.currentUser.permissions.includes("admin.access")) {
    redirect("/member");
  }
  return context;
}
