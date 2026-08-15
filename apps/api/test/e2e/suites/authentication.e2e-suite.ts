import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AuthResponse } from "../e2e-harness";
import {
  accessCookie,
  decodeJwt,
  emailVerificationMails,
  googleAuthService,
  jwtService,
  login,
  loginAs,
  passwordResetMails,
  prisma,
  refreshCookie,
  request,
} from "../e2e-harness";

describe("Authentication E2E", () => {
  it("registers an account without returning sensitive fields", async () => {
    const response = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Auth Test",
        email: "auth@example.com",
        password: "Secure123",
      }),
    });
    assert.equal(response.status, 201);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.email, "auth@example.com");
    assert.equal("passwordHash" in body, false);
    assert.equal("refreshTokenHash" in body, false);
  });

  it("rejects duplicate registration", async () => {
    const response = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate",
        email: "AUTH@example.com",
        password: "Secure123",
      }),
    });
    assert.equal(response.status, 409);
  });

  it("requires a one-time email verification when the business policy is enabled", async () => {
    await prisma.businessSettings.update({
      where: { id: 1 },
      data: { emailVerificationRequired: true },
    });
    const email = `verify-${process.pid}@example.com`;
    try {
      const registered = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: "Verify Email", email, password: "Secure123" }),
      });
      assert.equal(registered.status, 201);
      assert.equal(
        ((await registered.json()) as { requiresEmailVerification: boolean })
          .requiresEmailVerification,
        true,
      );
      assert.equal((await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "Secure123" }),
      })).status, 403);

      const mail = emailVerificationMails[emailVerificationMails.length - 1];
      assert.equal(mail?.to, email);
      const token = new URL(mail!.verificationUrl).searchParams.get("token");
      assert.ok(token);
      const verified = await request("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      assert.equal(verified.status, 200);
      assert.equal((await request("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      })).status, 400);
      assert.equal((await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: "Secure123" }),
      })).status, 200);
    } finally {
      await prisma.businessSettings.update({
        where: { id: 1 },
        data: { emailVerificationRequired: false },
      });
    }
  });

  it("resets a password with a hashed one-time token and revokes existing sessions", async () => {
    const email = "password-reset@example.com";
    const oldPassword = "OldSecure123";
    const newPassword = "NewSecure456";
    const registered = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Password Reset", email, password: oldPassword }),
    });
    assert.equal(registered.status, 201);

    const unknown = await request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "missing-reset@example.com" }),
    });
    const requested = await request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    assert.equal(unknown.status, 200);
    assert.equal(requested.status, 200);
    assert.deepEqual(await unknown.json(), await requested.json());
    const firstMail = passwordResetMails[passwordResetMails.length - 1];
    assert.ok(firstMail);
    assert.equal(firstMail.to, email);
    assert.equal(firstMail.expiresInMinutes, 30);

    const firstToken = new URL(firstMail.resetUrl).searchParams.get(
      "token",
    );
    assert.ok(firstToken);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const storedToken = await prisma.passwordResetToken.findFirstOrThrow({
      where: { userId: user.id, usedAt: null },
    });
    assert.notEqual(storedToken.tokenHash, firstToken);
    assert.ok(storedToken.requestedIp);

    await prisma.passwordResetToken.update({
      where: { id: storedToken.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    const expired = await request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: firstToken, password: newPassword }),
    });
    assert.equal(expired.status, 400);

    passwordResetMails.length = 0;
    await request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    const latestMail = passwordResetMails[passwordResetMails.length - 1];
    assert.ok(latestMail);
    const token = new URL(latestMail.resetUrl).searchParams.get("token");
    assert.ok(token);

    const existingSession = await loginAs(email, oldPassword);
    const reset = await request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password: newPassword }),
    });
    assert.equal(reset.status, 200);

    const reused = await request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password: "AnotherSecure789" }),
    });
    assert.equal(reused.status, 400);

    const revokedSession = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${existingSession.body.accessToken}` },
    });
    assert.equal(revokedSession.status, 401);
    const oldLogin = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: oldPassword }),
    });
    assert.equal(oldLogin.status, 401);
    const newLogin = await loginAs(email, newPassword);
    assert.equal(newLogin.response.status, 200);
  });

  it("changes an authenticated password and revokes every other session", async () => {
    const email = `change-password-${process.pid}@example.com`;
    const currentPassword = "CurrentSecure123";
    const newPassword = "UpdatedSecure456";
    const registered = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Change Password",
        email,
        password: currentPassword,
      }),
    });
    assert.equal(registered.status, 201);

    const currentSession = await loginAs(email, currentPassword);
    const otherSession = await loginAs(email, currentPassword);
    const authorization = {
      Authorization: `Bearer ${currentSession.body.accessToken}`,
    };

    assert.equal(
      (
        await request("/api/auth/change-password", {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/auth/change-password", {
          method: "POST",
          headers: authorization,
          body: JSON.stringify({
            currentPassword,
            newPassword: "weak-password",
          }),
        })
      ).status,
      400,
    );

    const incorrect = await request("/api/auth/change-password", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        currentPassword: "IncorrectSecure123",
        newPassword,
      }),
    });
    assert.equal(incorrect.status, 400);
    assert.equal(
      ((await incorrect.json()) as { code: string }).code,
      "CURRENT_PASSWORD_INCORRECT",
    );

    const unchanged = await request("/api/auth/change-password", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        currentPassword,
        newPassword: currentPassword,
      }),
    });
    assert.equal(unchanged.status, 400);
    assert.equal(
      ((await unchanged.json()) as { code: string }).code,
      "NEW_PASSWORD_SAME_AS_CURRENT",
    );

    const changed = await request("/api/auth/change-password", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    assert.equal(changed.status, 200, await changed.clone().text());
    assert.equal(
      ((await changed.json()) as { message: string }).message,
      "Mật khẩu đã được cập nhật.",
    );

    assert.equal(
      (
        await request("/api/auth/me", {
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${otherSession.body.accessToken}`,
          },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/auth/refresh", {
          method: "POST",
          headers: { Cookie: otherSession.cookie },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password: currentPassword }),
        })
      ).status,
      401,
    );
    assert.equal((await loginAs(email, newPassword)).response.status, 200);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        actorUserId: user.id,
        action: "auth.password_changed",
      },
    });
    assert.ok(auditLog);
    assert.doesNotMatch(JSON.stringify(auditLog), /CurrentSecure|UpdatedSecure/);
  });

  it("logs in with the correct password and rejects a wrong password", async () => {
    const valid = await login();
    assert.ok(valid.body.accessToken);
    assert.ok(valid.body.accessTokenExpiresAt > Date.now());
    assert.equal("passwordHash" in valid.body.user, false);
    const setCookie = valid.response.headers.get("set-cookie") || "";
    assert.match(setCookie, /stu_access_token=[^;]+/);
    assert.match(setCookie, /stu_refresh_token=[^;]+/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Path=\//i);
    assert.doesNotMatch(setCookie, /Max-Age=/i);

    const invalid = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "auth@example.com", password: "Wrong123" }),
    });
    assert.equal(invalid.status, 401);
    const body = (await invalid.json()) as { message: string };
    assert.equal(body.message, "Email hoặc mật khẩu không chính xác.");
  });

  it("persists cookies only when remember me is selected", async () => {
    const remembered = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "auth@example.com",
        password: "Secure123",
        rememberMe: true,
      }),
    });
    assert.equal(remembered.status, 200);
    const loginCookies = remembered.headers.get("set-cookie") || "";
    assert.match(loginCookies, /Max-Age=900/i);
    assert.match(loginCookies, /Max-Age=604800/i);

    const refreshed = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: refreshCookie(remembered) },
    });
    assert.equal(refreshed.status, 200);
    const refreshedCookies = refreshed.headers.get("set-cookie") || "";
    assert.match(refreshedCookies, /Max-Age=900/i);
    assert.match(refreshedCookies, /Max-Age=604800/i);
  });

  it("signs in with a verified Google ID token and records the auth method", async () => {
    const originalVerifyIdToken = googleAuthService.googleClient.verifyIdToken;
    googleAuthService.googleClient.verifyIdToken = async ({
      idToken,
      audience,
    }) => {
      assert.equal(idToken, "test-google-id-token-1234567890");
      assert.equal(audience, process.env.AUTH_GOOGLE_ID);
      return {
        getPayload: () => ({
          sub: "google-account-123",
          email: "google-auth@example.com",
          email_verified: true,
          name: "Google Auth Test",
          picture: "https://example.com/avatar.png",
        }),
      };
    };

    try {
      const response = await request("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({
          idToken: "test-google-id-token-1234567890",
          rememberMe: true,
        }),
      });
      assert.equal(response.status, 200, await response.clone().text());
      assert.match(response.headers.get("set-cookie") || "", /Max-Age=604800/i);
      const body = (await response.json()) as AuthResponse;
      assert.equal(body.user.email, "google-auth@example.com");

      const user = await prisma.user.findUniqueOrThrow({
        where: { email: "google-auth@example.com" },
        include: { socialAccounts: true, authSessions: true },
      });
      assert.equal(user.emailVerifiedAt instanceof Date, true);
      assert.equal(user.socialAccounts[0]?.provider, "google");
      assert.equal(user.authSessions[0]?.authMethod, "google");
    } finally {
      googleAuthService.googleClient.verifyIdToken = originalVerifyIdToken;
    }
  });

  it("blocks a locked account", async () => {
    await prisma.user.update({
      where: { email: "auth@example.com" },
      data: { status: "locked" },
    });
    const response = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "auth@example.com",
        password: "Secure123",
      }),
    });
    assert.equal(response.status, 401);
    await prisma.user.update({
      where: { email: "auth@example.com" },
      data: { status: "active" },
    });
  });

  it("accepts access tokens from bearer headers and HttpOnly cookies", async () => {
    const current = await login();
    const me = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${current.body.accessToken}` },
    });
    assert.equal(me.status, 200);
    const user = (await me.json()) as Record<string, unknown>;
    assert.equal("passwordHash" in user, false);
    assert.equal(
      (
        await request("/api/auth/me", {
          headers: { Cookie: accessCookie(current.response) },
        })
      ).status,
      200,
    );
    assert.equal((await request("/api/auth/me")).status, 401);

    const payload = decodeJwt(current.body.accessToken);
    delete payload.exp;
    delete payload.iat;
    const expired = await jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: -1,
    });
    const expiredResponse = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${expired}` },
    });
    assert.equal(expiredResponse.status, 401);
    assert.equal(
      ((await expiredResponse.json()) as { code: string }).code,
      "ACCESS_TOKEN_EXPIRED",
    );
  });

  it("rotates a refresh token exactly once", async () => {
    const current = await login();
    const payload = decodeJwt(current.cookie.split("=")[1]);
    const refreshed = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(refreshed.status, 200);
    const rotatedCookie = refreshCookie(refreshed);
    assert.notEqual(rotatedCookie, current.cookie);

    const session = await prisma.authSession.findUniqueOrThrow({
      where: { id: payload.sid },
    });
    assert.equal(session.rotationCounter, 1);
    assert.equal(session.revokedAt, null);
  });

  it("accepts only one of 20 concurrent refresh requests", async () => {
    const current = await login();
    const payload = decodeJwt(current.cookie.split("=")[1]);
    const responses = await Promise.all(
      Array.from({ length: 20 }, () =>
        request("/api/auth/refresh", {
          method: "POST",
          headers: { Cookie: current.cookie },
        }),
      ),
    );

    assert.equal(
      responses.filter((response) => response.status === 200).length,
      1,
    );
    assert.equal(
      responses.filter((response) => response.status === 401).length,
      19,
    );

    const session = await prisma.authSession.findUniqueOrThrow({
      where: { id: payload.sid },
    });
    assert.equal(session.rotationCounter, 1);
    assert.ok(session.revokedAt);
  });

  it("immediately treats a rotated token as reuse and revokes the session", async () => {
    const current = await login();
    const first = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(first.status, 200);
    const rotatedCookie = refreshCookie(first);
    const payload = decodeJwt(current.cookie.split("=")[1]);

    const reuse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(reuse.status, 401);
    assert.equal(
      ((await reuse.json()) as { code: string }).code,
      "REFRESH_TOKEN_REUSE_DETECTED",
    );

    const session = await prisma.authSession.findUniqueOrThrow({
      where: { id: payload.sid },
    });
    assert.equal(session.rotationCounter, 1);
    assert.ok(session.revokedAt);

    const rotatedAfterReuse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: rotatedCookie },
    });
    assert.equal(rotatedAfterReuse.status, 401);
    assert.equal(
      ((await rotatedAfterReuse.json()) as { code: string }).code,
      "SESSION_REVOKED",
    );
  });

  it("rejects expired, malformed and revoked refresh tokens", async () => {
    const current = await login();
    const payload = decodeJwt(current.cookie.split("=")[1]);
    delete payload.exp;
    delete payload.iat;
    const expired = await jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: -1,
    });
    const expiredResponse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: `stu_refresh_token=${expired}` },
    });
    assert.equal(expiredResponse.status, 401);
    assert.equal(
      ((await expiredResponse.json()) as { code: string }).code,
      "REFRESH_TOKEN_EXPIRED",
    );

    const malformedResponse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: "stu_refresh_token=not-a-jwt" },
    });
    assert.equal(malformedResponse.status, 401);
    assert.equal(
      ((await malformedResponse.json()) as { code: string }).code,
      "REFRESH_TOKEN_INVALID",
    );

    await prisma.authSession.update({
      where: { id: payload.sid },
      data: { revokedAt: new Date() },
    });
    const revokedResponse = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(revokedResponse.status, 401);
    assert.equal(
      ((await revokedResponse.json()) as { code: string }).code,
      "SESSION_REVOKED",
    );
  });

  it("logout is idempotent and invalidates the current session", async () => {
    const current = await login();
    const logoutResponse = await request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: current.cookie },
    });
    assert.equal(logoutResponse.status, 204);
    const clearedCookies = logoutResponse.headers.get("set-cookie") || "";
    assert.match(clearedCookies, /stu_access_token=;/);
    assert.match(clearedCookies, /stu_refresh_token=;/);
    assert.equal(
      (await request("/api/auth/logout", { method: "POST" })).status,
      204,
    );
    assert.equal(
      (
        await request("/api/auth/refresh", {
          method: "POST",
          headers: { Cookie: current.cookie },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/api/auth/me", {
          headers: { Authorization: `Bearer ${current.body.accessToken}` },
        })
      ).status,
      401,
    );
  });

});
