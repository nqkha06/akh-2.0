import { Body, Controller, HttpCode, Post } from "@nestjs/common";

import { SesWebhookService } from "./ses-webhook.service";

@Controller("webhooks/aws/ses")
export class AwsSesWebhookController {
  constructor(private readonly webhook: SesWebhookService) {}

  @Post()
  @HttpCode(200)
  handle(@Body() body: unknown) {
    return this.webhook.handle(body);
  }
}
