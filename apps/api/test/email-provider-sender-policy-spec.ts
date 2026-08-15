/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { EmailDeliveryService } from "../src/modules/emails/email-delivery.service";
import { EmailSendersService } from "../src/modules/emails/email-senders.service";
import { AmazonSesEmailProvider } from "../src/modules/emails/providers/amazon-ses-email.provider";

const context = { ipAddress: "127.0.0.1", userAgent: "node:test" };

describe("Email provider, delivery and sender invariants", () => {
  it("reports incomplete SES configuration without exposing credentials", async () => {
    const provider = new AmazonSesEmailProvider(
      new ConfigService({ AWS_REGION: "ap-southeast-1", AWS_ACCESS_KEY_ID: "visible-if-bug" }),
    );
    const health = await provider.checkConnection();
    assert.equal(health.status, "incomplete");
    const serialized = JSON.stringify(health);
    assert.doesNotMatch(serialized, /visible-if-bug|secret|accessKey/i);
  });

  it("blocks test sends before persistence when SES is not ready", async () => {
    const service = new EmailDeliveryService(
      {} as never,
      { runtime: async () => ({
        provider: "amazon_ses",
        transactionalEnabled: true,
        marketingEnabled: true,
        globalReplyToEmail: null,
      }) } as never,
      { get: () => ({ checkConnection: async () => ({ status: "incomplete", message: "AWS credentials chưa được cấu hình trên server." }) }) } as never,
      {} as never,
    );
    await assert.rejects(
      () => service.sendTemplateTest({
        template: {
          id: 1,
          code: "verify_email",
          category: "transactional",
          status: "active",
          subject: "Verify",
          htmlContent: "<p>Verify</p>",
          textContent: "Verify",
          variables: [],
          version: 1,
          senderId: null,
        },
        recipientEmail: "qa@example.com",
        actorUserId: 1,
        context,
      }),
      BadRequestException,
    );
  });

  it("rejects an unverified default sender and protects the current default", async () => {
    const pendingSender = {
      id: 7,
      type: "transactional",
      emailAddress: "hello@notify.example.com",
      domain: "notify.example.com",
      displayName: "Example",
      replyToEmail: null,
      provider: "amazon_ses",
      status: "pending_verification",
      isDefault: false,
    };
    const prisma = {
      emailSender: { findFirst: async () => pendingSender },
      emailTemplate: { count: async () => 0 },
    };
    const service = new EmailSendersService(prisma as never, {} as never, {} as never);
    await assert.rejects(() => service.setDefault(7, 1, context), BadRequestException);

    pendingSender.status = "verified";
    pendingSender.isDefault = true;
    await assert.rejects(
      () => service.update(7, { status: "disabled" }, 1, context),
      BadRequestException,
    );
  });

  it("rejects public mailbox domains before calling Amazon SES", async () => {
    const service = new EmailSendersService({} as never, {} as never, {} as never);
    await assert.rejects(
      () => service.create({
        type: "transactional",
        emailAddress: "team@gmail.com",
        domain: "gmail.com",
        displayName: "Team",
      }, 1, context),
      BadRequestException,
    );
  });
});
