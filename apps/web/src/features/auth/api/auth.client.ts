"use client";

const authApiBase = "/api/backend/auth";

export function loginAccount(payload: { email: string; password: string }) {
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
  return request(`${authApiBase}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function loginWithGoogle(payload: {
  idToken: string;
  referralCode?: string;
}) {
  return request(`${authApiBase}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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

async function request(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  if (!response.ok) throw new Error(await readApiError(response));
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
