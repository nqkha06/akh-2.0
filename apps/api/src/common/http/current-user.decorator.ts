import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

type RequestWithUser = {
  user?: unknown;
};

export const CurrentUser = createParamDecorator(
  (_data: undefined, context: ExecutionContext): unknown =>
    context.switchToHttp().getRequest<RequestWithUser>().user,
);
