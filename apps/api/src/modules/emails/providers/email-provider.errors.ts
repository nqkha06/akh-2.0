export class EmailProviderError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "EmailProviderError";
  }
}

export function mapProviderError(error: unknown): EmailProviderError {
  if (error instanceof EmailProviderError) return error;
  const candidate = error as { name?: string; Code?: string } | null;
  const code = candidate?.name || candidate?.Code || "PROVIDER_ERROR";
  const messages: Record<string, string> = {
    AccessDeniedException:
      "AWS credentials không có đủ quyền truy cập Amazon SES.",
    UnrecognizedClientException:
      "AWS credentials không hợp lệ hoặc đã hết hiệu lực.",
    InvalidClientTokenId: "AWS access key không hợp lệ.",
    SignatureDoesNotMatch: "AWS secret access key không hợp lệ.",
    TooManyRequestsException:
      "Amazon SES đang giới hạn tần suất. Vui lòng thử lại sau.",
    MessageRejected:
      "Amazon SES từ chối email. Kiểm tra sender, recipient và SES sandbox.",
    MailFromDomainNotVerifiedException:
      "MAIL FROM domain chưa được Amazon SES xác minh.",
    BadRequestException: "Amazon SES từ chối dữ liệu yêu cầu.",
  };
  return new EmailProviderError(
    messages[code] || "Không thể kết nối Amazon SES. Vui lòng kiểm tra cấu hình server.",
    code,
  );
}
