import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NestFactory } from "@nestjs/core";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { after, before } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import type { PrismaService } from "../../src/database/prisma/prisma.service";

type JwtBody = {
  sub: number;
  sid: string;
  rot?: number;
  email?: string;
  role?: string;
  type: "access" | "refresh";
  exp?: number;
  iat?: number;
};

export type AuthResponse = {
  accessToken: string;
  accessTokenExpiresAt: number;
  user: Record<string, unknown>;
};

const testDatabaseName = `auth-test-${process.pid}.db`;
const testDatabasePath = join(process.cwd(), "prisma", testDatabaseName);
const adminMediaTestPath = join(
  process.cwd(),
  "uploads",
  `admin-media-test-${process.pid}`,
);
const memberFilesTestPath = join(
  process.cwd(),
  "uploads",
  `member-files-test-${process.pid}`,
);
process.env.DATABASE_URL = `file:./${testDatabaseName}`;
process.env.ADMIN_MEDIA_UPLOAD_DIR = adminMediaTestPath;
process.env.MEMBER_FILES_UPLOAD_DIR = memberFilesTestPath;
process.env.JWT_ACCESS_SECRET =
  "test-access-secret-that-is-longer-than-thirty-two-characters";
process.env.JWT_REFRESH_SECRET =
  "test-refresh-secret-that-is-different-and-long-enough";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";
process.env.PASSWORD_RESET_URL = "http://localhost:3000/reset-password";
process.env.AUTH_COOKIE_SECURE = "false";
process.env.AUTH_COOKIE_SAME_SITE = "lax";
process.env.AUTH_GOOGLE_ID = "test-google-client.apps.googleusercontent.com";
process.env.QUEUE_ENABLED = "false";
process.env.VISIT_AGGREGATION_DISABLED = "true";

export let app!: INestApplication;
let baseUrl!: string;
export let prisma!: PrismaService;
export let jwtService!: JwtService;
export let adminAccessToken = "";
let requestSequence = 0;
export let googleAuthService!: {
  googleClient: {
    verifyIdToken(options: {
      idToken: string;
      audience: string;
    }): Promise<{
      getPayload(): {
        sub: string;
        email: string;
        email_verified: boolean;
        name: string;
        picture: string;
      };
    }>;
  };
};
export const passwordResetMails: Array<{
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}> = [];
export const emailVerificationMails: Array<{
  to: string;
  verificationUrl: string;
  expiresInHours: number;
}> = [];

export function decodeJwt(token: string) {
  const body = token.split(".")[1];
  return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as JwtBody;
}

export function refreshCookie(response: Response) {
  return authCookie(response, "stu_refresh_token");
}

export function accessCookie(response: Response) {
  return authCookie(response, "stu_access_token");
}

function authCookie(response: Response, name: string) {
  const match = new RegExp(`${name}=([^;]+)`).exec(
    response.headers.get("set-cookie") || "",
  );
  assert.ok(match, `response must set the ${name} cookie`);
  return `${name}=${match[1]}`;
}

export async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("X-Forwarded-For")) {
    requestSequence += 1;
    headers.set(
      "X-Forwarded-For",
      `198.51.${Math.floor(requestSequence / 250)}.${(requestSequence % 250) + 1}`,
    );
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
}

export async function login() {
  return loginAs("auth@example.com", "Secure123");
}

export async function loginAs(email: string, password: string, forwardedFor?: string) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: forwardedFor ? { "X-Forwarded-For": forwardedFor } : undefined,
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const body = (await response.json()) as AuthResponse;
  return { response, body, cookie: refreshCookie(response) };
}

before(async () => {
  execFileSync(
    join(process.cwd(), "node_modules/.bin/prisma"),
    ["db", "push", "--skip-generate"],
    { env: { ...process.env, RUST_LOG: "info" } },
  );

  const [{ AppModule }, prismaModule, authModule, passwordResetMailerModule] = await Promise.all([
    import("../../src/app.module"),
    import("../../src/database/prisma/prisma.service"),
    import("../../src/modules/auth/auth.service"),
    import("../../src/modules/auth/password-reset-mailer.service"),
  ]);
  app = await NestFactory.create(AppModule, { logger: false });
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
  prisma = app.get(prismaModule.PrismaService);
  await prisma.businessSettings.upsert({
    where: { id: 1 },
    create: { id: 1, memberStorageQuotaBytes: 1024 * 1024 },
    update: { memberStorageQuotaBytes: 1024 * 1024 },
  });
  jwtService = app.get(JwtService);
  googleAuthService = app.get(authModule.AuthService) as unknown as typeof googleAuthService;
  const passwordResetMailer = app.get(
    passwordResetMailerModule.PasswordResetMailer,
  );
  passwordResetMailer.sendPasswordReset = async (input) => {
    passwordResetMails.push(input);
  };
  passwordResetMailer.sendEmailVerification = async (input) => {
    emailVerificationMails.push(input);
  };
});

after(async () => {
  await app?.close();
  rmSync(testDatabasePath, { force: true });
  rmSync(adminMediaTestPath, { force: true, recursive: true });
  rmSync(memberFilesTestPath, { force: true, recursive: true });
});


export function setAdminAccessToken(accessToken: string) {
  adminAccessToken = accessToken;
}
