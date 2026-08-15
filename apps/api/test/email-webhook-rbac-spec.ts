/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PERMISSIONS_KEY } from "../src/modules/auth/decorators/permissions.decorator";
import { EmailActivityController } from "../src/modules/emails/email-activity.controller";
import { EmailPreferencesController } from "../src/modules/emails/email-preferences.controller";
import { EmailSendersController } from "../src/modules/emails/email-senders.controller";
import { EmailSettingsController } from "../src/modules/emails/email-settings.controller";
import { EmailTemplatesController } from "../src/modules/emails/email-templates.controller";
import { SesWebhookService } from "../src/modules/emails/webhook/ses-webhook.service";
import { SnsSignatureVerifier, type SnsEnvelope } from "../src/modules/emails/webhook/sns-signature-verifier";

function permission(controller: object, method: string) {
  const handler = (controller as Record<string, unknown>)[method];
  return Reflect.getMetadata(PERMISSIONS_KEY, handler as object) as string[];
}

describe("Email endpoint RBAC and SES webhook", () => {
  it("assigns permission metadata to every admin endpoint group", () => {
    const settings = new EmailSettingsController({} as never);
    const senders = new EmailSendersController({} as never);
    const templates = new EmailTemplatesController({} as never);
    const preferences = new EmailPreferencesController({} as never);
    const activity = new EmailActivityController({} as never);
    assert.deepEqual(permission(settings, "get"), ["emails.read"]);
    assert.deepEqual(permission(settings, "update"), ["emails.settings.update"]);
    assert.deepEqual(permission(settings, "checkConnection"), ["emails.settings.update"]);
    for (const method of ["create", "update", "checkVerification", "setDefault", "remove"]) {
      assert.deepEqual(permission(senders, method), ["emails.senders.manage"]);
    }
    assert.deepEqual(permission(templates, "list"), ["emails.templates.read"]);
    assert.deepEqual(permission(templates, "create"), ["emails.templates.create"]);
    assert.deepEqual(permission(templates, "update"), ["emails.templates.update"]);
    assert.deepEqual(permission(templates, "archive"), ["emails.templates.delete"]);
    assert.deepEqual(permission(templates, "testSend"), ["emails.test.send"]);
    assert.deepEqual(permission(preferences, "create"), ["emails.preferences.manage"]);
    assert.deepEqual(permission(activity, "list"), ["emails.logs.read"]);
    assert.deepEqual(permission(activity, "overview"), ["emails.read"]);
  });

  it("accepts a valid SNS signature and rejects a tampered message", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const verifier = new SnsSignatureVerifier(new ConfigService({}));
    const envelope: SnsEnvelope = {
      Type: "Notification",
      MessageId: "evt-1",
      TopicArn: "arn:aws:sns:ap-southeast-1:123456789012:ses-events",
      Message: "{\"notificationType\":\"Delivery\"}",
      Timestamp: new Date().toISOString(),
      SignatureVersion: "2",
      Signature: "",
      SigningCertURL: "https://sns.ap-southeast-1.amazonaws.com/SimpleNotificationService-test.pem",
    };
    const internals = verifier as unknown as {
      canonicalString(value: SnsEnvelope): string;
      certificate(url: string): Promise<string>;
    };
    internals.certificate = async () => publicKey.export({ type: "spki", format: "pem" }).toString();
    const signer = createSign("RSA-SHA256");
    signer.update(internals.canonicalString(envelope), "utf8");
    signer.end();
    envelope.Signature = signer.sign(privateKey, "base64");
    await assert.doesNotReject(() => verifier.verify(envelope));
    await assert.rejects(
      () => verifier.verify({ ...envelope, Message: "tampered" }),
      BadRequestException,
    );
  });

  for (const kind of ["hard bounce", "complaint"] as const) {
    it(`stores an idempotent event and suppression for ${kind}`, async () => {
      let existing: { id: number } | null = null;
      let suppressionReason = "";
      const transaction = {
        emailMessageEvent: { create: async () => { existing = { id: 51 }; return existing; } },
        emailMessage: { update: async () => ({}) },
        emailSuppression: { upsert: async ({ create }: { create: { reason: string } }) => { suppressionReason = create.reason; return {}; } },
      };
      const prisma = {
        emailMessage: { findFirst: async () => ({ id: "message-1", status: "sent", recipientEmail: "user@example.com" }) },
        emailMessageEvent: { findUnique: async () => existing },
        $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction),
      };
      const service = new SesWebhookService(
        prisma as never,
        { verify: async () => true } as never,
      );
      const notification = kind === "complaint"
        ? { notificationType: "Complaint", mail: { messageId: "provider-1" }, complaint: { complainedRecipients: [{ emailAddress: "USER@example.com" }] } }
        : { notificationType: "Bounce", mail: { messageId: "provider-1" }, bounce: { bounceType: "Permanent", bouncedRecipients: [{ emailAddress: "USER@example.com", diagnosticCode: "550" }] } };
      const envelope = {
        Type: "Notification",
        MessageId: `event-${kind}`,
        Message: JSON.stringify(notification),
      };
      const first = await service.handle(envelope);
      const second = await service.handle(envelope);
      assert.equal(first.matched, true);
      assert.equal(second.duplicate, true);
      assert.equal(suppressionReason, kind === "complaint" ? "complaint" : "hard_bounce");
    });
  }
});
