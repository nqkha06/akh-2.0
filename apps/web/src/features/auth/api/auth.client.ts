"use client";

const authApiBase = "/api/backend/auth";

export function loginAccount(payload: {
  email: string;
  password: string;
  rememberMe: boolean;
}) {
  return request(`${authApiBase}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function registerAccount(payload: {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}) {
  return requestJson<{ requiresEmailVerification: boolean }>(`${authApiBase}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(token: string) {
  return requestJson<{ message: string }>(`${authApiBase}/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function resendEmailVerification(email: string) {
  return requestJson<{ message: string }>(`${authApiBase}/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function loginWithGoogle(payload: {
  idToken: string;
  referralCode?: string;
  rememberMe: boolean;
}) {
  return request(`${authApiBase}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function requestPasswordReset(payload: { email: string }) {
  const response = await fetch(`${authApiBase}/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json() as Promise<{ message: string }>;
}

export async function resetPassword(payload: {
  token: string;
  password: string;
}) {
  const response = await fetch(`${authApiBase}/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json() as Promise<{ message: string }>;
}

export async function logoutAccount() {
  const response = await fetch(`${authApiBase}/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(await readApiError(response));
  }
}

export async function logoutAndRedirect(callbackUrl = "/login") {
  try {
    await logoutAccount();
  } finally {
    window.location.assign(callbackUrl);
  }
}

export async function stopImpersonatingAndRedirect() {
  const response = await fetch(`${authApiBase}/impersonation/stop`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error(await readApiError(response));
  window.location.assign("/admin");
}

async function request(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  if (!response.ok) throw new Error(await readApiError(response));
}

async function requestJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json() as Promise<T>;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
