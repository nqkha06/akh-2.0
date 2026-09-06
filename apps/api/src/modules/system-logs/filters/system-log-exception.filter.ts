import { ArgumentsHost, Catch, HttpException, Logger } from "@nestjs/common";
import { BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";
import type { Request } from "express";

import { SystemLogService } from "../system-log.service";

@Catch()
export class SystemLogExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SystemLogExceptionFilter.name);

  constructor(
    adapterHost: HttpAdapterHost,
    private readonly systemLogs: SystemLogService,
  ) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    if (status >= 500) {
      const request = host.switchToHttp().getRequest<Request>();
      const error = exception instanceof Error ? exception : new Error(String(exception));
      void this.systemLogs.error({
        category: "ERROR",
        context: "GlobalExceptionFilter",
        event: "unhandled_http_exception",
        message: error.message,
        stack: error.stack,
        metadata: {
          exceptionName: error.name,
          path: request.originalUrl || request.url,
          method: request.method,
          statusCode: status,
        },
      }).catch((loggingError) => {
        this.logger.error(`Không thể ghi exception vào system logs: ${String(loggingError)}`);
      });
    }
    super.catch(exception, host);
  }
}
