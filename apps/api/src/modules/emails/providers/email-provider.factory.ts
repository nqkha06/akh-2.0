import { Injectable } from "@nestjs/common";

import type { EmailProviderName } from "../email.constants";
import { AmazonSesEmailProvider } from "./amazon-ses-email.provider";
import { EmailProviderError } from "./email-provider.errors";
import type { EmailProvider } from "./email-provider";

@Injectable()
export class EmailProviderFactory {
  constructor(private readonly amazonSes: AmazonSesEmailProvider) {}

  get(provider: EmailProviderName): EmailProvider {
    if (provider === "amazon_ses") return this.amazonSes;
    throw new EmailProviderError(
      `Provider ${provider} chưa được triển khai trong phase này.`,
      "PROVIDER_NOT_IMPLEMENTED",
    );
  }
}
