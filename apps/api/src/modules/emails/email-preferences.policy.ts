import { BadRequestException } from "@nestjs/common";

export type MarketingEligibilityInput = {
  marketingEnabled: boolean;
  senderVerified: boolean;
  userActive: boolean;
  topicEnabled: boolean;
  topicRequired: boolean;
  subscribed: boolean;
  suppressed: boolean;
};

export function assertMarketingEligible(input: MarketingEligibilityInput) {
  if (!input.marketingEnabled) {
    throw new BadRequestException("Email marketing đang tạm dừng.");
  }
  if (!input.senderVerified) {
    throw new BadRequestException("Sender marketing chưa được xác minh.");
  }
  if (!input.userActive) {
    throw new BadRequestException("Người nhận không còn hoạt động.");
  }
  if (!input.topicEnabled || input.topicRequired) {
    throw new BadRequestException("Topic marketing không hợp lệ hoặc đã tắt.");
  }
  if (!input.subscribed) {
    throw new BadRequestException("Người nhận chưa opt-in topic marketing này.");
  }
  if (input.suppressed) {
    throw new BadRequestException("Email người nhận đang nằm trong suppression list.");
  }
}

export function assertPreferenceChangeAllowed(input: {
  category: string;
  isRequired: boolean;
  isSubscribed: boolean;
}) {
  if (
    !input.isSubscribed &&
    (input.isRequired || input.category === "transactional")
  ) {
    throw new BadRequestException(
      "Không thể unsubscribe topic transactional hoặc bắt buộc.",
    );
  }
}
