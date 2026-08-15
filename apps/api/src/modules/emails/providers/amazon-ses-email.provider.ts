import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CreateEmailIdentityCommand,
  GetAccountCommand,
  GetConfigurationSetCommand,
  GetEmailIdentityCommand,
  SendEmailCommand,
  SESv2Client,
} from "@aws-sdk/client-sesv2";

import { SES_CONFIGURATION_SETS } from "../email.constants";
import {
  EmailProviderError,
  mapProviderError,
} from "./email-provider.errors";
import type {
  EmailProvider,
  ProviderHealth,
  ProviderSendInput,
  SenderDnsRecord,
  SenderIdentityResult,
  SendEmailResult,
} from "./email-provider";

@Injectable()
export class AmazonSesEmailProvider implements EmailProvider {
  constructor(private readonly config: ConfigService) {}

  async checkConnection(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    if (!this.hasCredentials()) {
      return {
        provider: "amazon_ses",
        status: "incomplete",
        message: "AWS credentials chưa được cấu hình trên server.",
        region: this.region(),
        trackingSupported: false,
        configurationSetsReady: false,
        checkedAt,
      };
    }

    try {
      const client = this.client();
      await client.send(new GetAccountCommand({}));
      const configurationSetsReady = await this.checkConfigurationSets(client);
      return {
        provider: "amazon_ses",
        status: "configured",
        message: configurationSetsReady
          ? "Kết nối Amazon SES thành công."
          : "Amazon SES đã kết nối, nhưng configuration set transactional/marketing chưa đầy đủ.",
        region: this.region(),
        trackingSupported: configurationSetsReady,
        configurationSetsReady,
        checkedAt,
      };
    } catch (error) {
      const mapped = mapProviderError(error);
      return {
        provider: "amazon_ses",
        status: "unavailable",
        message: mapped.message,
        region: this.region(),
        trackingSupported: false,
        configurationSetsReady: false,
        checkedAt,
      };
    }
  }

  async createOrGetIdentity(input: {
    domain: string;
  }): Promise<SenderIdentityResult> {
    this.assertConfigured();
    const client = this.client();
    try {
      await client.send(
        new CreateEmailIdentityCommand({ EmailIdentity: input.domain }),
      );
    } catch (error) {
      const name = (error as { name?: string } | null)?.name;
      if (name !== "AlreadyExistsException") throw mapProviderError(error);
    }
    return this.getIdentityStatus(input.domain);
  }

  async getIdentityStatus(identity: string): Promise<SenderIdentityResult> {
    this.assertConfigured();
    try {
      const result = await this.client().send(
        new GetEmailIdentityCommand({ EmailIdentity: identity }),
      );
      const verified = Boolean(result.VerifiedForSendingStatus);
      const failed =
        result.VerificationStatus === "FAILED" ||
        result.DkimAttributes?.Status === "FAILED";
      return {
        identity,
        status: verified
          ? "verified"
          : failed
            ? "failed"
            : "pending_verification",
        dnsRecords: this.dnsRecords(
          identity,
          result.DkimAttributes?.Tokens || [],
        ),
        verifiedAt: verified ? new Date() : null,
        error: failed
          ? "Amazon SES báo xác minh domain thất bại. Kiểm tra lại DNS records."
          : null,
        warnings: this.identityWarnings(result),
      };
    } catch (error) {
      throw mapProviderError(error);
    }
  }

  sendEmail(input: ProviderSendInput) {
    return this.send(input);
  }

  sendTestEmail(input: ProviderSendInput) {
    return this.send(input);
  }

  private async send(input: ProviderSendInput): Promise<SendEmailResult> {
    this.assertConfigured();
    try {
      const configurationSet =
        input.type === "marketing"
          ? SES_CONFIGURATION_SETS.marketing
          : SES_CONFIGURATION_SETS.transactional;
      const result = await this.client().send(
        new SendEmailCommand({
          FromEmailAddress: `${this.safeDisplayName(input.fromName)} <${input.fromEmail}>`,
          Destination: { ToAddresses: [input.recipientEmail] },
          ReplyToAddresses: input.replyToEmail
            ? [input.replyToEmail]
            : undefined,
          ConfigurationSetName: configurationSet,
          Content: {
            Simple: {
              Subject: { Data: input.subject, Charset: "UTF-8" },
              Body: {
                Html: { Data: input.html, Charset: "UTF-8" },
                Text: { Data: input.text, Charset: "UTF-8" },
              },
            },
          },
          EmailTags: [
            { Name: "type", Value: input.type },
            {
              Name: "template_code",
              Value: input.templateCode || "ad_hoc",
            },
            {
              Name: "template_version",
              Value: String(input.templateVersion || 0),
            },
            { Name: "message_id", Value: input.messageId },
          ],
        }),
      );
      if (!result.MessageId) {
        throw new EmailProviderError(
          "Amazon SES không trả về message ID.",
          "MISSING_MESSAGE_ID",
        );
      }
      return { providerMessageId: result.MessageId, acceptedAt: new Date() };
    } catch (error) {
      throw mapProviderError(error);
    }
  }

  private client() {
    const region = this.region();
    if (!region) {
      throw new EmailProviderError(
        "AWS_REGION chưa được cấu hình trên server.",
        "AWS_CONFIG_INCOMPLETE",
      );
    }
    return new SESv2Client({
      region,
      credentials: {
        accessKeyId: this.config.get<string>("AWS_ACCESS_KEY_ID") || "",
        secretAccessKey:
          this.config.get<string>("AWS_SECRET_ACCESS_KEY") || "",
      },
    });
  }

  private hasCredentials() {
    return Boolean(
      this.region() &&
        this.config.get<string>("AWS_ACCESS_KEY_ID")?.trim() &&
        this.config.get<string>("AWS_SECRET_ACCESS_KEY")?.trim(),
    );
  }

  private assertConfigured() {
    if (!this.hasCredentials()) {
      throw new EmailProviderError(
        "AWS credentials chưa được cấu hình trên server.",
        "AWS_CONFIG_INCOMPLETE",
      );
    }
  }

  private region() {
    return this.config.get<string>("AWS_REGION")?.trim() || null;
  }

  private async checkConfigurationSets(client: SESv2Client) {
    try {
      await Promise.all(
        Object.values(SES_CONFIGURATION_SETS).map((name) =>
          client.send(new GetConfigurationSetCommand({ ConfigurationSetName: name })),
        ),
      );
      return true;
    } catch {
      return false;
    }
  }

  private dnsRecords(domain: string, dkimTokens: string[]): SenderDnsRecord[] {
    const dkim = dkimTokens.map<SenderDnsRecord>((token) => ({
      type: "CNAME",
      name: `${token}._domainkey.${domain}`,
      value: `${token}.dkim.amazonses.com`,
      purpose: "dkim",
      required: true,
    }));
    return [
      ...dkim,
      {
        type: "TXT",
        name: domain,
        value: "v=spf1 include:amazonses.com ~all",
        purpose: "spf",
        required: false,
      },
      {
        type: "TXT",
        name: `_dmarc.${domain}`,
        value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
        purpose: "dmarc",
        required: false,
      },
    ];
  }

  private identityWarnings(result: {
    MailFromAttributes?: { MailFromDomainStatus?: string };
    DkimAttributes?: { Status?: string };
  }) {
    const warnings: string[] = [];
    if (result.DkimAttributes?.Status !== "SUCCESS") {
      warnings.push("DKIM chưa sẵn sàng.");
    }
    if (result.MailFromAttributes?.MailFromDomainStatus !== "SUCCESS") {
      warnings.push("Custom MAIL FROM chưa sẵn sàng.");
    }
    warnings.push("Hãy xác nhận SPF và DMARC tại DNS provider.");
    return warnings;
  }

  private safeDisplayName(value: string) {
    return `"${value.replace(/["\r\n]/g, "").slice(0, 120)}"`;
  }
}
