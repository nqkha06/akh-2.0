import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

import { RequestContextService } from "./request-context.service";

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{8,128}$/;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(request: Request, response: Response, next: NextFunction) {
    const supplied = request.get("x-request-id")?.trim();
    const requestId =
      supplied && REQUEST_ID_PATTERN.test(supplied) ? supplied : randomUUID();
    response.setHeader("x-request-id", requestId);
    this.requestContext.run(
      {
        requestId,
        method: request.method,
        path: request.originalUrl || request.url,
        ipAddress: request.ip || null,
        userAgent: request.get("user-agent") || null,
      },
      next,
    );
  }
}
