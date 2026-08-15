import { Module } from "@nestjs/common";

import { EmailActivityController } from "./email-activity.controller";
import { EmailActivityService } from "./email-activity.service";
import { EmailDeliveryService } from "./email-delivery.service";
import { EmailPreferencesController } from "./email-preferences.controller";
import { EmailPreferencesService } from "./email-preferences.service";
import { EmailSendersController } from "./email-senders.controller";
import { EmailSendersService } from "./email-senders.service";
import { EmailSettingsController } from "./email-settings.controller";
import { EmailSettingsService } from "./email-settings.service";
import { EmailTemplatesController } from "./email-templates.controller";
import { EmailTemplatesService } from "./email-templates.service";
import { AmazonSesEmailProvider } from "./providers/amazon-ses-email.provider";
import { EmailProviderFactory } from "./providers/email-provider.factory";
import { AwsSesWebhookController } from "./webhook/aws-ses-webhook.controller";
import { SesWebhookService } from "./webhook/ses-webhook.service";
import { SnsSignatureVerifier } from "./webhook/sns-signature-verifier";

@Module({
  controllers: [
    EmailActivityController,
    EmailPreferencesController,
    EmailSendersController,
    EmailSettingsController,
    EmailTemplatesController,
    AwsSesWebhookController,
  ],
  providers: [
    AmazonSesEmailProvider,
    EmailProviderFactory,
    EmailSettingsService,
    EmailSendersService,
    EmailTemplatesService,
    EmailPreferencesService,
    EmailDeliveryService,
    EmailActivityService,
    SnsSignatureVerifier,
    SesWebhookService,
  ],
  exports: [
    EmailProviderFactory,
    EmailSettingsService,
    EmailPreferencesService,
    EmailDeliveryService,
  ],
})
export class EmailsModule {}
