import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createVerify } from "node:crypto";

export type SnsEnvelope = {
  Type: "Notification" | "SubscriptionConfirmation" | "UnsubscribeConfirmation";
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: "1" | "2";
  Signature: string;
  SigningCertURL: string;
  SubscribeURL?: string;
  Token?: string;
};

@Injectable()
export class SnsSignatureVerifier {
  private readonly certificates = new Map<string, { pem: string; expiresAt: number }>();

  constructor(private readonly config: ConfigService) {}

  async verify(envelope: SnsEnvelope) {
    this.validateEnvelope(envelope);
    const certificate = await this.certificate(envelope.SigningCertURL);
    const algorithm = envelope.SignatureVersion === "1" ? "RSA-SHA1" : "RSA-SHA256";
    const verifier = createVerify(algorithm);
    verifier.update(this.canonicalString(envelope), "utf8");
    verifier.end();
    const valid = verifier.verify(certificate, envelope.Signature, "base64");
    if (!valid) throw new BadRequestException("Chữ ký AWS SNS không hợp lệ.");
    return true;
  }

  private validateEnvelope(envelope: SnsEnvelope) {
    if (
      !envelope ||
      !["Notification", "SubscriptionConfirmation", "UnsubscribeConfirmation"].includes(
        envelope.Type,
      ) ||
      !envelope.MessageId ||
      !envelope.TopicArn ||
      !envelope.Message ||
      !envelope.Timestamp ||
      !["1", "2"].includes(envelope.SignatureVersion) ||
      !envelope.Signature ||
      !envelope.SigningCertURL
    ) {
      throw new BadRequestException("AWS SNS envelope không hợp lệ.");
    }
    const timestamp = new Date(envelope.Timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      throw new BadRequestException("AWS SNS timestamp không hợp lệ.");
    }
    if (Math.abs(Date.now() - timestamp.getTime()) > 24 * 60 * 60 * 1_000) {
      throw new BadRequestException("AWS SNS message đã quá thời gian xử lý an toàn.");
    }
    const allowedTopics = (this.config.get<string>("AWS_SES_SNS_TOPIC_ARNS") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (allowedTopics.length && !allowedTopics.includes(envelope.TopicArn)) {
      throw new BadRequestException("AWS SNS topic không được phép.");
    }
    this.validateAwsUrl(envelope.SigningCertURL, "certificate");
    if (envelope.SubscribeURL) this.validateAwsUrl(envelope.SubscribeURL, "subscribe");
  }

  private canonicalString(envelope: SnsEnvelope) {
    const fields =
      envelope.Type === "Notification"
        ? ["Message", "MessageId", ...(envelope.Subject ? ["Subject"] : []), "Timestamp", "TopicArn", "Type"]
        : ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"];
    return fields
      .map((field) => `${field}\n${String(envelope[field as keyof SnsEnvelope] || "")}\n`)
      .join("");
  }

  private async certificate(url: string) {
    const cached = this.certificates.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.pem;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("certificate_download_failed");
      const pem = await response.text();
      if (!pem.includes("BEGIN CERTIFICATE") || pem.length > 100_000) {
        throw new Error("invalid_certificate");
      }
      this.certificates.set(url, { pem, expiresAt: Date.now() + 60 * 60 * 1_000 });
      return pem;
    } catch {
      throw new BadRequestException("Không thể xác minh certificate AWS SNS.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private validateAwsUrl(value: string, purpose: "certificate" | "subscribe") {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException("AWS SNS URL không hợp lệ.");
    }
    const trustedHost =
      url.hostname === "sns.amazonaws.com" ||
      /^sns\.[a-z0-9-]+\.amazonaws\.com(?:\.cn)?$/i.test(url.hostname);
    if (url.protocol !== "https:" || url.port || !trustedHost) {
      throw new BadRequestException("AWS SNS URL không thuộc trusted host.");
    }
    if (
      purpose === "certificate" &&
      !/^\/SimpleNotificationService-[A-Za-z0-9_-]+\.pem$/.test(url.pathname)
    ) {
      throw new BadRequestException("AWS SNS certificate URL không hợp lệ.");
    }
  }
}
